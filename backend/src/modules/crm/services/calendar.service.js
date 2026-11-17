const Reminder = require('../models/reminder.model');
const VisitReport = require('../models/visitReport.model');
const Lead = require('../models/lead.model');
const Enquiry = require('../models/enquiry.model');
const User = require('../../auth/models/user.model');
const Project = require('../../master/models/project.model');

const nameOf = (u) => (u && (u.name || u.email)) || '';

/**
 * Unified calendar activities aggregator for a date range
 */
const getActivities = async ({ from, to, userId, mine, actor }) => {
  const start = from ? new Date(from) : new Date();
  if (!from) start.setDate(1); // Start of month

  const end = to ? new Date(to) : new Date();
  if (!to) end.setMonth(end.getMonth() + 1, 0); // End of month

  end.setHours(23, 59, 59, 999);

  const isAdmin = actor?.role === 'Administrator' || actor?.role === 'Admin';
  const isMine = mine === true || String(mine) === 'true';

  const scopeUserId = isMine
    ? String(actor?._id)
    : isAdmin
    ? userId || null
    : String(actor?._id || '');

  // 1. Fetch Reminders / Follow-ups in range
  const reminderFilter = {
    reminderAt: { $gte: start, $lte: end },
  };
  if (scopeUserId) {
    reminderFilter.assignedTo = scopeUserId;
  }

  // 2. Fetch Field Site Visits in range
  const visitFilter = {
    deletedAt: null,
    visitedAt: { $gte: start, $lte: end },
  };
  if (scopeUserId) {
    visitFilter.$or = [{ visitorId: scopeUserId }, { createdBy: scopeUserId }];
  }

  // 3. Fetch Leads with plannedStageAt in range
  const leadFilter = {
    status: 'active',
    plannedStageAt: { $gte: start, $lte: end },
  };
  if (scopeUserId) {
    leadFilter.assignedTo = scopeUserId;
  }

  const [reminders, visits, leads] = await Promise.all([
    Reminder.find(reminderFilter).populate('assignedTo', 'name email role').lean(),
    VisitReport.find(visitFilter)
      .populate('visitorId', 'name email role')
      .populate('createdBy', 'name email')
      .populate('projectId', 'name')
      .lean(),
    Lead.find(leadFilter)
      .populate('assignedTo', 'name email role')
      .populate('currentStageId', 'name colorHex order')
      .lean(),
  ]);

  // Resolve customer names for reminders
  const leadIds = new Set();
  const enquiryIds = new Set();
  reminders.forEach((r) => {
    if (r.referenceType === 'lead' && r.referenceId) leadIds.add(String(r.referenceId));
    else if (r.referenceType === 'enquiry' && r.referenceId) enquiryIds.add(String(r.referenceId));
  });

  const [leadDocs, enquiryDocs] = await Promise.all([
    leadIds.size
      ? Lead.find({ _id: { $in: [...leadIds] } })
          .select('clientName clientPhone clientEmail leadNumber project temperature')
          .lean()
      : [],
    enquiryIds.size
      ? Enquiry.find({ _id: { $in: [...enquiryIds] } })
          .select('clientName clientPhone clientEmail enquiryNumber project temperature')
          .lean()
      : [],
  ]);

  const leadMap = new Map(leadDocs.map((l) => [String(l._id), l]));
  const enqMap = new Map(enquiryDocs.map((e) => [String(e._id), e]));

  const activities = [];

  // Map reminders
  reminders.forEach((r) => {
    let clientName = '';
    let phone = '';
    let email = '';
    let code = '';
    let project = '';

    if (r.referenceType === 'lead') {
      const l = leadMap.get(String(r.referenceId));
      if (l) {
        clientName = l.clientName;
        phone = l.clientPhone;
        email = l.clientEmail;
        code = l.leadNumber;
        project = l.project;
      }
    } else if (r.referenceType === 'enquiry') {
      const e = enqMap.get(String(r.referenceId));
      if (e) {
        clientName = e.clientName;
        phone = e.clientPhone;
        email = e.clientEmail;
        code = e.enquiryNumber;
        project = e.project;
      }
    }

    const isPersonal = r.referenceType === 'personal';

    activities.push({
      id: `reminder_${r._id}`,
      rawId: r._id,
      source: 'reminder',
      type: isPersonal ? 'Personal Task' : 'Follow-up',
      title: r.title,
      clientName: clientName || r.title,
      phone,
      email,
      code,
      project,
      assignedUser: nameOf(r.assignedTo) || 'Staff',
      at: r.reminderAt,
      time: r.reminderTime || '',
      notes: r.description || '',
      status: r.status,
      category: r.category,
      color: isPersonal ? '#8B5CF6' : r.category === 'reminder' ? '#EC4899' : '#3B82F6',
    });
  });

  // Map Site Visits
  visits.forEach((v) => {
    activities.push({
      id: `visit_${v._id}`,
      rawId: v._id,
      source: 'visit',
      type: 'Site Visit',
      title: v.projectVisited ? `Tour: ${v.projectVisited}` : 'Site Visit Tour',
      clientName: v.customerName || 'Client Visit',
      phone: v.contactNumber || '',
      project: v.projectVisited || v.projectId?.name || '',
      assignedUser: v.visitorName || nameOf(v.visitorId) || nameOf(v.createdBy) || 'Staff',
      at: v.visitedAt,
      time: new Date(v.visitedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      notes: v.remarks || (v.propertyInterested ? `Interested in: ${v.propertyInterested}` : ''),
      status: 'completed',
      geoVerified: Boolean(v.geoVerified),
      visitNumber: v.visitNumber || '1st',
      color: '#10B981',
    });
  });

  // Map Stage Planned Dates from Leads
  leads.forEach((l) => {
    activities.push({
      id: `lead_stage_${l._id}`,
      rawId: l._id,
      source: 'lead_stage',
      type: 'Stage Milestone',
      title: `${l.currentStageName || 'Stage'} Target: ${l.clientName}`,
      clientName: l.clientName,
      phone: l.clientPhone,
      code: l.leadNumber,
      project: l.project || '',
      assignedUser: nameOf(l.assignedTo) || 'Sales Rep',
      at: l.plannedStageAt,
      time: '18:00',
      notes: `Target milestone for stage: ${l.currentStageName}`,
      status: 'pending',
      color: l.currentStageId?.colorHex || '#F59E0B',
    });
  });

  activities.sort((a, b) => new Date(a.at) - new Date(b.at));
  return activities;
};

module.exports = {
  getActivities,
};
