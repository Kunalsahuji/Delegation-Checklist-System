const bulkMessageService = require('../services/bulkMessage.service');

class BulkMessageController {
  async getKPIs(req, res, next) {
    try {
      const kpis = await bulkMessageService.getKPIs();
      res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      next(err);
    }
  }

  async getTemplates(req, res, next) {
    try {
      const templates = bulkMessageService.getTemplates();
      res.status(200).json({ success: true, data: templates });
    } catch (err) {
      next(err);
    }
  }

  async previewAudience(req, res, next) {
    try {
      const { selection } = req.body;
      const preview = await bulkMessageService.previewAudience(selection);
      res.status(200).json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }

  async createCampaign(req, res, next) {
    try {
      const campaign = await bulkMessageService.createCampaign(req.body, req.user?._id);
      res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaign initiated and queued for dispatch',
      });
    } catch (err) {
      next(err);
    }
  }

  async listCampaigns(req, res, next) {
    try {
      const result = await bulkMessageService.listCampaigns(req.query);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  async getCampaignById(req, res, next) {
    try {
      const campaign = await bulkMessageService.getCampaignById(req.params.id);
      res.status(200).json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      await bulkMessageService.deleteCampaign(req.params.id);
      res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BulkMessageController();
