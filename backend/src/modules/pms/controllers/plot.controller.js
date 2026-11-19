const plotService = require('../services/plot.service');

class PlotController {
  async getKPIs(req, res, next) {
    try {
      const data = await plotService.getKPIs(req.query.projectId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listPlots(req, res, next) {
    try {
      const result = await plotService.listPlots(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  }

  async getPlotById(req, res, next) {
    try {
      const data = await plotService.getPlotById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createPlot(req, res, next) {
    try {
      const data = await plotService.createPlot(req.body, req.user?._id);
      res.status(201).json({ success: true, data, message: 'Land plot registered successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updatePlot(req, res, next) {
    try {
      const data = await plotService.updatePlot(req.params.id, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Plot details updated' });
    } catch (err) {
      next(err);
    }
  }

  async deletePlot(req, res, next) {
    try {
      const result = await plotService.deletePlot(req.params.id, req.user?._id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async transitionStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const data = await plotService.transitionStatus(req.params.id, status, reason, req.user?._id);
      res.status(200).json({ success: true, data, message: `Status updated to ${status}` });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PlotController();
