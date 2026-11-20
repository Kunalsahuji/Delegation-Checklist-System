const procurementInventoryService = require('../services/procurementInventory.service');

class ProcurementInventoryController {
  async getKPIs(req, res, next) {
    try {
      const data = await procurementInventoryService.getKPIs(req.query.projectId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listRecords(req, res, next) {
    try {
      const result = await procurementInventoryService.listRecords(req.query);
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

  async getRecordById(req, res, next) {
    try {
      const data = await procurementInventoryService.getRecordById(req.params.id);
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
      const result = await procurementInventoryService.createFromProject(projectId, req.user._id);
      res.status(result.created ? 201 : 200).json({
        success: true,
        data: result.procurementInventory,
        created: result.created,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const { id, section } = req.params;
      const data = await procurementInventoryService.updateSection(id, section, req.body, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async completeSection(req, res, next) {
    try {
      const { id, section } = req.params;
      const data = await procurementInventoryService.completeSection(id, section, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async requestApproval(req, res, next) {
    try {
      const data = await procurementInventoryService.requestApproval(req.params.id, req.body, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async decideApproval(req, res, next) {
    try {
      const data = await procurementInventoryService.decideApproval(req.params.id, req.body, req.user._id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProcurementInventoryController();
