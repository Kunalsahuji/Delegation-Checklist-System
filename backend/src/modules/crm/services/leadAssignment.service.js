const mongoose = require('mongoose');
const Lead = require('../models/lead.model');
const LeadAssignment = require('../models/leadAssignment.model');
const Enquiry = require('../models/enquiry.model');
const User = require('../../auth/models/user.model');

// Dropped leads can be reassigned; won/lost stay locked
const REASSIGNABLE_TERMINAL = ['dropped'];
const TERMINAL_STATUSES = ['won', 'lost'];

/**
 * Get KPIs for Lead Assignment Strip
 */
const getKPIs = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    unassignedLeads,
    totalSalesPersons,
    totalActiveLeads,
    assignedToday,
    reassignmentsCount,
  ] = await Promise.all([
    Lead.countDocuments({ status: 'active', assignedTo: null }),
    User.countDocuments({ status: 'active' }),
    Lead.countDocuments({ status: 'active' }),
    LeadAssignment.countDocuments({ assignedAt: { $gte: startOfToday } }),
    LeadAssignment.countDocuments({
      $or: [{ triggerType: 'reassign' }, { previousAssignee: { $ne: null } }],
    }),
  ]);

  return {
    unassignedLeads,
    totalSalesPersons,
    totalActiveLeads,
    assignedToday,
    reassignmentsCount,
  };
};

/**
 * Get Sales Workload Distribution
 */
const getWorkload = async () => {
  const activeUsers = await User.find({ status: 'active' }).select('name email role');
  const userIds = activeUsers.map((u) => u._id);

  // Group active leads by assignedTo
  const leadCounts = await Lead.aggregate([
    {
      $match: {
        status: 'active',
        assignedTo: { $in: userIds },
      },
    },
    {
      $group: {
        _id: '$assignedTo',
        totalLeads: { $sum: 1 },
      },
    },
  ]);

  const countMap = {};
  leadCounts.forEach((lc) => {
    countMap[String(lc._id)] = lc.totalLeads;
  });

  const totalAssigned = leadCounts.reduce((acc, curr) => acc + curr.totalLeads, 0);

  const workload = activeUsers.map((user) => {
    const total = countMap[String(user._id)] || 0;
    const percentage = totalAssigned > 0 ? Math.round((total / totalAssigned) * 100) : 0;
    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      total,
      percentage,
    };
  });

  workload.sort((a, b) => b.total - a.total);
  return workload;
};

/**
 * List Qualified Leads for Assignment Workspace
 */
const listQualifiedLeads = async (query = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    assignmentStatus = 'all', // 'all', 'unassigned', 'assigned'
    temperature = '',
    stageId = '',
    from,
    to,
  } = query;

  const filter = { status: { $in: ['active', 'dropped'] } };

  if (assignmentStatus === 'unassigned') {
    filter.assignedTo = null;
  } else if (assignmentStatus === 'assigned') {
    filter.assignedTo = { $ne: null };
  }

  if (temperature) {
    filter.temperature = temperature;
  }

  if (stageId) {
    filter.currentStageId = stageId;
  }

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { clientName: { $regex: term, $options: 'i' } },
      { clientPhone: { $regex: term, $options: 'i' } },
      { clientEmail: { $regex: term, $options: 'i' } },
      { leadNumber: { $regex: term, $options: 'i' } },
      { project: { $regex: term, $options: 'i' } },
      { city: { $regex: term, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('currentStageId', 'name colorHex order')
      .populate('projectId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Lead.countDocuments(filter),
  ]);

  return {
    leads,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Assign a Lead to a Sales User
 */
const assignLead = async (leadId, { assignedTo, reason, triggerType = 'manual' }, actor = null) => {
  const lead = await Lead.findById(leadId).populate('assignedTo', 'name email');
  if (!lead) {
    const err = new Error('Lead not found');
    err.status = 404;
    throw err;
  }

  if (TERMINAL_STATUSES.includes(lead.status)) {
    const err = new Error(`Lead is ${lead.status} and cannot be reassigned`);
    err.status = 400;
    throw err;
  }

  const assignee = await User.findById(assignedTo);
  if (!assignee) {
    const err = new Error('Assignee user not found');
    err.status = 404;
    throw err;
  }

  if (assignee.status !== 'active') {
    const err = new Error('Selected assignee is inactive');
    err.status = 400;
    throw err;
  }

  const previousAssigneeId = lead.assignedTo?._id || lead.assignedTo || null;
  const previousAssigneeName = lead.assignedTo?.name || '';
  const wasDropped = lead.status === 'dropped';

  if (
    previousAssigneeId &&
    String(previousAssigneeId) === String(assignedTo) &&
    !wasDropped
  ) {
    const err = new Error('Lead is already assigned to this user');
    err.status = 400;
    throw err;
  }

  const isReassign = Boolean(previousAssigneeId && String(previousAssigneeId) !== String(assignedTo));
  if (isReassign && (!reason || reason.trim().length < 10)) {
    const err = new Error('Reassignment requires an explanation of at least 10 characters');
    err.status = 400;
    throw err;
  }

  const resolvedTriggerType = isReassign ? 'reassign' : (triggerType || 'manual');

  // Update lead
  lead.assignedTo = assignee._id;
  lead.assignedAt = new Date();
  if (wasDropped) {
    lead.status = 'active';
  }
  await lead.save();

  // Mirror salesperson to parent enquiry if present
  if (lead.enquiryId) {
    try {
      await Enquiry.findByIdAndUpdate(lead.enquiryId, {
        salesPerson: assignee._id,
        salesPersonName: assignee.name,
      });
    } catch (ignoreErr) {
      // Non-blocking mirror
    }
  }

  // Create audit record in LeadAssignment
  const assignmentRecord = await LeadAssignment.create({
    leadId: lead._id,
    assignedTo: assignee._id,
    assignedToName: assignee.name,
    assignedBy: actor?._id || null,
    assignedByName: actor?.name || 'System',
    previousAssignee: previousAssigneeId,
    previousAssigneeName: previousAssigneeName,
    assignedAt: new Date(),
    autoAssigned: triggerType === 'auto24h' || triggerType === 'roundRobin',
    triggerType: resolvedTriggerType,
    assignmentReason: reason || (isReassign ? 'Reassigned to representative' : 'Initial assignment'),
  });

  const updatedLead = await Lead.findById(leadId)
    .populate('assignedTo', 'name email role')
    .populate('currentStageId', 'name colorHex order');

  return { lead: updatedLead, assignment: assignmentRecord };
};

/**
 * Unassign a Lead
 */
const unassignLead = async (leadId, { reason }, actor = null) => {
  const lead = await Lead.findById(leadId).populate('assignedTo', 'name email');
  if (!lead) {
    const err = new Error('Lead not found');
    err.status = 404;
    throw err;
  }

  const previousAssigneeId = lead.assignedTo?._id || lead.assignedTo || null;
  const previousAssigneeName = lead.assignedTo?.name || '';

  lead.assignedTo = null;
  lead.assignedAt = null;
  await lead.save();

  if (lead.enquiryId) {
    try {
      await Enquiry.findByIdAndUpdate(lead.enquiryId, {
        salesPerson: null,
        salesPersonName: '',
      });
    } catch (ignoreErr) {
      // Non-blocking
    }
  }

  const assignmentRecord = await LeadAssignment.create({
    leadId: lead._id,
    assignedTo: null,
    assignedToName: 'Unassigned',
    assignedBy: actor?._id || null,
    assignedByName: actor?.name || 'System',
    previousAssignee: previousAssigneeId,
    previousAssigneeName: previousAssigneeName,
    assignedAt: new Date(),
    autoAssigned: false,
    triggerType: 'unassign',
    assignmentReason: reason || 'Lead unassigned from representative',
  });

  return { lead, assignment: assignmentRecord };
};

/**
 * Bulk Assign Multiple Leads
 */
const bulkAssign = async ({ leadIds = [], assignedTo, reason }, actor = null) => {
  if (!leadIds || !leadIds.length) {
    const err = new Error('No lead IDs provided for bulk assignment');
    err.status = 400;
    throw err;
  }

  const assignee = await User.findById(assignedTo);
  if (!assignee || assignee.status !== 'active') {
    const err = new Error('Active assignee user required for bulk assignment');
    err.status = 400;
    throw err;
  }

  const results = [];
  for (const leadId of leadIds) {
    try {
      const res = await assignLead(
        leadId,
        {
          assignedTo,
          reason: reason || 'Bulk assignment to sales representative',
          triggerType: 'bulk',
        },
        actor
      );
      results.push({ leadId, success: true, leadNumber: res.lead.leadNumber });
    } catch (err) {
      results.push({ leadId, success: false, error: err.message });
    }
  }

  return {
    totalRequested: leadIds.length,
    assignedCount: results.filter((r) => r.success).length,
    results,
  };
};

/**
 * Auto-Distribute Leads via Round-Robin based on lowest workload first
 */
const autoDistributeRoundRobin = async ({ leadIds }, actor = null) => {
  const activeUsers = await User.find({ status: 'active' }).select('name email');
  if (!activeUsers.length) {
    const err = new Error('No active sales users available for distribution');
    err.status = 400;
    throw err;
  }

  let targetLeads = [];
  if (leadIds && leadIds.length > 0) {
    targetLeads = await Lead.find({ _id: { $in: leadIds }, status: 'active' });
  } else {
    // Pick all unassigned active leads
    targetLeads = await Lead.find({ status: 'active', assignedTo: null }).sort({ createdAt: 1 });
  }

  if (!targetLeads.length) {
    return { assignedCount: 0, message: 'No unassigned leads found to distribute' };
  }

  // Calculate current workload of users to distribute fairly
  const leadCounts = await Lead.aggregate([
    { $match: { status: 'active', assignedTo: { $in: activeUsers.map((u) => u._id) } } },
    { $group: { _id: '$assignedTo', total: { $sum: 1 } } },
  ]);

  const workloadMap = {};
  activeUsers.forEach((u) => {
    workloadMap[String(u._id)] = 0;
  });
  leadCounts.forEach((c) => {
    workloadMap[String(c._id)] = c.total;
  });

  const distributed = [];
  for (const lead of targetLeads) {
    // Find user with lowest workload
    const sortedUsers = [...activeUsers].sort(
      (a, b) => (workloadMap[String(a._id)] || 0) - (workloadMap[String(b._id)] || 0)
    );
    const chosenUser = sortedUsers[0];

    await assignLead(
      lead._id,
      {
        assignedTo: chosenUser._id,
        reason: `Auto round-robin: workload balanced (current active: ${workloadMap[String(chosenUser._id)]})`,
        triggerType: 'roundRobin',
      },
      actor
    );

    workloadMap[String(chosenUser._id)] = (workloadMap[String(chosenUser._id)] || 0) + 1;
    distributed.push({
      leadId: lead._id,
      leadNumber: lead.leadNumber,
      assignedTo: chosenUser.name,
    });
  }

  return {
    assignedCount: distributed.length,
    distribution: distributed,
  };
};

/**
 * Get Assignment History for a Lead
 */
const getLeadAssignmentHistory = async (leadId) => {
  return LeadAssignment.find({ leadId })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role')
    .populate('previousAssignee', 'name email role')
    .sort({ assignedAt: -1 });
};

module.exports = {
  getKPIs,
  getWorkload,
  listQualifiedLeads,
  assignLead,
  unassignLead,
  bulkAssign,
  autoDistributeRoundRobin,
  getLeadAssignmentHistory,
};
