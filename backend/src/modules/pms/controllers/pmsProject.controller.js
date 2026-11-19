const pmsProjectService = require('../services/pmsProject.service');

class PmsProjectController {
  async getKPIs(req, res, next) {
    try {
      const data = await pmsProjectService.getKPIs();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listProjects(req, res, next) {
    try {
      const result = await pmsProjectService.listProjects(req.query);
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

  async getProjectById(req, res, next) {
    try {
      const data = await pmsProjectService.getProjectById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createProject(req, res, next) {
    try {
      const data = await pmsProjectService.createProject(req.body, req.user?._id);
      res.status(201).json({ success: true, data, message: 'Project created successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updateProject(req, res, next) {
    try {
      const data = await pmsProjectService.updateProject(req.params.id, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Project updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const result = await pmsProjectService.deleteProject(req.params.id, req.user?._id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }

  async toggleChecklistItem(req, res, next) {
    try {
      const { stageOrder, itemIndex } = req.body;
      const data = await pmsProjectService.toggleChecklistItem(
        req.params.id,
        stageOrder,
        itemIndex,
        req.user?._id
      );
      res.status(200).json({ success: true, data, message: 'Checklist updated' });
    } catch (err) {
      next(err);
    }
  }

  async advanceStage(req, res, next) {
    try {
      const data = await pmsProjectService.advanceStage(req.params.id, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Advanced to next stage' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PmsProjectController();
