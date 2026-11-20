const pmsHandoverService = require('../services/pmsHandover.service');

class PmsHandoverController {
  async getKPIs(req, res, next) {
    try {
      const data = await pmsHandoverService.getKPIs();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listRecords(req, res, next) {
    try {
      const data = await pmsHandoverService.listRecords(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const data = await pmsHandoverService.getRecordById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromProject(req, res, next) {
    try {
      const { projectId } = req.body;
      const data = await pmsHandoverService.createFromProject(projectId, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const { id, sectionKey } = req.params;
      const data = await pmsHandoverService.updateSection(
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
      const data = await pmsHandoverService.completeSection(
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
      const data = await pmsHandoverService.requestApproval(id, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async decideApproval(req, res, next) {
    try {
      const { id } = req.params;
      const data = await pmsHandoverService.decideApproval(id, req.body, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PmsHandoverController();
