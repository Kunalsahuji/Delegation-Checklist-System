const legalCaseService = require('../services/legalCase.service');

class LegalCaseController {
  async getKPIs(req, res, next) {
    try {
      const data = await legalCaseService.getKPIs(req.query.projectId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listLegalCases(req, res, next) {
    try {
      const result = await legalCaseService.listLegalCases(req.query);
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

  async getLegalCaseById(req, res, next) {
    try {
      const data = await legalCaseService.getLegalCaseById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromPlot(req, res, next) {
    try {
      const result = await legalCaseService.createFromPlot(req.body, req.user?._id);
      res.status(result.created ? 201 : 200).json({
        success: true,
        data: result.legalCase,
        created: result.created,
        message: result.created ? 'Legal case created from approved plot' : 'Legal case already exists for this plot',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateLegalCase(req, res, next) {
    try {
      const data = await legalCaseService.updateLegalCase(req.params.id, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Legal case updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const data = await legalCaseService.updateSection(req.params.id, req.params.section, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Section updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  async completeSection(req, res, next) {
    try {
      const data = await legalCaseService.completeSection(req.params.id, req.params.section, req.user?._id, {
        override: req.body?.override,
      });
      res.status(200).json({ success: true, data, message: 'Section marked completed' });
    } catch (err) {
      next(err);
    }
  }

  async decide(req, res, next) {
    try {
      const data = await legalCaseService.decide(req.params.id, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Decision recorded successfully' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LegalCaseController();
