const projectService = require('../services/project.service');

const listProjects = async (req, res, next) => {
  try {
    const { search, status, propertyType, page, limit } = req.query;
    const result = await projectService.listProjects({
      search,
      status,
      propertyType,
      page,
      limit,
    });
    res.status(200).json({ success: true, ...result, data: result.projects });
  } catch (error) {
    next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject(req.body, req.user?._id);
    res.status(201).json({ success: true, message: 'Project created successfully', data: project });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.body, req.user?._id);
    res.status(200).json({ success: true, message: 'Project updated successfully', data: project });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.id, req.user?._id);
    res.status(200).json({ success: true, message: result.message, id: result.id });
  } catch (error) {
    next(error);
  }
};

const addUnit = async (req, res, next) => {
  try {
    const unit = await projectService.addUnit(req.params.id, req.body);
    res.status(201).json({ success: true, message: 'Unit added successfully', data: unit });
  } catch (error) {
    next(error);
  }
};

const updateUnit = async (req, res, next) => {
  try {
    const unit = await projectService.updateUnit(req.params.id, req.params.unitId, req.body);
    res.status(200).json({ success: true, message: 'Unit updated successfully', data: unit });
  } catch (error) {
    next(error);
  }
};

const deleteUnit = async (req, res, next) => {
  try {
    const result = await projectService.deleteUnit(req.params.id, req.params.unitId);
    res.status(200).json({ success: true, message: result.message, unitId: result.unitId });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addUnit,
  updateUnit,
  deleteUnit,
};
