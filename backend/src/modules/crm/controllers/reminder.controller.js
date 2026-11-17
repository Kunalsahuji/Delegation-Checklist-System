const reminderService = require('../services/reminder.service');

const getStats = async (req, res, next) => {
  try {
    const stats = await reminderService.getStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const listReminders = async (req, res, next) => {
  try {
    const result = await reminderService.listReminders(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result.reminders,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createReminder = async (req, res, next) => {
  try {
    const actor = req.user || null;
    const reminder = await reminderService.createReminder(req.body, actor);
    return res.status(201).json({
      success: true,
      message: 'Follow-up reminder scheduled successfully',
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

const completeReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user || null;
    const completed = await reminderService.completeReminder(id, req.body, actor);
    return res.status(200).json({
      success: true,
      message: 'Follow-up marked as completed',
      data: completed,
    });
  } catch (error) {
    next(error);
  }
};

const rescheduleReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user || null;
    const updated = await reminderService.rescheduleReminder(id, req.body, actor);
    return res.status(200).json({
      success: true,
      message: 'Follow-up rescheduled successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await reminderService.deleteReminder(id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

const listSpecialFollowups = async (req, res, next) => {
  try {
    const result = await reminderService.listSpecialFollowups(req.query);
    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const toggleSpecialFollowup = async (req, res, next) => {
  try {
    const result = await reminderService.toggleSpecialFollowup(req.body);
    return res.status(200).json({
      success: true,
      message: 'Special follow-up status updated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  listReminders,
  createReminder,
  completeReminder,
  rescheduleReminder,
  deleteReminder,
  listSpecialFollowups,
  toggleSpecialFollowup,
};
