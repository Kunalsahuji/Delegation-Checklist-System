const Joi = require('joi');

const login = {
  body: Joi.object({
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'A valid email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  }),
};

const register = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().allow('').optional(),
    role: Joi.string().valid('Administrator', 'Manager', 'Employee').default('Employee'),
    department: Joi.string().hex().length(24).allow(null).optional(),
  }),
};

module.exports = { login, register };
