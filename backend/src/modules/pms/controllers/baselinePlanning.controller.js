const baselinePlanningService = require('../services/baselinePlanning.service');

class BaselinePlanningController {
  async getKPIs(req, res, next) {
    try {
      const data = await baselinePlanningService.getKPIs(req.query.projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listBaselines(req, res, next) {
    try {
      const result = await baselinePlanningService.listBaselines(req.query);
      res.json({
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

  async getBaselineById(req, res, next) {
    try {
      const data = await baselinePlanningService.getBaselineById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromProject(req, res, next) {
    try {
      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ success: false, message: 'projectId is required' });
      }
      const result = await baselinePlanningService.createFromProject(projectId, req.user._id);
      res.status(result.created ? 201 : 200).json({
        success: true,
        data: result.baselinePlanning,
        created: result.created,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const { id, section } = req.params;
      const data = await baselinePlanningService.updateSection(id, section, req.body, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async completeSection(req, res, next) {
    try {
      const { id, section } = req.params;
      const data = await baselinePlanningService.completeSection(id, section, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async requestBaselineLock(req, res, next) {
    try {
      const data = await baselinePlanningService.requestBaselineLock(req.params.id, req.body, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async lockBaseline(req, res, next) {
    try {
      const data = await baselinePlanningService.lockBaseline(req.params.id, req.body, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BaselinePlanningController();
