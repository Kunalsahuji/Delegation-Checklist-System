const Department = require('../models/department.model');
const Project = require('../models/project.model');
const User = require('../../auth/models/user.model');

const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ active: true }).sort({ order: 1, name: 1 });
    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

const createDepartment = async (req, res, next) => {
  try {
    const { name, key, order } = req.body;
    const department = await Department.create({
      name,
      key: key || name.toLowerCase().replace(/\s+/g, '-'),
      order: order || 0,
    });
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ active: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, code, location } = req.body;
    const project = await Project.create({ name, code, location });
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ status: 'active' })
      .select('name email phone role department')
      .populate('department', 'name key')
      .sort({ name: 1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  getProjects,
  createProject,
  getUsers,
};
