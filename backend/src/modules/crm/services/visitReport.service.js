const mongoose = require('mongoose');
const VisitReport = require('../models/visitReport.model');
const Lead = require('../models/lead.model');
const LeadStage = require('../models/leadStage.model');
const Project = require('../../master/models/project.model');
const User = require('../../auth/models/user.model');

/**
 * Calculates distance in meters between two lat/lng coordinates using Haversine formula
 */
function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (v) => (v * Math.PI) / 180;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Get Visit KPI Statistics
 */
const getStats = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const baseFilter = { deletedAt: null };

  const [total, geoVerified, today, month] = await Promise.all([
    VisitReport.countDocuments(baseFilter),
    VisitReport.countDocuments({ ...baseFilter, geoVerified: true }),
    VisitReport.countDocuments({ ...baseFilter, visitedAt: { $gte: startOfToday } }),
    VisitReport.countDocuments({ ...baseFilter, visitedAt: { $gte: startOfMonth } }),
  ]);

  return {
    total,
    geoVerified,
    today,
    month,
  };
};

/**
 * List Site Visits with Filtering & Pagination
 */
const listVisits = async (query = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    projectId = '',
    visitorId = '',
    geoVerified,
    from,
    to,
  } = query;

  const filter = { deletedAt: null };

  if (projectId) {
    filter.projectId = projectId;
  }

  if (visitorId) {
    filter.visitorId = visitorId;
  }

  if (geoVerified !== undefined && geoVerified !== '') {
    filter.geoVerified = String(geoVerified) === 'true';
  }

  if (from || to) {
    filter.visitedAt = {};
    if (from) filter.visitedAt.$gte = new Date(from);
    if (to) filter.visitedAt.$lte = new Date(to);
  }

  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { customerName: { $regex: term, $options: 'i' } },
      { contactNumber: { $regex: term, $options: 'i' } },
      { projectVisited: { $regex: term, $options: 'i' } },
      { visitorName: { $regex: term, $options: 'i' } },
      { salesPersonName: { $regex: term, $options: 'i' } },
      { remarks: { $regex: term, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [visits, total] = await Promise.all([
    VisitReport.find(filter)
      .populate('leadId', 'leadNumber clientName clientPhone temperature currentStageName assignedTo')
      .populate('visitorId', 'name email role')
      .populate('projectId', 'name location latitude longitude geoFenceRadius')
      .populate('createdBy', 'name email')
      .sort({ visitedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VisitReport.countDocuments(filter),
  ]);

  return {
    visits,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Get Visit by ID
 */
const getVisitById = async (id) => {
  const visit = await VisitReport.findOne({ _id: id, deletedAt: null })
    .populate('leadId')
    .populate('visitorId', 'name email role')
    .populate('projectId')
    .populate('createdBy', 'name email');

  if (!visit) {
    const err = new Error('Site visit report not found');
    err.status = 404;
    throw err;
  }

  return visit;
};

/**
 * Create a new Site Visit Report
 */
const createVisit = async (data, actor = null) => {
  let {
    leadId,
    customerName,
    contactNumber,
    visitorId,
    projectId,
    projectVisited,
    propertyInterested,
    firstPreference,
    secondPreference,
    customerBudget,
    customerProfession,
    customerAddress,
    sourceOfCustomer,
    seniorPerson,
    visitNumber,
    remarks,
    photoUrl,
    submittedLat,
    submittedLng,
    submittedAccuracy,
    visitedAt,
  } = data;

  // 1. Resolve Lead
  let lead = null;
  if (leadId) {
    lead = await Lead.findById(leadId).populate('assignedTo', 'name email');
  }

  if (!lead && contactNumber) {
    // Check if existing lead by phone
    lead = await Lead.findOne({ clientPhone: contactNumber, status: 'active' }).populate('assignedTo', 'name email');
  }

  // If still no lead, create a direct walk-in lead
  if (!lead) {
    let defaultStage = await LeadStage.findOne({ isDefault: true }) || await LeadStage.findOne().sort({ order: 1 });
    if (!defaultStage) {
      defaultStage = await LeadStage.create({
        name: 'Site Visit Completed',
        slug: 'site-visit-completed',
        order: 2,
        colorHex: '#10B981',
      });
    }

    const leadCount = await Lead.countDocuments();
    const nextSeq = String(leadCount + 1).padStart(5, '0');

    lead = await Lead.create({
      leadNumber: `LD-${nextSeq}`,
      clientName: customerName || 'Direct Site Visitor',
      clientPhone: contactNumber || '0000000000',
      currentStageId: defaultStage._id,
      currentStageName: defaultStage.name,
      currentStageOrder: defaultStage.order,
      temperature: 'hot',
      status: 'active',
      source: 'site-visit',
      project: projectVisited || '',
      projectId: projectId || null,
      budget: Number(customerBudget) || 0,
      assignedTo: actor?._id || null,
      assignedAt: new Date(),
    });
  }

  // 2. Resolve Visitor User
  let visitor = null;
  if (visitorId) {
    visitor = await User.findById(visitorId);
  }
  if (!visitor && actor) {
    visitor = await User.findById(actor._id);
  }

  // 3. Resolve Project
  let projectDoc = null;
  if (projectId) {
    projectDoc = await Project.findById(projectId);
  } else if (projectVisited) {
    projectDoc = await Project.findOne({ name: { $regex: `^${projectVisited}$`, $options: 'i' } });
  }

  // 4. Determine Visit Number (1st, 2nd, etc.)
  if (!visitNumber) {
    const existingCount = await VisitReport.countDocuments({
      leadId: lead._id,
      deletedAt: null,
    });
    if (existingCount === 0) visitNumber = '1st';
    else if (existingCount === 1) visitNumber = '2nd';
    else if (existingCount === 2) visitNumber = '3rd';
    else visitNumber = '4th+';
  }

  // 5. Geo-Fence Verification
  let geoVerified = false;
  let geoDistanceMeters = null;
  let geoMatchedLocation = '';

  const lat = Number(submittedLat);
  const lng = Number(submittedLng);

  if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0) {
    if (projectDoc && projectDoc.latitude && projectDoc.longitude) {
      const radius = projectDoc.geoFenceRadius || 500;
      const dist = calculateDistanceMeters(lat, lng, projectDoc.latitude, projectDoc.longitude);
      geoDistanceMeters = dist;
      if (dist <= radius) {
        geoVerified = true;
        geoMatchedLocation = `${projectDoc.name} Site`;
      }
    } else {
      // Coords captured accurately
      geoVerified = true;
      geoMatchedLocation = projectDoc?.name || 'On Site GPS Verified';
    }
  }

  // 6. Create the Visit Report
  const visitReport = await VisitReport.create({
    leadId: lead._id,
    enquiryId: lead.enquiryId || null,
    visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
    customerName: customerName || lead.clientName,
    contactNumber: contactNumber || lead.clientPhone,
    salesPersonName: lead.assignedTo?.name || '',
    visitorId: visitor?._id || actor?._id || null,
    visitorName: visitor?.name || actor?.name || '',
    projectId: projectDoc?._id || null,
    projectVisited: projectDoc?.name || projectVisited || lead.project || '',
    propertyInterested: propertyInterested || lead.propertyType || '',
    firstPreference: firstPreference || '',
    secondPreference: secondPreference || '',
    customerBudget: customerBudget || String(lead.budget || ''),
    customerProfession: customerProfession || '',
    customerAddress: customerAddress || '',
    sourceOfCustomer: sourceOfCustomer || lead.source || '',
    seniorPerson: seniorPerson || '',
    visitNumber,
    stageName: lead.currentStageName || '',
    stageOrder: lead.currentStageOrder || null,
    remarks: remarks || '',
    photoUrl: photoUrl || '',
    submittedLat: lat || null,
    submittedLng: lng || null,
    submittedAccuracy: Number(submittedAccuracy) || null,
    geoVerified,
    geoDistanceMeters,
    geoMatchedLocation,
    createdBy: actor?._id || null,
  });

  // Update lead's visitAssignedTo & temperature
  lead.visitAssignedTo = visitor?._id || actor?._id || null;
  lead.visitAssignedAt = new Date();
  if (lead.temperature === 'cold') lead.temperature = 'warm';
  await lead.save();

  return VisitReport.findById(visitReport._id)
    .populate('leadId')
    .populate('visitorId', 'name email role')
    .populate('projectId');
};

/**
 * Update a Site Visit Report
 */
const updateVisit = async (id, data, actor = null) => {
  const visit = await VisitReport.findOne({ _id: id, deletedAt: null });
  if (!visit) {
    const err = new Error('Site visit report not found');
    err.status = 404;
    throw err;
  }

  const allowedFields = [
    'customerName',
    'contactNumber',
    'visitorId',
    'visitorName',
    'projectId',
    'projectVisited',
    'propertyInterested',
    'firstPreference',
    'secondPreference',
    'customerBudget',
    'customerProfession',
    'customerAddress',
    'sourceOfCustomer',
    'seniorPerson',
    'visitNumber',
    'remarks',
    'photoUrl',
    'visitedAt',
  ];

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) {
      visit[field] = data[field];
    }
  });

  if (data.visitorId) {
    const v = await User.findById(data.visitorId);
    if (v) {
      visit.visitorId = v._id;
      visit.visitorName = v.name;
    }
  }

  await visit.save();

  return VisitReport.findById(visit._id)
    .populate('leadId')
    .populate('visitorId', 'name email role')
    .populate('projectId');
};

/**
 * Soft Delete a Visit Report
 */
const deleteVisit = async (id, actor = null) => {
  const visit = await VisitReport.findOne({ _id: id, deletedAt: null });
  if (!visit) {
    const err = new Error('Site visit report not found');
    err.status = 404;
    throw err;
  }

  visit.deletedAt = new Date();
  visit.deletedBy = actor?._id || null;
  await visit.save();

  return { message: 'Site visit report deleted successfully' };
};

module.exports = {
  getStats,
  listVisits,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
  calculateDistanceMeters,
};
