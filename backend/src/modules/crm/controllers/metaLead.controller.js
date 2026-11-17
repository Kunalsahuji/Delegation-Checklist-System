const metaLeadService = require('../services/metaLead.service');

class MetaLeadController {
  async getKPIs(req, res, next) {
    try {
      const kpis = await metaLeadService.getKPIs();
      res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      next(err);
    }
  }

  async listLeads(req, res, next) {
    try {
      const result = await metaLeadService.listLeads(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async createLead(req, res, next) {
    try {
      const lead = await metaLeadService.createLead(req.body, req.user?._id);
      res.status(201).json({
        success: true,
        data: lead,
        message: 'Lead received and added to holding area',
      });
    } catch (err) {
      next(err);
    }
  }

  async syncLeads(req, res, next) {
    try {
      const result = await metaLeadService.syncLeads();
      res.status(200).json({
        success: true,
        data: result,
        message: 'Meta leads synced with CRM',
      });
    } catch (err) {
      next(err);
    }
  }

  async assignLeads(req, res, next) {
    try {
      const { leadIds, userIds } = req.body;
      const result = await metaLeadService.assignLeads({
        leadIds,
        userIds,
        actorId: req.user?._id,
      });
      res.status(200).json({
        success: true,
        data: result,
        message: `Successfully released and assigned ${result.assignedCount} leads to CRM`,
      });
    } catch (err) {
      next(err);
    }
  }

  async skipLead(req, res, next) {
    try {
      const { reason } = req.body;
      const lead = await metaLeadService.skipLead(req.params.id, reason);
      res.status(200).json({
        success: true,
        data: lead,
        message: 'Lead marked as skipped',
      });
    } catch (err) {
      next(err);
    }
  }

  async deleteLead(req, res, next) {
    try {
      await metaLeadService.deleteLead(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Lead deleted from holding area',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MetaLeadController();
