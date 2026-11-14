const validate = (schema) => (req, res, next) => {
  if (!schema) return next();

  const toValidate = {};
  if (schema.body) toValidate.body = req.body;
  if (schema.query) toValidate.query = req.query;
  if (schema.params) toValidate.params = req.params;

  const options = { abortEarly: false, stripUnknown: true, allowUnknown: true };

  for (const part of Object.keys(toValidate)) {
    const { error, value } = schema[part].validate(toValidate[part], options);
    if (error) {
      const messages = error.details.map((d) => d.message).join('; ');
      return res.status(400).json({
        success: false,
        message: `Validation error in ${part}: ${messages}`,
      });
    }
    req[part] = value;
  }

  next();
};

module.exports = validate;
