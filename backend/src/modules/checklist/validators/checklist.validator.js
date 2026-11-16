const Joi = require('joi');
const { CHECKLIST_FREQUENCIES } = require('../../../utils/recurrence');

const objectId = Joi.string().hex().length(24);

const createTask = {
  body: Joi.object({
    title: Joi.string().trim().min(2).max(240).required(),
    assignedTo: objectId.required(),
    department: objectId.allow(null).optional(),
    frequency: Joi.string().valid(...CHECKLIST_FREQUENCIES).required(),
    anchorDate: Joi.date().iso().required(),
    startOn: Joi.date().iso().optional(),
    endOn: Joi.date().iso().allow(null).optional(),
    dueTime: Joi.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('18:00'),
    skipSundays: Joi.boolean().default(false),
    skipHolidays: Joi.boolean().default(false),
    project: objectId.allow(null).optional(),
  }),
};

const updateTask = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().min(2).max(240).optional(),
    assignedTo: objectId.optional(),
    department: objectId.allow(null).optional(),
    frequency: Joi.string().valid(...CHECKLIST_FREQUENCIES).optional(),
    anchorDate: Joi.date().iso().optional(),
    startOn: Joi.date().iso().optional(),
    endOn: Joi.date().iso().allow(null).optional(),
    dueTime: Joi.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    skipSundays: Joi.boolean().optional(),
    skipHolidays: Joi.boolean().optional(),
    project: objectId.allow(null).optional(),
    active: Joi.boolean().optional(),
  }),
};

const preview = {
  body: Joi.object({
    frequency: Joi.string().valid(...CHECKLIST_FREQUENCIES).required(),
    anchorDate: Joi.date().iso().required(),
    dueTime: Joi.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default('18:00'),
    skipSundays: Joi.boolean().default(false),
    skipHolidays: Joi.boolean().default(false),
    count: Joi.number().integer().min(1).max(20).default(5),
  }),
};

const listOccurrences = {
  query: Joi.object({
    q: Joi.string().allow('').optional(),
    status: Joi.string().valid('all', 'pending', 'done', 'skipped', 'overdue', '').allow('').optional(),
    department: Joi.string().hex().length(24).allow('', null).optional(),
    frequency: Joi.string().valid('', ...CHECKLIST_FREQUENCIES).allow('').optional(),
    assignee: Joi.string().hex().length(24).allow('', null).optional(),
    from: Joi.date().iso().allow('', null).optional(),
    to: Joi.date().iso().allow('', null).optional(),
    slice: Joi.string().valid('all', 'dueToday', 'overdue', 'pending', 'done', 'today', '').allow('', null).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(5000).default(20),
  }),
};

const setStatus = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('pending', 'done', 'skipped').required(),
    remarks: Joi.string().allow('').max(1000).optional(),
  }),
};

const progressRemark = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    note: Joi.string().trim().min(2).max(1000).required(),
    expectedDate: Joi.date().iso().required(),
  }),
};

const reassign = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    toUserId: objectId.required(),
    reason: Joi.string().trim().allow('').max(500).optional(),
  }),
};

module.exports = {
  createTask,
  updateTask,
  preview,
  listOccurrences,
  setStatus,
  progressRemark,
  reassign,
};
