const checklistReportService = require('../services/checklistReport.service');

const getWeeklyReport = async (req, res, next) => {
  try {
    const data = await checklistReportService.getWeeklyReport(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const saveWeeklyPlan = async (req, res, next) => {
  try {
    const { assignedTo, weekStart, next: nextScores } = req.body;
    const plan = await checklistReportService.savePlan({
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
