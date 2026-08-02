const { validationResult } = require('express-validator');

/**
 * Middleware that checks the result of express-validator chains.
 * If there are validation errors, it returns a 400 response with details.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }
  next();
};

module.exports = { handleValidationErrors };
