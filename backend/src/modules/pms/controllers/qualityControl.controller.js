const qualityControlService = require('../services/qualityControl.service');

class QualityControlController {
  async getKPIs(req, res, next) {
    try {
      const data = await qualityControlService.getKPIs();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listRecords(req, res, next) {
    try {
      const data = await qualityControlService.listRecords(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const data = await qualityControlService.getRecordById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromProject(req, res, next) {
    try {
      const { projectId } = req.body;
      const data = await qualityControlService.createFromProject(projectId, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const { id, sectionKey } = req.params;
      const data = await qualityControlService.updateSection(
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
      const data = await qualityControlService.completeSection(
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
      const data = await qualityControlService.requestApproval(id, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async decideApproval(req, res, next) {
    try {
      const { id } = req.params;
      const data = await qualityControlService.decideApproval(id, req.body, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new QualityControlController();
