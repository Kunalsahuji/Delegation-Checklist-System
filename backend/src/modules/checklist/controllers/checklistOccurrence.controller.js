const checklistOccurrenceService = require('../services/checklistOccurrence.service');

const list = async (req, res, next) => {
  try {
    const result = await checklistOccurrenceService.listOccurrences(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const stats = async (req, res, next) => {
  try {
    const data = await checklistOccurrenceService.getStats(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const setStatus = async (req, res, next) => {
  try {
    const occurrence = await checklistOccurrenceService.setStatus(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({ success: true, data: occurrence });
  } catch (error) {
    next(error);
  }
};

const reportProgress = async (req, res, next) => {
  try {
    const occurrence = await checklistOccurrenceService.reportProgress(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({ success: true, data: occurrence });
  } catch (error) {
    next(error);
  }
};

const reassign = async (req, res, next) => {
  try {
    const occurrence = await checklistOccurrenceService.reassignItem(
      req.params.id,
      req.body,
      req.user
    );
    res.status(200).json({ success: true, data: occurrence });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  list,
  stats,
  setStatus,
  reportProgress,
  reassign,
};
