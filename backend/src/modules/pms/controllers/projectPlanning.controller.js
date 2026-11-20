const projectPlanningService = require('../services/projectPlanning.service');

class ProjectPlanningController {
  async getKPIs(req, res, next) {
    try {
      const data = await projectPlanningService.getKPIs(req.query.projectId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listPlans(req, res, next) {
    try {
      const result = await projectPlanningService.listPlans(req.query);
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

  async getPlanById(req, res, next) {
    try {
      const data = await projectPlanningService.getPlanById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromProject(req, res, next) {
    try {
      const result = await projectPlanningService.createFromProject(req.body, req.user?._id);
      res.status(result.created ? 201 : 200).json({
        success: true,
        data: result.projectPlanning,
        created: result.created,
        message: result.created
          ? 'Project planning opened'
          : 'Project planning already exists for this project',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const data = await projectPlanningService.updateSection(
        req.params.id,
        req.params.section,
        req.body,
        req.user?._id
      );
      res.status(200).json({ success: true, data, message: 'Section updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async completeSection(req, res, next) {
    try {
      const data = await projectPlanningService.completeSection(
        req.params.id,
        req.params.section,
        req.user?._id
      );
      res.status(200).json({ success: true, data, message: 'Section marked completed' });
    } catch (err) {
      next(err);
    }
  }

  async requestApproval(req, res, next) {
    try {
      const data = await projectPlanningService.requestApproval(req.params.id, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Plan sent for management approval' });
    } catch (err) {
      next(err);
    }
  }

  async decideApproval(req, res, next) {
    try {
      const data = await projectPlanningService.decideApproval(req.params.id, req.body, req.user?._id);
      res.status(200).json({
        success: true,
        data,
        message: req.body.decision === 'approved' ? 'Master plan & budget approved' : 'Plan returned for revision',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProjectPlanningController();
