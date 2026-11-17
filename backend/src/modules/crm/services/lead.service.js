const mongoose = require('mongoose');
const Lead = require('../models/lead.model');
const LeadStage = require('../models/leadStage.model');
const LeadStageHistory = require('../models/leadStageHistory.model');
const Enquiry = require('../models/enquiry.model');
const Project = require('../../master/models/project.model');
require('../../auth/models/user.model'); // Ensure User schema is registered for populate

// Helper to escape regex special characters
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Generate sequential lead number LD-00001, LD-00002...
 */
async function generateLeadNumber() {
  const count = await Lead.countDocuments();
  const nextNum = count + 1;
  return `LD-${String(nextNum).padStart(5, '0')}`;
}

/**
 * Get all available active lead stages in sequential order
 */
async function listStages() {
  return LeadStage.find({ isActive: true, deletedAt: null }).sort({ order: 1 }).lean();
}

/**
 * List leads with filters, search, pagination, and KPI counts
 */
async function listLeads(query = {}) {
  const {
    search,
    stageId,
    status = 'all',
    temperature = 'all',
    assignedTo,
    page = 1,
    limit = 50,
  } = query;

  const filter = { deletedAt: null };

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (temperature && temperature !== 'all') {
    filter.temperature = temperature;
  }

  if (stageId && stageId !== 'all') {
    filter.currentStageId = stageId;
  }

  if (assignedTo && assignedTo !== 'all') {
    filter.assignedTo = assignedTo;
  }

  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [
      { clientName: rx },
      { clientPhone: rx },
      { leadNumber: rx },
      { project: rx },
      { city: rx },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const pageLimit = Math.max(1, Math.min(100, Number(limit)));

  const [leads, totalCount] = await Promise.all([
    Lead.find(filter)
      .populate('currentStageId')
      .populate('assignedTo', 'name email avatar role')
      .populate('visitAssignedTo', 'name email avatar role')
      .populate('finalizedProjectId', 'name code city')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageLimit)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  // Compute aggregated KPIs
  const allLeadsFilter = { deletedAt: null };
  const [totalLeads, activePipeline, visitStageCount, wonDeals, droppedCount] = await Promise.all([
    Lead.countDocuments(allLeadsFilter),
    Lead.countDocuments({ ...allLeadsFilter, status: 'active' }),
    Lead.countDocuments({ ...allLeadsFilter, currentStageOrder: { $in: [4, 5] }, status: 'active' }),
    Lead.countDocuments({ ...allLeadsFilter, status: 'won' }),
    Lead.countDocuments({ ...allLeadsFilter, status: { $in: ['dropped', 'lost'] } }),
  ]);

  // Compute counts per stage
  const stages = await listStages();
  const stageCounts = await Lead.aggregate([
    { $match: { deletedAt: null, status: 'active' } },
    { $group: { _id: '$currentStageId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  stageCounts.forEach((sc) => {
    if (sc._id) countMap[String(sc._id)] = sc.count;
  });

  const stagesWithCounts = stages.map((st) => ({
    ...st,
    count: countMap[String(st._id)] || 0,
  }));

  return {
    leads,
    pagination: {
      total: totalCount,
      page: Number(page),
      limit: pageLimit,
      totalPages: Math.ceil(totalCount / pageLimit) || 1,
    },
    kpis: {
      totalLeads,
      activePipeline,
      visitStageCount,
      wonDeals,
      droppedCount,
    },
    stages: stagesWithCounts,
  };
}

/**
 * Get lead details by ID including stage history
 */
async function getLeadById(id) {
  const lead = await Lead.findOne({ _id: id, deletedAt: null })
    .populate('currentStageId')
    .populate('assignedTo', 'name email phone avatar role')
    .populate('visitAssignedTo', 'name email phone avatar role')
    .populate('finalizedProjectId')
    .populate('createdBy', 'name email')
    .lean();

  if (!lead) {
    throw new Error('Lead not found');
  }

  const history = await LeadStageHistory.find({ leadId: id })
    .sort({ movedAt: -1 })
    .populate('movedBy', 'name email')
    .lean();

  return {
    ...lead,
    stageHistory: history,
  };
}

/**
 * Promote a qualified Enquiry into an active Lead in Stage 1
 */
async function createFromEnquiry(enquiryId, actorId = null, actorName = 'System') {
  const enquiry = await Enquiry.findById(enquiryId);
  if (!enquiry) {
    throw new Error('Enquiry not found');
  }

  // Check if lead already exists for this enquiry
  const existingLead = await Lead.findOne({ enquiryId, deletedAt: null });
  if (existingLead) {
    return existingLead;
  }

  // Get initial stage (order 1)
  const initialStage = await LeadStage.findOne({ order: 1, isActive: true });
  if (!initialStage) {
    throw new Error('Initial lead stage not configured in system');
  }

  const leadNumber = await generateLeadNumber();

  const lead = await Lead.create({
    leadNumber,
    enquiryId: enquiry._id,
    clientName: enquiry.clientName,
    clientPhone: enquiry.clientPhone,
    alternatePhone: enquiry.alternatePhone || '',
    clientEmail: enquiry.clientEmail || '',
    city: enquiry.city || '',
    currentStageId: initialStage._id,
    currentStageName: initialStage.name,
    currentStageOrder: initialStage.order,
    temperature: enquiry.temperature || 'warm',
    source: enquiry.source || 'phone',
    project: enquiry.project || '',
    projectId: enquiry.projectId || null,
    propertyType: enquiry.propertyType || 'plot',
    budget: enquiry.budget || 0,
    status: 'active',
    notes: enquiry.notes || '',
    createdBy: actorId,
  });

  // Record initial stage history entry
  await LeadStageHistory.create({
    leadId: lead._id,
    fromStageId: null,
    toStageId: initialStage._id,
    fromStageName: 'Enquiry Intake',
    toStageName: initialStage.name,
    movedBy: actorId,
    movedByName: actorName,
    comment: 'Lead initiated from qualified enquiry screening.',
    actualAt: new Date(),
  });

  // Mark Enquiry as converted
  enquiry.status = 'converted';
  await enquiry.save();

  return lead;
}

/**
 * Create a direct walk-in or manual Lead
 */
async function createDirectLead(data, actorId = null, actorName = 'Sales Executive') {
  const initialStage = await LeadStage.findOne({ order: 1, isActive: true });
  if (!initialStage) {
    throw new Error('Initial lead stage not configured in system');
  }

  const leadNumber = await generateLeadNumber();

  const lead = await Lead.create({
    leadNumber,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    alternatePhone: data.alternatePhone || '',
    clientEmail: data.clientEmail || '',
    city: data.city || '',
    currentStageId: initialStage._id,
    currentStageName: initialStage.name,
    currentStageOrder: initialStage.order,
    temperature: data.temperature || 'warm',
    source: data.source || 'walk-in',
    project: data.project || '',
    projectId: data.projectId || null,
    propertyType: data.propertyType || 'plot',
    budget: Number(data.budget) || 0,
    expectedRevenue: Number(data.expectedRevenue) || 0,
    isWalkIn: Boolean(data.isWalkIn),
    notes: data.notes || '',
    createdBy: actorId,
  });

  await LeadStageHistory.create({
    leadId: lead._id,
    fromStageId: null,
    toStageId: initialStage._id,
    fromStageName: 'Direct Registration',
    toStageName: initialStage.name,
    movedBy: actorId,
    movedByName: actorName,
    comment: data.comment || 'Direct client lead registered.',
    actualAt: new Date(),
  });

  return lead;
}

/**
 * Advance or transition Lead stage
 */
async function moveStage(id, payload, actorId = null, actorName = 'Sales Rep') {
  const { toStageId, comment = '', plannedAt = null, attachments = [] } = payload;

  const lead = await Lead.findOne({ _id: id, deletedAt: null });
  if (!lead) throw new Error('Lead not found');

  const targetStage = await LeadStage.findById(toStageId);
  if (!targetStage) throw new Error('Target lead stage not found');

  const prevStageId = lead.currentStageId;
  const prevStageName = lead.currentStageName;

  lead.currentStageId = targetStage._id;
  lead.currentStageName = targetStage.name;
  lead.currentStageOrder = targetStage.order;
  lead.plannedStageAt = plannedAt ? new Date(plannedAt) : null;
  lead.actualStageAt = new Date();
  lead.lastActivityAt = new Date();
  lead.updatedBy = actorId;

  await lead.save();

  // Create stage history record
  const history = await LeadStageHistory.create({
    leadId: lead._id,
    fromStageId: prevStageId,
    toStageId: targetStage._id,
    fromStageName: prevStageName,
    toStageName: targetStage.name,
    movedBy: actorId,
    movedByName: actorName,
    plannedAt: plannedAt ? new Date(plannedAt) : null,
    actualAt: new Date(),
    comment,
    attachments,
  });

  return { lead, history };
}

/**
 * Undo last stage transition and revert to previous stage
 */
async function undoStage(id, actorId = null, actorName = 'Sales Rep') {
  const lead = await Lead.findOne({ _id: id, deletedAt: null });
  if (!lead) throw new Error('Lead not found');

  // Find the latest non-undo stage movement
  const lastMovement = await LeadStageHistory.findOne({
    leadId: id,
    isUndo: false,
    fromStageId: { $ne: null },
  }).sort({ movedAt: -1 });

  if (!lastMovement) {
    throw new Error('No previous stage transition found to undo');
  }

  const prevStage = await LeadStage.findById(lastMovement.fromStageId);
  if (!prevStage) {
    throw new Error('Original previous stage not found in registry');
  }

  const revertedFromStageName = lead.currentStageName;

  lead.currentStageId = prevStage._id;
  lead.currentStageName = prevStage.name;
  lead.currentStageOrder = prevStage.order;
  lead.lastActivityAt = new Date();
  lead.updatedBy = actorId;
  await lead.save();

  // Record undo entry
  const undoEntry = await LeadStageHistory.create({
    leadId: lead._id,
    fromStageId: lastMovement.toStageId,
    toStageId: prevStage._id,
    fromStageName: revertedFromStageName,
    toStageName: prevStage.name,
    movedBy: actorId,
    movedByName: actorName,
    comment: `Undone previous move to ${revertedFromStageName}. Reverted to ${prevStage.name}.`,
    isUndo: true,
    undoneEntryId: lastMovement._id,
    actualAt: new Date(),
  });

  return { lead, undoEntry };
}

/**
 * Mark lead as Won: records sold unit, yards, transaction value
 */
async function markWon(id, data, actorId = null, actorName = 'Sales Closer') {
  const lead = await Lead.findOne({ _id: id, deletedAt: null });
  if (!lead) throw new Error('Lead not found');

  if (lead.status === 'won') {
    throw new Error('Lead is already marked as won');
  }

  let finalizedProjectName = '';
  let finalizedUnitNumber = '';

  if (data.finalizedProjectId) {
    const project = await Project.findById(data.finalizedProjectId);
    if (project) {
      finalizedProjectName = project.name;
      if (data.finalizedUnitId && Array.isArray(project.units)) {
        const unit = project.units.id(data.finalizedUnitId);
        if (unit) {
          finalizedUnitNumber = unit.unitNumber;
          unit.status = 'booked';
          await project.save();
        }
      }
    }
  }

  lead.status = 'won';
  lead.finalizedProjectId = data.finalizedProjectId || null;
  lead.finalizedProjectName = finalizedProjectName || data.finalizedProjectName || '';
  lead.finalizedUnitId = data.finalizedUnitId || null;
  lead.finalizedUnitNumber = finalizedUnitNumber || data.finalizedUnitNumber || '';
  lead.yards = Number(data.yards) || 0;
  lead.actualValue = Number(data.actualValue) || 0;
  lead.closedAt = new Date();
  lead.lastActivityAt = new Date();
  lead.updatedBy = actorId;

  await lead.save();

  // Audit history
  await LeadStageHistory.create({
    leadId: lead._id,
    fromStageId: lead.currentStageId,
    toStageId: lead.currentStageId,
    fromStageName: lead.currentStageName,
    toStageName: 'Deal Closed (Won)',
    movedBy: actorId,
    movedByName: actorName,
    comment: `Deal Won! Project: ${lead.finalizedProjectName || 'N/A'}, Unit: ${lead.finalizedUnitNumber || 'N/A'}, Yards: ${lead.yards} sq yds, Value: ₹${lead.actualValue.toLocaleString('en-IN')}. ${data.comment || ''}`.trim(),
    actualAt: new Date(),
  });

  return lead;
}

/**
 * Mark lead as Lost
 */
async function markLost(id, data, actorId = null, actorName = 'Sales Rep') {
  const lead = await Lead.findOne({ _id: id, deletedAt: null });
  if (!lead) throw new Error('Lead not found');

  lead.status = 'lost';
  lead.lostReason = data.reason || 'Client purchased elsewhere / Budget mismatch';
  lead.closedAt = new Date();
  lead.lastActivityAt = new Date();
  lead.updatedBy = actorId;
  await lead.save();

  await LeadStageHistory.create({
    leadId: lead._id,
    fromStageId: lead.currentStageId,
    toStageId: lead.currentStageId,
    fromStageName: lead.currentStageName,
    toStageName: 'Deal Closed (Lost)',
    movedBy: actorId,
    movedByName: actorName,
    comment: `Lead marked as lost. Reason: ${lead.lostReason}. ${data.comment || ''}`.trim(),
    actualAt: new Date(),
  });

  return lead;
}

/**
 * Mark lead as Dropped
 */
async function markDropped(id, data, actorId = null, actorName = 'Sales Rep') {
  const lead = await Lead.findOne({ _id: id, deletedAt: null });
  if (!lead) throw new Error('Lead not found');

  lead.status = 'dropped';
  lead.dropReason = data.reason || 'Client unresponsive after multiple callbacks';
  lead.droppedBy = actorId;
  lead.closedAt = new Date();
  lead.lastActivityAt = new Date();
  lead.updatedBy = actorId;
  await lead.save();

  await LeadStageHistory.create({
    leadId: lead._id,
    fromStageId: lead.currentStageId,
    toStageId: lead.currentStageId,
    fromStageName: lead.currentStageName,
    toStageName: 'Lead Dropped',
    movedBy: actorId,
    movedByName: actorName,
    comment: `Lead dropped. Reason: ${lead.dropReason}. ${data.comment || ''}`.trim(),
    actualAt: new Date(),
  });

  return lead;
}

module.exports = {
  listStages,
  listLeads,
  getLeadById,
  createFromEnquiry,
  createDirectLead,
  moveStage,
  undoStage,
  markWon,
  markLost,
  markDropped,
};
