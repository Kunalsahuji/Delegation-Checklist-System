const ChecklistTask = require('../models/checklistTask.model');
const ChecklistOccurrence = require('../models/checklistOccurrence.model');
const User = require('../../auth/models/user.model');
const Department = require('../../master/models/department.model');
const Project = require('../../master/models/project.model');
const { getNextSequence } = require('../../../utils/counter');
const {
  toCivilDate,
  civilToday,
  addDays,
  expandOccurrences,
  nextOccurrences,
  plannedInstant,
} = require('../../../utils/recurrence');

class ChecklistTaskService {
  /**
   * Materialises upcoming occurrences for a single task up to `horizonDate` (default 60 days).
   */
  async materialiseTask(task, horizonDays = 60) {
    const today = civilToday();
    const horizon = addDays(today, horizonDays);
    const from = task.startOn && toCivilDate(task.startOn) > today ? toCivilDate(task.startOn) : today;
    const to = task.endOn && toCivilDate(task.endOn) < horizon ? toCivilDate(task.endOn) : horizon;

    if (from > to) return { created: 0 };

    const dates = expandOccurrences({
      frequency: task.frequency,
      anchorDate: task.anchorDate,
      from,
      to,
      startOn: task.startOn,
      endOn: task.endOn,
      skipSundays: task.skipSundays,
      skipHolidays: task.skipHolidays,
    });

    if (!dates.length) return { created: 0 };

    const ops = dates.map((plannedOn) => ({
      updateOne: {
        filter: { task: task._id, plannedOn },
        update: {
          $setOnInsert: {
            task: task._id,
            title: task.title,
            assignedTo: task.assignedTo,
            assignedToName: task.assignedToName,
            department: task.department,
            departmentName: task.departmentName,
            frequency: task.frequency,
            project: task.project,
            plannedOn,
            plannedAt: plannedInstant(plannedOn, task.dueTime || '18:00'),
            status: 'pending',
          },
        },
        upsert: true,
      },
    }));

    const res = await ChecklistOccurrence.bulkWrite(ops, { ordered: false });
    const maxPlanned = dates[dates.length - 1];

    await ChecklistTask.findByIdAndUpdate(task._id, {
      materialisedThrough: maxPlanned,
    });

    return { created: res.upsertedCount || 0 };
  }

  async createTask(data, creatorUser) {
    const code = await getNextSequence('checklist_task', 'CHK-', 6);

    const assignee = await User.findById(data.assignedTo);
    if (!assignee) throw new Error('Assigned user not found');

    let departmentName = '';
    if (data.department) {
      const dept = await Department.findById(data.department);
      if (dept) departmentName = dept.name;
    }

    const anchorDate = toCivilDate(data.anchorDate);
    const startOn = data.startOn ? toCivilDate(data.startOn) : anchorDate;
    const endOn = data.endOn ? toCivilDate(data.endOn) : null;

    const task = await ChecklistTask.create({
      code,
      title: data.title,
      assignedTo: assignee._id,
      assignedToName: assignee.name,
      department: data.department || null,
      departmentName,
      frequency: data.frequency,
      anchorDate,
      startOn,
      endOn,
      dueTime: data.dueTime || '18:00',
      skipSundays: Boolean(data.skipSundays),
      skipHolidays: Boolean(data.skipHolidays),
      project: data.project || null,
      active: true,
      createdBy: creatorUser._id,
    });

    // Materialise next 60 days
    await this.materialiseTask(task, 60);

    return task;
  }

  async listTasks(query = {}) {
    const filter = { deletedAt: null };
    if (query.department) filter.department = query.department;
    if (query.frequency) filter.frequency = query.frequency;
    if (query.assignedTo) filter.assignedTo = query.assignedTo;
    if (typeof query.active === 'boolean') filter.active = query.active;
    if (query.q) {
      filter.$or = [
        { title: { $regex: query.q, $options: 'i' } },
        { code: { $regex: query.q, $options: 'i' } },
        { assignedToName: { $regex: query.q, $options: 'i' } },
      ];
    }

    const tasks = await ChecklistTask.find(filter)
      .populate('department', 'name key')
      .populate('assignedTo', 'name email')
      .populate('project', 'name code')
      .sort({ createdAt: -1 });

    return tasks;
  }

  async getTaskById(id) {
    const task = await ChecklistTask.findOne({ _id: id, deletedAt: null })
      .populate('department', 'name key')
      .populate('assignedTo', 'name email phone')
      .populate('project', 'name code');
    if (!task) throw new Error('Checklist task not found');
    return task;
  }

  async updateTask(id, data, user) {
    const task = await ChecklistTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Checklist task not found');

    const updateFields = { ...data, updatedBy: user._id };

    if (data.assignedTo && String(data.assignedTo) !== String(task.assignedTo)) {
      const assignee = await User.findById(data.assignedTo);
      if (assignee) {
        updateFields.assignedToName = assignee.name;
      }
    }

    if (data.department && String(data.department) !== String(task.department)) {
      const dept = await Department.findById(data.department);
      if (dept) updateFields.departmentName = dept.name;
    }

    if (data.anchorDate) updateFields.anchorDate = toCivilDate(data.anchorDate);
    if (data.startOn) updateFields.startOn = toCivilDate(data.startOn);
    if (data.endOn !== undefined) updateFields.endOn = data.endOn ? toCivilDate(data.endOn) : null;

    const updated = await ChecklistTask.findByIdAndUpdate(id, updateFields, { new: true });

    // Prune future pending rows strictly after today and re-materialise
    const today = civilToday();
    await ChecklistOccurrence.deleteMany({
      task: updated._id,
      status: 'pending',
      plannedOn: { $gt: today },
    });

    if (updated.active) {
      await this.materialiseTask(updated, 60);
    }

    return updated;
  }

  async toggleActive(id, user) {
    const task = await ChecklistTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Checklist task not found');

    const nextActive = !task.active;
    task.active = nextActive;
    task.updatedBy = user._id;
    await task.save();

    if (!nextActive) {
      // Pause: drop future pending rows
      const today = civilToday();
      await ChecklistOccurrence.deleteMany({
        task: task._id,
        status: 'pending',
        plannedOn: { $gt: today },
      });
    } else {
      // Resume: re-materialise
      await this.materialiseTask(task, 60);
    }

    return task;
  }

  async deleteTask(id, user) {
    const task = await ChecklistTask.findByIdAndUpdate(
      id,
      { deletedAt: new Date(), updatedBy: user._id, active: false },
      { new: true }
    );
    if (!task) throw new Error('Checklist task not found');

    // Remove future pending occurrences
    const today = civilToday();
    await ChecklistOccurrence.deleteMany({
      task: task._id,
      status: 'pending',
      plannedOn: { $gt: today },
    });

    return task;
  }

  previewDates(options) {
    const anchor = toCivilDate(options.anchorDate);
    return nextOccurrences({
      frequency: options.frequency,
      anchorDate: anchor,
      after: toCivilDate(options.after || new Date()),
      count: options.count || 5,
      dueTime: options.dueTime || '18:00',
      skipSundays: Boolean(options.skipSundays),
      skipHolidays: Boolean(options.skipHolidays),
    }).map((d) => ({
      date: d.toISOString().slice(0, 10),
      instant: plannedInstant(d, options.dueTime || '18:00'),
    }));
  }

  async addComment(id, { text }, user) {
    const task = await ChecklistTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Checklist task not found');
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
    const task = await ChecklistTask.findOne({ _id: id, deletedAt: null });
    if (!task) throw new Error('Checklist task not found');
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

module.exports = new ChecklistTaskService();
