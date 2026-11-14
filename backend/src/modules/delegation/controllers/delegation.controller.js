const delegationTaskService = require('../services/delegationTask.service');

const create = async (req, res, next) => {
  try {
    const task = await delegationTaskService.createTask(req.body, req.user);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const result = await delegationTaskService.listTasks(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const task = await delegationTaskService.getTaskById(req.params.id);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const revise = async (req, res, next) => {
  try {
    const task = await delegationTaskService.reviseDate(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const setStatus = async (req, res, next) => {
  try {
    const task = await delegationTaskService.setStatus(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const reportProgress = async (req, res, next) => {
  try {
    const task = await delegationTaskService.reportProgress(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const reassign = async (req, res, next) => {
  try {
    const task = await delegationTaskService.reassignTask(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const followUp = async (req, res, next) => {
  try {
    const task = await delegationTaskService.logFollowUp(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const stats = async (req, res, next) => {
  try {
    const data = await delegationTaskService.getStats(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await delegationTaskService.deleteTask(req.params.id, req.user);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const addComment = async (req, res, next) => {
  try {
    const task = await delegationTaskService.addComment(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const addAttachment = async (req, res, next) => {
  try {
    const task = await delegationTaskService.addAttachment(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  getOne,
  revise,
  setStatus,
  reportProgress,
  reassign,
  followUp,
  stats,
  remove,
  addComment,
  addAttachment,
};
