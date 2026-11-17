const mongoose = require('mongoose');
const Reminder = require('../models/reminder.model');
const Lead = require('../models/lead.model');
const Enquiry = require('../models/enquiry.model');
const User = require('../../auth/models/user.model');
const Project = require('../../master/models/project.model');

// Helper to combine date and time (defaulting to 23:59:59 if no specific time given)
const combineDateTime = (date, time) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    const err = new Error('Invalid reminder date');
    err.status = 400;
    throw err;
  }

  if (time && /^\d{1,2}:\d{2}$/.test(time.trim())) {
    const [h, m] = time.trim().split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }

  // End of day
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Enrich reminder records with client and project context from Lead or Enquiry
 */
const enrichReminders = async (reminders = []) => {
  if (!reminders.length) return reminders;

  const leadIds = reminders
    .filter((r) => r.referenceType === 'lead' && r.referenceId)
    .map((r) => r.referenceId);

  const enqIds = reminders
    .filter((r) => r.referenceType === 'enquiry' && r.referenceId)
    .map((r) => r.referenceId);

  const [leads, enquiries] = await Promise.all([
    leadIds.length
      ? Lead.find({ _id: { $in: leadIds } })
          .populate('currentStageId', 'name colorHex order')
          .populate('assignedTo', 'name email role')
          .populate('projectId', 'name')
          .lean()
      : [],
    enqIds.length
      ? Enquiry.find({ _id: { $in: enqIds } })
          .populate('assignedTo', 'name email role')
          .populate('projectId', 'name')
          .lean()
      : [],
  ]);

  const leadMap = new Map(leads.map((l) => [String(l._id), l]));
  const enqMap = new Map(enquiries.map((e) => [String(e._id), e]));

  return reminders.map((r) => {
    const doc = r.toObject ? r.toObject() : { ...r };
    let clientName = '';
    let clientPhone = '';
    let project = '';
    let budget = 0;
    let stageName = '';
    let stageColor = '#3B82F6';
    let referenceCode = '';
    let specialFollowUp = false;

    if (r.referenceType === 'lead') {
      const l = leadMap.get(String(r.referenceId));
      if (l) {
        clientName = l.clientName || '';
        clientPhone = l.clientPhone || '';
        project = l.project || l.projectId?.name || '';
        budget = l.budget || 0;
        stageName = l.currentStageName || l.currentStageId?.name || '';
        stageColor = l.currentStageId?.colorHex || '#3B82F6';
        referenceCode = l.leadNumber || '';
        specialFollowUp = Boolean(l.specialFollowUp);
      }
    } else if (r.referenceType === 'enquiry') {
      const e = enqMap.get(String(r.referenceId));
      if (e) {
        clientName = e.clientName || '';
        clientPhone = e.clientPhone || '';
        project = e.project || e.projectId?.name || '';
        budget = e.budgetMax || e.budgetMin || 0;
        stageName = 'Intake Qualification';
        stageColor = '#F59E0B';
        referenceCode = e.enquiryNumber || '';
        specialFollowUp = Boolean(e.specialFollowUp);
      }
    }

    return {
      ...doc,
      clientName: clientName || doc.title,
      clientPhone,
      project,
      budget,
      stageName,
      stageColor,
      referenceCode,
      specialFollowUp,
    };
  });
};

/**
 * Get KPI Statistics for Follow-ups
 */
const getStats = async (assignedTo = null) => {
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const baseFilter = {};
  if (assignedTo) baseFilter.assignedTo = assignedTo;

  const [
    totalPending,
    dueToday,
    overdue,
    completed,
    specialEnquiries,
    specialLeads,
  ] = await Promise.all([
    Reminder.countDocuments({ ...baseFilter, status: 'pending' }),
    Reminder.countDocuments({
      ...baseFilter,
      status: 'pending',
      reminderAt: { $gte: startOfToday, $lte: endOfToday },
    }),
    Reminder.countDocuments({
      ...baseFilter,
      status: 'pending',
      reminderAt: { $lt: startOfToday },
    }),
    Reminder.countDocuments({ ...baseFilter, status: 'completed' }),
    Enquiry.countDocuments({ specialFollowUp: true, status: { $ne: 'dropped' } }),
    Lead.countDocuments({ specialFollowUp: true, status: 'active' }),
  ]);

  return {
    totalPending,
    dueToday,
    overdue,
    completed,
    specialFollowUps: specialEnquiries + specialLeads,
  };
};

/**
 * List Reminders & Follow-ups
 */
const listReminders = async (query = {}, actor = null) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    filterStatus = 'all', // 'all', 'dueToday', 'overdue', 'upcoming', 'completed'
    category = '',
    assignedTo = '',
    referenceType = '',
    from,
    to,
  } = query;

  const filter = {};

  if (category) filter.category = category;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (referenceType) filter.referenceType = referenceType;

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  if (filterStatus === 'dueToday') {
    filter.status = 'pending';
    filter.reminderAt = { $gte: startOfToday, $lte: endOfToday };
  } else if (filterStatus === 'overdue') {
    filter.status = 'pending';
    filter.reminderAt = { $lt: startOfToday };
  } else if (filterStatus === 'upcoming') {
    filter.status = 'pending';
    filter.reminderAt = { $gt: endOfToday };
  } else if (filterStatus === 'completed') {
    filter.status = 'completed';
  } else if (filterStatus === 'pending') {
    filter.status = 'pending';
  }

  if (from || to) {
    filter.reminderAt = filter.reminderAt || {};
    if (from) filter.reminderAt.$gte = new Date(from);
    if (to) filter.reminderAt.$lte = new Date(to);
  }

  if (search && search.trim()) {
    const term = search.trim();
    filter.$or = [
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
    ];
  }

  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [rawReminders, total] = await Promise.all([
    Reminder.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('completedBy', 'name email')
      .sort({ reminderAt: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Reminder.countDocuments(filter),
  ]);

  const enriched = await enrichReminders(rawReminders);

  return {
    reminders: enriched,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Create a Reminder / Follow-up
 */
const createReminder = async (data, actor = null) => {
  const {
    referenceType = 'personal',
    referenceId = null,
    category = 'followup',
    assignedTo,
    title,
    description = '',
    reminderDate,
    reminderTime = '',
  } = data;

  if (!title) {
    const err = new Error('Title / Purpose is required');
    err.status = 400;
    throw err;
  }

  if (!reminderDate) {
    const err = new Error('Reminder date is required');
    err.status = 400;
    throw err;
  }

  const assigneeId = assignedTo || actor?._id;
  if (!assigneeId) {
    const err = new Error('Assigned representative is required');
    err.status = 400;
    throw err;
  }

  const reminderAt = combineDateTime(reminderDate, reminderTime);

  const reminder = await Reminder.create({
    referenceType,
    referenceId,
    category,
    assignedTo: assigneeId,
    title,
    description,
    reminderDate: new Date(reminderDate),
    reminderTime,
    reminderAt,
    status: 'pending',
    createdBy: actor?._id || null,
  });

  // Mirror follow-up date to parent lead or enquiry
  if (referenceType === 'lead' && referenceId) {
    await Lead.findByIdAndUpdate(referenceId, {
      nextFollowupAt: reminderAt,
      followupTime: reminderTime,
      lastActivityAt: new Date(),
    });
  } else if (referenceType === 'enquiry' && referenceId) {
    await Enquiry.findByIdAndUpdate(referenceId, {
      nextFollowupAt: reminderAt,
      followupTime: reminderTime,
    });
  }

  const populated = await Reminder.findById(reminder._id).populate('assignedTo', 'name email role');
  const [enriched] = await enrichReminders([populated]);
  return enriched;
};

/**
 * Upsert or Cancel Follow-up guarantee for CRM entities
 */
const syncFollowupReminder = async (
  {
    referenceType,
    referenceId,
    category = 'followup',
    reminderDate,
    reminderTime = '',
    title,
    description = '',
    assignedTo,
  },
  actor = null
) => {
  if (!referenceId) return null;

  // Find existing pending reminder for this entity and category
  const existing = await Reminder.findOne({
    referenceType,
    referenceId,
    category,
    status: 'pending',
  });

  // If date cleared/null, cancel existing pending reminder
  if (!reminderDate) {
    if (existing) {
      existing.status = 'cancelled';
      await existing.save();
    }
    return null;
  }

  const reminderAt = combineDateTime(reminderDate, reminderTime);

  if (existing) {
    existing.reminderDate = new Date(reminderDate);
    existing.reminderTime = reminderTime;
    existing.reminderAt = reminderAt;
    if (title) existing.title = title;
    if (description) existing.description = description;
    if (assignedTo) existing.assignedTo = assignedTo;
    await existing.save();
    return existing;
  }

  return createReminder(
    {
      referenceType,
      referenceId,
      category,
      assignedTo,
      title: title || `${referenceType.toUpperCase()} Follow-up`,
      description,
      reminderDate,
      reminderTime,
    },
    actor
  );
};

/**
 * Mark a Reminder / Follow-up Completed
 */
const completeReminder = async (id, { completionRemarks = '' }, actor = null) => {
  const reminder = await Reminder.findById(id);
  if (!reminder) {
    const err = new Error('Reminder not found');
    err.status = 404;
    throw err;
  }

  reminder.status = 'completed';
  reminder.completedAt = new Date();
  reminder.completedBy = actor?._id || null;
  reminder.completionRemarks = completionRemarks || 'Follow-up call/meeting completed';
  await reminder.save();

  // If linked to lead/enquiry, append note to history
  if (reminder.referenceType === 'lead' && reminder.referenceId) {
    await Lead.findByIdAndUpdate(reminder.referenceId, {
      lastActivityAt: new Date(),
    });
  }

  const populated = await Reminder.findById(reminder._id)
    .populate('assignedTo', 'name email role')
    .populate('completedBy', 'name email');
  const [enriched] = await enrichReminders([populated]);
  return enriched;
};

/**
 * Reschedule a Reminder / Follow-up
 */
const rescheduleReminder = async (id, { reminderDate, reminderTime = '', reason = '' }, actor = null) => {
  const reminder = await Reminder.findById(id);
  if (!reminder) {
    const err = new Error('Reminder not found');
    err.status = 404;
    throw err;
  }

  const reminderAt = combineDateTime(reminderDate, reminderTime);
  reminder.reminderDate = new Date(reminderDate);
  reminder.reminderTime = reminderTime;
  reminder.reminderAt = reminderAt;
  reminder.status = 'pending';

  if (reason) {
    reminder.description = reminder.description
      ? `${reminder.description}\n[Rescheduled: ${reason}]`
      : `[Rescheduled: ${reason}]`;
  }
  await reminder.save();

  // Mirror to parent
  if (reminder.referenceType === 'lead' && reminder.referenceId) {
    await Lead.findByIdAndUpdate(reminder.referenceId, {
      nextFollowupAt: reminderAt,
      followupTime: reminderTime,
      lastActivityAt: new Date(),
    });
  } else if (reminder.referenceType === 'enquiry' && reminder.referenceId) {
    await Enquiry.findByIdAndUpdate(reminder.referenceId, {
      nextFollowupAt: reminderAt,
      followupTime: reminderTime,
    });
  }

  const populated = await Reminder.findById(reminder._id).populate('assignedTo', 'name email role');
  const [enriched] = await enrichReminders([populated]);
  return enriched;
};

/**
 * Delete a Reminder
 */
const deleteReminder = async (id) => {
  await Reminder.findByIdAndDelete(id);
  return { message: 'Reminder deleted' };
};

/**
 * List Special Follow-ups (Flagged Enquiries & Leads)
 */
const listSpecialFollowups = async (query = {}) => {
  const { page = 1, limit = 20, search = '' } = query;

  const enqFilter = { specialFollowUp: true, status: { $ne: 'dropped' } };
  const leadFilter = { specialFollowUp: true, status: 'active' };

  if (search && search.trim()) {
    const term = search.trim();
    const regex = { $regex: term, $options: 'i' };
    enqFilter.$or = [{ clientName: regex }, { clientPhone: regex }, { project: regex }];
    leadFilter.$or = [{ clientName: regex }, { clientPhone: regex }, { project: regex }];
  }

  const [enquiries, leads] = await Promise.all([
    Enquiry.find(enqFilter)
      .populate('assignedTo', 'name email role')
      .populate('projectId', 'name')
      .lean(),
    Lead.find(leadFilter)
      .populate('assignedTo', 'name email role')
      .populate('currentStageId', 'name colorHex order')
      .populate('projectId', 'name')
      .lean(),
  ]);

  const combined = [
    ...enquiries.map((e) => ({
      _id: e._id,
      kind: 'enquiry',
      code: e.enquiryNumber,
      clientName: e.clientName,
      clientPhone: e.clientPhone,
      project: e.project || e.projectId?.name || '',
      budget: e.budgetMax || e.budgetMin || 0,
      stageName: 'Intake Qualification',
      stageColor: '#F59E0B',
      temperature: e.temperature || 'hot',
      assignedTo: e.assignedTo,
      nextFollowupAt: e.nextFollowupAt,
      followupTime: e.followupTime,
      createdAt: e.createdAt,
    })),
    ...leads.map((l) => ({
      _id: l._id,
      kind: 'lead',
      code: l.leadNumber,
      clientName: l.clientName,
      clientPhone: l.clientPhone,
      project: l.project || l.projectId?.name || '',
      budget: l.budget || 0,
      stageName: l.currentStageName || l.currentStageId?.name || '',
      stageColor: l.currentStageId?.colorHex || '#10B981',
      temperature: l.temperature || 'hot',
      assignedTo: l.assignedTo,
      nextFollowupAt: l.nextFollowupAt,
      followupTime: l.followupTime,
      createdAt: l.createdAt,
    })),
  ];

  combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = combined.length;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const paginated = combined.slice(skip, skip + Number(limit));

  return {
    items: paginated,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  };
};

/**
 * Toggle Special Follow-up flag on Lead or Enquiry
 */
const toggleSpecialFollowup = async ({ referenceType, referenceId, specialFollowUp }) => {
  const flag = Boolean(specialFollowUp);
  if (referenceType === 'lead') {
    await Lead.findByIdAndUpdate(referenceId, { specialFollowUp: flag });
  } else if (referenceType === 'enquiry') {
    await Enquiry.findByIdAndUpdate(referenceId, { specialFollowUp: flag });
  }
  return { success: true, specialFollowUp: flag };
};

module.exports = {
  getStats,
  listReminders,
  createReminder,
  syncFollowupReminder,
  completeReminder,
  rescheduleReminder,
  deleteReminder,
  listSpecialFollowups,
  toggleSpecialFollowup,
  combineDateTime,
};
