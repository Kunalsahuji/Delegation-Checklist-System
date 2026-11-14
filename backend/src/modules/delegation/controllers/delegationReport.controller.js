const delegationReportService = require('../services/delegationReport.service');

const getWeeklyReport = async (req, res, next) => {
  try {
    const data = await delegationReportService.getWeeklyReport(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const saveWeeklyPlan = async (req, res, next) => {
  try {
    const { assignedTo, weekStart, next: nextScores } = req.body;
    const plan = await delegationReportService.savePlan({
      assignedTo,
      weekStart,
      next: nextScores,
      user: req.user,
    });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeeklyReport,
  saveWeeklyPlan,
};
