const ChecklistOccurrence = require('../models/checklistOccurrence.model');
const User = require('../../auth/models/user.model');
const {
  civilToday,
  toCivilDate,
  isOverdueOccurrence,
  occurrenceState,
} = require('../../../utils/recurrence');

class ChecklistOccurrenceService {
  async listOccurrences(params = {}) {
    const today = civilToday();
    const now = new Date();
    const filter = {};

    if (params.department) filter.department = params.department;
    if (params.frequency) filter.frequency = params.frequency;
    if (params.assignee) filter.assignedTo = params.assignee;

    if (params.from || params.to) {
      filter.plannedOn = {};
      if (params.from) filter.plannedOn.$gte = toCivilDate(params.from);
      if (params.to) filter.plannedOn.$lte = toCivilDate(params.to);
    }

    if (params.q) {
      filter.$or = [
        { title: { $regex: params.q, $options: 'i' } },
        { assignedToName: { $regex: params.q, $options: 'i' } },
        { departmentName: { $regex: params.q, $options: 'i' } },
      ];
    }

    // Status filtering
    if (params.status === 'done') {
      filter.status = 'done';
    } else if (params.status === 'skipped') {
      filter.status = 'skipped';
    } else if (params.status === 'pending') {
      filter.status = 'pending';
      filter.plannedAt = { $gte: now };
    } else if (params.status === 'overdue' || params.slice === 'overdue') {
      filter.status = 'pending';
      filter.plannedAt = { $lt: now };
    }

    if (params.slice === 'dueToday') {
      filter.plannedOn = today;
    }

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      ChecklistOccurrence.countDocuments(filter),
      ChecklistOccurrence.find(filter)
        .populate('assignedTo', 'name email phone role')
        .populate('department', 'name key')
        .populate('project', 'name code')
        .populate('task', 'code title')
        .sort({ plannedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Attach derived state ('done', 'skipped', 'overdue', 'pending')
    const enriched = items.map((item) => ({
      ...item,
      derivedStatus: occurrenceState(item, now),
      isOverdue: isOverdueOccurrence(item, now),
    }));

    return {
      items: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getStats(query = {}) {
    const today = civilToday();
    const now = new Date();
    const baseFilter = {};

    if (query.department) baseFilter.department = query.department;
    if (query.assignee) baseFilter.assignedTo = query.assignee;
    if (query.project) baseFilter.project = query.project;

    // Optional date scoping (e.g. from weekly reports)
    if (query.scope === 'dueUpToToday') {
      baseFilter.plannedOn = { $lte: today };
    }

    const [total, completed, skipped, pendingTotal, overdue, dueToday] = await Promise.all([
      ChecklistOccurrence.countDocuments(baseFilter),
      ChecklistOccurrence.countDocuments({ ...baseFilter, status: 'done' }),
      ChecklistOccurrence.countDocuments({ ...baseFilter, status: 'skipped' }),
      ChecklistOccurrence.countDocuments({ ...baseFilter, status: 'pending' }),
      ChecklistOccurrence.countDocuments({ ...baseFilter, status: 'pending', plannedAt: { $lt: now } }),
      ChecklistOccurrence.countDocuments({ ...baseFilter, plannedOn: today }),
    ]);

    const activePending = Math.max(0, pendingTotal - overdue);

    return {
      total,
      totalWork: total,
      completed,
      skipped,
      pending: pendingTotal,
      activePending,
      overdue,
      dueToday,
    };
  }

  async setStatus(id, { status, remarks = '' }, user) {
    const occurrence = await ChecklistOccurrence.findById(id);
    if (!occurrence) throw new Error('Checklist occurrence not found');

    if (status === 'done') {
      occurrence.status = 'done';
      occurrence.completedAt = new Date();
      occurrence.completedBy = user._id;
      occurrence.completedByName = user.name;
      if (remarks) occurrence.remarks = remarks;
    } else if (status === 'skipped') {
      occurrence.status = 'skipped';
      occurrence.completedAt = new Date();
      occurrence.completedBy = user._id;
      occurrence.completedByName = user.name;
      occurrence.remarks = remarks || 'Skipped';
    } else if (status === 'pending') {
      occurrence.status = 'pending';
      occurrence.completedAt = null;
      occurrence.completedBy = null;
      occurrence.completedByName = '';
      occurrence.remarks = '';
    } else {
      throw new Error(`Invalid status: ${status}`);
    }

    await occurrence.save();
    return occurrence;
  }

  async reportProgress(id, { note, expectedDate }, user) {
    const occurrence = await ChecklistOccurrence.findById(id);
    if (!occurrence) throw new Error('Checklist occurrence not found');

    const entry = {
      at: new Date(),
      by: user._id,
      byName: user.name,
      note,
      expectedDate: toCivilDate(expectedDate),
      plannedDate: occurrence.plannedOn,
    };

    occurrence.progressRemarks.push(entry);
    occurrence.progressCount = occurrence.progressRemarks.length;
    occurrence.latestProgress = {
      at: entry.at,
      by: entry.by,
      byName: entry.byName,
      note: entry.note,
      expectedDate: entry.expectedDate,
    };

    await occurrence.save();
    return occurrence;
  }

  async reassignItem(id, { toUserId, reason = '' }, user) {
    const occurrence = await ChecklistOccurrence.findById(id);
    if (!occurrence) throw new Error('Checklist occurrence not found');

    const targetUser = await User.findById(toUserId);
    if (!targetUser) throw new Error('Target user not found');

    const reassignmentEntry = {
      fromUser: occurrence.assignedTo,
      fromUserName: occurrence.assignedToName,
      toUser: targetUser._id,
      toUserName: targetUser.name,
      reason,
      requestedBy: user._id,
      requestedAt: new Date(),
    };

    occurrence.reassignments.push(reassignmentEntry);
    occurrence.reassignmentCount = occurrence.reassignments.length;
    occurrence.assignedTo = targetUser._id;
    occurrence.assignedToName = targetUser.name;

    await occurrence.save();
    return occurrence;
  }
}

module.exports = new ChecklistOccurrenceService();
