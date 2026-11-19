const landPurchaseService = require('../services/landPurchase.service');

class LandPurchaseController {
  async getKPIs(req, res, next) {
    try {
      const data = await landPurchaseService.getKPIs(req.query.projectId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async listPurchases(req, res, next) {
    try {
      const result = await landPurchaseService.listPurchases(req.query);
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

  async getPurchaseById(req, res, next) {
    try {
      const data = await landPurchaseService.getPurchaseById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createFromPlot(req, res, next) {
    try {
      const result = await landPurchaseService.createFromPlot(req.body, req.user?._id);
      res.status(result.created ? 201 : 200).json({
        success: true,
        data: result.landPurchase,
        created: result.created,
        message: result.created
          ? 'Land purchase opened from approved plot'
          : 'Land purchase already exists for this plot',
      });
    } catch (err) {
      next(err);
    }
  }

  async updateSection(req, res, next) {
    try {
      const data = await landPurchaseService.updateSection(
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
      const data = await landPurchaseService.completeSection(
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
      const data = await landPurchaseService.requestApproval(req.params.id, req.body, req.user?._id);
      res.status(200).json({ success: true, data, message: 'Price sent for management approval' });
    } catch (err) {
      next(err);
    }
  }

  async decidePrice(req, res, next) {
    try {
      const data = await landPurchaseService.decidePrice(req.params.id, req.body, req.user?._id);
      res.status(200).json({
        success: true,
        data,
        message: req.body.decision === 'approved' ? 'Purchase price approved' : 'Price sent back for renegotiation',
      });
    } catch (err) {
      next(err);
    }
  }

  async completePurchase(req, res, next) {
    try {
      const data = await landPurchaseService.completePurchase(req.params.id, req.body, req.user?._id);
      res.status(200).json({
        success: true,
        data,
        message: 'Land purchase completed — project advanced to Stage 4 (Project Planning)',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LandPurchaseController();
