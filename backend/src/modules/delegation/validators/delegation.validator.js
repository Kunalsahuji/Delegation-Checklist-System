const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const create = {
  body: Joi.object({
    title: Joi.string().trim().min(2).max(240).required(),
    description: Joi.string().allow('').max(2000).optional(),
    assignedTo: objectId.required(),
    dueDate: Joi.date().iso().required(),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    project: objectId.allow('', null).optional(),
    department: objectId.allow('', null).optional(),
    startDate: Joi.date().iso().allow('', null).optional(),
    proofRequired: Joi.boolean().default(false),
    verificationRequired: Joi.boolean().default(false),
  }),
};

const update = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    title: Joi.string().trim().min(2).max(240).optional(),
    description: Joi.string().allow('').max(2000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    project: objectId.allow('', null).optional(),
    department: objectId.allow('', null).optional(),
    startDate: Joi.date().iso().allow('', null).optional(),
    proofRequired: Joi.boolean().optional(),
    verificationRequired: Joi.boolean().optional(),
    originalDueDate: Joi.forbidden(),
    dueDate: Joi.forbidden(),
    revisions: Joi.forbidden(),
  }),
};

const revise = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    newDueDate: Joi.date().iso().required().messages({
      'any.required': 'New due date is required for revision',
    }),
    reason: Joi.string().trim().min(3).max(500).required().messages({
      'any.required': 'A reason is strictly mandatory whenever changing a task deadline',
      'string.min': 'Please provide a clear reason for the date change (minimum 3 characters)',
    }),
    kind: Joi.string().valid('revise', 'weekShift').default('revise'),
  }),
};

const setStatus = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'cancelled').required(),
    cancelReason: Joi.string().trim().allow('').max(500).optional(),
  }),
};

const reportProgress = {
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

const followUp = {
  params: Joi.object({
    id: objectId.required(),
  }),
  body: Joi.object({
    note: Joi.string().trim().min(2).max(1000).required(),
    nextOn: Joi.date().iso().allow(null).optional(),
  }),
};

const list = {
  query: Joi.object({
    q: Joi.string().allow('').optional(),
    status: Joi.string().valid('all', 'pending', 'completed', 'overdue', 'weekShifted', 'cancelled', '').allow('').optional(),
    assignee: Joi.string().hex().length(24).allow('', null).optional(),
    department: Joi.string().hex().length(24).allow('', null).optional(),
    project: Joi.string().hex().length(24).allow('', null).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', '').allow('').optional(),
    slice: Joi.string().valid('all', 'pending', 'completed', 'dueToday', 'overdue', 'weekShifted', 'revised', 'followUpDue', '').allow('', null).optional(),
    from: Joi.date().iso().allow('', null).optional(),
    to: Joi.date().iso().allow('', null).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(5000).default(20),
  }),
};

module.exports = {
  create,
  update,
  revise,
  setStatus,
  reportProgress,
  reassign,
  followUp,
  list,
};
