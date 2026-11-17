const calendarService = require('../services/calendar.service');

const getActivities = async (req, res, next) => {
  try {
    const { from, to, userId, mine } = req.query;
    const actor = req.user || null;
    const activities = await calendarService.getActivities({
      from,
      to,
      userId,
      mine,
      actor,
    });
    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
};
