const DelegationTask = require('../models/delegationTask.model');
const User = require('../../auth/models/user.model');
const Department = require('../../master/models/department.model');
const Project = require('../../master/models/project.model');
const { getNextSequence } = require('../../../utils/counter');
const { toCivilDate, civilToday } = require('../../../utils/recurrence');

class DelegationTaskService {
  async createTask(data, creatorUser) {
    const code = await getNextSequence('delegation_task', 'DLG-', 6);

    const assignee = await User.findById(data.assignedTo);
    if (!assignee) throw new Error('Assigned user not found');

    let departmentName = '';
    if (data.department) {
      const dept = await Department.findById(data.department);
      if (dept) departmentName = dept.name;
    }

    const civilDueDate = toCivilDate(data.dueDate);

    const task = await DelegationTask.create({
      code,
      title: data.title,
      description: data.description || '',
      assignedTo: assignee._id,
      assignedToName: assignee.name,
      assignedBy: creatorUser._id,
      assignedByName: creatorUser.name,
      assignedAt: new Date(),
      department: data.department || null,
      departmentName,
      project: data.project || null,
      originalDueDate: civilDueDate,
      dueDate: civilDueDate,
      priority: data.priority || 'medium',
      startDate: data.startDate ? toCivilDate(data.startDate) : null,
      proofRequired: Boolean(data.proofRequired),
      verificationRequired: Boolean(data.verificationRequired),
      status: 'pending',
      revisions: [],
      revisionCount: 0,
      createdBy: creatorUser._id,
    });

    return task;
  }

  async reviseDate(id, { newDueDate, reason, kind = 'revise' }, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');

    if (!reason || !reason.trim()) {
      throw new Error('A reason is mandatory for any date revision');
    }

    const nextCivilDate = toCivilDate(newDueDate);
    const fromCivilDate = toCivilDate(task.dueDate);

    const revisionEntry = {
      fromDate: fromCivilDate,
      toDate: nextCivilDate,
      reason: reason.trim(),
      changedBy: user._id,
      changedByName: user.name,
      changedAt: new Date(),
      kind: kind || 'revise',
    };

    task.revisions.push(revisionEntry);
    task.revisionCount = task.revisions.length;
    task.dueDate = nextCivilDate;
    task.updatedBy = user._id;

    if (kind === 'weekShift') {
      task.status = 'weekShifted';
    } else if (task.status === 'weekShifted') {
      task.status = 'pending';
    }

    await task.save();
    return task;
  }

  async setStatus(id, { status, cancelReason = '' }, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');

    if (status === 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
      task.completedBy = user._id;
      task.completedByName = user.name;
    } else if (status === 'cancelled') {
      task.status = 'cancelled';
      task.cancelReason = cancelReason || 'Cancelled by manager';
    } else if (status === 'pending') {
      task.status = 'pending';
      task.completedAt = null;
      task.completedBy = null;
      task.completedByName = '';
      task.cancelReason = '';
    } else {
      throw new Error(`Invalid status: ${status}`);
    }

    task.updatedBy = user._id;
    await task.save();
    return task;
  }

  async reportProgress(id, { note, expectedDate }, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');

    const entry = {
      at: new Date(),
      by: user._id,
      byName: user.name,
      note,
      expectedDate: toCivilDate(expectedDate),
      plannedDate: task.dueDate,
    };

    task.progressRemarks.push(entry);
    task.progressCount = task.progressRemarks.length;
    task.latestProgress = {
      at: entry.at,
      by: entry.by,
      byName: entry.byName,
      note: entry.note,
      expectedDate: entry.expectedDate,
    };
    task.updatedBy = user._id;

    await task.save();
    return task;
  }

  async reassignTask(id, { toUserId, reason = '' }, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');

    const targetUser = await User.findById(toUserId);
    if (!targetUser) throw new Error('Target user not found');

    const reassignmentEntry = {
      fromUser: task.assignedTo,
      fromUserName: task.assignedToName,
      toUser: targetUser._id,
      toUserName: targetUser.name,
      reason,
      requestedBy: user._id,
      requestedAt: new Date(),
    };

    task.reassignments.push(reassignmentEntry);
    task.reassignmentCount = task.reassignments.length;
    task.assignedTo = targetUser._id;
    task.assignedToName = targetUser.name;
    task.updatedBy = user._id;

    await task.save();
    return task;
  }

  async logFollowUp(id, { note, nextOn = null }, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');

    const entry = {
      at: new Date(),
      by: user._id,
      note,
      nextOn: nextOn ? toCivilDate(nextOn) : null,
    };

    task.followUp.required = true;
    task.followUp.entries.push(entry);
    task.followUp.count = task.followUp.entries.length;
    task.followUp.lastAt = new Date();
    task.followUp.nextOn = entry.nextOn;
    task.updatedBy = user._id;

    await task.save();
    return task;
  }

  async listTasks(params = {}) {
    const today = civilToday();
    const filter = { deletedAt: null };

    if (params.assignee) filter.assignedTo = params.assignee;
    if (params.department) filter.department = params.department;
    if (params.project) filter.project = params.project;
    if (params.priority) filter.priority = params.priority;

    if (params.from || params.to) {
      filter.dueDate = {};
      if (params.from) filter.dueDate.$gte = toCivilDate(params.from);
      if (params.to) filter.dueDate.$lte = toCivilDate(params.to);
    }

    if (params.q) {
      filter.$or = [
        { title: { $regex: params.q, $options: 'i' } },
        { code: { $regex: params.q, $options: 'i' } },
        { legacyCode: { $regex: params.q, $options: 'i' } },
        { assignedToName: { $regex: params.q, $options: 'i' } },
      ];
    }

    // Status & Slice filtering
    if (params.status === 'completed' || params.slice === 'completed') {
      filter.status = 'completed';
    } else if (params.status === 'cancelled' || params.slice === 'cancelled') {
      filter.status = 'cancelled';
    } else if (params.status === 'weekShifted' || params.slice === 'weekShifted') {
      filter.status = 'weekShifted';
    } else if (params.slice === 'revised') {
      filter.$or = [
        { revisionCount: { $gt: 0 } },
        { status: 'weekShifted' },
        { 'revisions.0': { $exists: true } },
      ];
    } else if (params.status === 'overdue' || params.slice === 'overdue') {
      filter.status = 'pending';
      filter.dueDate = { $lt: today };
    } else if (params.status === 'pending' || params.slice === 'pending') {
      filter.status = 'pending';
    }

    if (params.slice === 'dueToday') {
      filter.dueDate = today;
      filter.status = 'pending';
    } else if (params.slice === 'followUpDue') {
      filter['followUp.required'] = true;
      filter['followUp.nextOn'] = { $lte: today };
    }

    const page = Math.max(1, parseInt(params.page || '1', 10));
    const limit = Math.min(5000, Math.max(1, parseInt(params.limit || '20', 10)));
    const skip = (page - 1) * limit;

    let sortObj = { createdAt: -1, dueDate: -1 };
    if (params.slice === 'revised') sortObj = { revisionCount: -1, updatedAt: -1 };
    else if (params.sortBy === 'dueDate_asc') sortObj = { dueDate: 1, createdAt: -1 };
    else if (params.sortBy === 'dueDate_desc') sortObj = { dueDate: -1, createdAt: -1 };
    else if (params.sortBy === 'oldest') sortObj = { createdAt: 1, dueDate: 1 };

    const [total, items] = await Promise.all([
      DelegationTask.countDocuments(filter),
      DelegationTask.find(filter)
        .populate('assignedTo', 'name email phone role')
        .populate('assignedBy', 'name email')
        .populate('department', 'name key')
        .populate('project', 'name code')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const enriched = items.map((task) => {
      const isOverdue =
        task.status === 'pending' &&
        task.dueDate &&
        toCivilDate(task.dueDate) < today;

      const origDate = task.originalDueDate ? new Date(task.originalDueDate).getTime() : null;
      const dueDate = task.dueDate ? new Date(task.dueDate).getTime() : null;
      const slippedDays = (origDate && dueDate) ? Math.max(0, Math.round((dueDate - origDate) / (1000 * 60 * 60 * 24))) : 0;

      return {
        ...task,
        isOverdue,
        derivedStatus: isOverdue ? 'overdue' : task.status,
        slippedDays,
      };
    });

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

  async getTaskById(id) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null })
      .populate('assignedTo', 'name email phone role')
      .populate('assignedBy', 'name email')
      .populate('department', 'name key')
      .populate('project', 'name code location')
      .populate('revisions.changedBy', 'name email')
      .populate('progressRemarks.by', 'name email')
      .populate('followUp.entries.by', 'name email');

    if (!task) throw new Error('Delegation task not found');
    return task;
  }

  async getStats(query = {}) {
    const today = civilToday();
    const baseFilter = { deletedAt: null };

    if (query.assignee) baseFilter.assignedTo = query.assignee;
    if (query.department) baseFilter.department = query.department;
    if (query.project) baseFilter.project = query.project;

    const [
      totalWork,
      completed,
      cancelled,
      pendingTotal,
      overdue,
      weekShifted,
      dueToday,
      followUpDue,
    ] = await Promise.all([
      DelegationTask.countDocuments(baseFilter),
      DelegationTask.countDocuments({ ...baseFilter, status: 'completed' }),
      DelegationTask.countDocuments({ ...baseFilter, status: 'cancelled' }),
      DelegationTask.countDocuments({ ...baseFilter, status: 'pending' }),
      DelegationTask.countDocuments({ ...baseFilter, status: 'pending', dueDate: { $lt: today } }),
      DelegationTask.countDocuments({ ...baseFilter, status: 'weekShifted' }),
      DelegationTask.countDocuments({ ...baseFilter, status: 'pending', dueDate: today }),
      DelegationTask.countDocuments({
        ...baseFilter,
        'followUp.required': true,
        'followUp.nextOn': { $lte: today },
      }),
    ]);

    const activePending = Math.max(0, pendingTotal - overdue);

    return {
      totalWork,
      completed,
      cancelled,
      pending: pendingTotal,
      activePending,
      overdue,
      weekShifted,
      dueToday,
      followUpDue,
    };
  }

  async deleteTask(id, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');
    task.deletedAt = new Date();
    task.updatedBy = user?._id;
    await task.save();
    return { success: true, message: 'Delegation task deleted' };
  }

  async addComment(id, { text }, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');
    const comment = {
      author: user?.name || 'Administrator',
      text,
      at: new Date(),
    };
    if (!task.comments) task.comments = [];
    task.comments.push(comment);
    await task.save();
    return task;
  }

  async addAttachment(id, { name, size, url }, user) {
    const task = await DelegationTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Delegation task not found');
    const file = {
      name: name || 'Document',
      size: size || 1024,
      url: url || '#',
      uploadedAt: new Date(),
    };
    if (!task.attachments) task.attachments = [];
    task.attachments.push(file);
    await task.save();
    return task;
  }
}

module.exports = new DelegationTaskService();
