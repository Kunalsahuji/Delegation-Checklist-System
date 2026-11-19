const feasibilityService = require('../services/feasibility.service');

class FeasibilityController {
  async saveFeasibility(req, res, next) {
    try {
      const data = await feasibilityService.saveFeasibility(req.params.plotId, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Feasibility calculated and saved' });
    } catch (err) {
      next(err);
    }
  }

  async decideFeasibility(req, res, next) {
    try {
      const data = await feasibilityService.decideFeasibility(req.params.id, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Feasibility decision registered' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FeasibilityController();
