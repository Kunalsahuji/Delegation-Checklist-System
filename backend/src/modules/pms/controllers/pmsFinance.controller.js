const pmsFinanceService = require('../services/pmsFinance.service');

class PmsFinanceController {
  async getKPIs(req, res, next) {
    try {
      const data = await pmsFinanceService.getKPIs();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listRecords(req, res, next) {
    try {
      const data = await pmsFinanceService.listRecords(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const data = await pmsFinanceService.getRecordById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromProject(req, res, next) {
    try {
      const { projectId } = req.body;
      const data = await pmsFinanceService.createFromProject(projectId, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const { id, sectionKey } = req.params;
      const data = await pmsFinanceService.updateSection(
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
      const data = await pmsFinanceService.completeSection(
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
      const data = await pmsFinanceService.requestApproval(id, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async decideApproval(req, res, next) {
    try {
      const { id } = req.params;
      const data = await pmsFinanceService.decideApproval(id, req.body, req.user?._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PmsFinanceController();
