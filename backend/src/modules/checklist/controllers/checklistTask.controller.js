const checklistTaskService = require('../services/checklistTask.service');

const create = async (req, res, next) => {
  try {
    const task = await checklistTaskService.createTask(req.body, req.user);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const tasks = await checklistTaskService.listTasks(req.query);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const task = await checklistTaskService.getTaskById(req.params.id);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const task = await checklistTaskService.updateTask(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const toggleActive = async (req, res, next) => {
  try {
    const task = await checklistTaskService.toggleActive(req.params.id, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const task = await checklistTaskService.deleteTask(req.params.id, req.user);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

const preview = async (req, res, next) => {
  try {
    const dates = checklistTaskService.previewDates(req.body);
    res.status(200).json({ success: true, data: dates });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  getOne,
  update,
  toggleActive,
  remove,
  preview,
};
