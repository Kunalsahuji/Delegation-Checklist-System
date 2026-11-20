const constructionExecutionService = require('../services/constructionExecution.service');

class ConstructionExecutionController {
  async getKPIs(req, res, next) {
    try {
      const data = await constructionExecutionService.getKPIs();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listRecords(req, res, next) {
    try {
      const data = await constructionExecutionService.listRecords(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const data = await constructionExecutionService.getRecordById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromProject(req, res, next) {
    try {
      const { projectId } = req.body;
      const data = await constructionExecutionService.createFromProject(projectId, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const { id, sectionKey } = req.params;
      const data = await constructionExecutionService.updateSection(
        id,
        sectionKey,
        req.body,
        req.user?._id
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async completeSection(req, res, next) {
    try {
      const { id, sectionKey } = req.params;
      const data = await constructionExecutionService.completeSection(
        id,
        sectionKey,
        req.body?.remarks || '',
        req.user?._id
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async requestApproval(req, res, next) {
    try {
      const { id } = req.params;
      const data = await constructionExecutionService.requestApproval(id, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async decideApproval(req, res, next) {
    try {
      const { id } = req.params;
      const data = await constructionExecutionService.decideApproval(id, req.body, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ConstructionExecutionController();
