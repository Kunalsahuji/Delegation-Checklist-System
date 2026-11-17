const crmDashboardService = require('../services/dashboard.service');

class CrmDashboardController {
  async getDashboardData(req, res, next) {
    try {
      const data = await crmDashboardService.getDashboardData();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CrmDashboardController();
