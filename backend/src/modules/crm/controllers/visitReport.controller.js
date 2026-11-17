const visitReportService = require('../services/visitReport.service');

const getStats = async (req, res, next) => {
  try {
    const stats = await visitReportService.getStats();
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

const listVisits = async (req, res, next) => {
  try {
    const result = await visitReportService.listVisits(req.query);
    return res.status(200).json({
      success: true,
      data: result.visits,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getVisitById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visit = await visitReportService.getVisitById(id);
    return res.status(200).json({ success: true, data: visit });
  } catch (error) {
    next(error);
  }
};

const createVisit = async (req, res, next) => {
  try {
    const actor = req.user || null;
    const visit = await visitReportService.createVisit(req.body, actor);
    return res.status(201).json({
      success: true,
      message: 'Site visit report logged successfully',
      data: visit,
    });
  } catch (error) {
    next(error);
  }
};

const updateVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user || null;
    const updated = await visitReportService.updateVisit(id, req.body, actor);
    return res.status(200).json({
      success: true,
      message: 'Site visit report updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const deleteVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user || null;
    const result = await visitReportService.deleteVisit(id, actor);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  listVisits,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
};
