const { body } = require('express-validator');

const VALID_REASONS = [
  'Accident',
  'Vehicle Breakdown',
  'Medical Emergency',
  'Customer Threat',
  'Robbery',
  'Harassment',
  'Road Block',
  'Other',
];

const validateCreateEmergency = [
  body('reason')
    .notEmpty()
    .withMessage('Emergency reason is required')
    .isIn(VALID_REASONS)
    .withMessage(`Reason must be one of: ${VALID_REASONS.join(', ')}`),
  body('latitude')
    .notEmpty()
    .withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a valid coordinate between -90 and 90'),
  body('longitude')
    .notEmpty()
    .withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a valid coordinate between -180 and 180'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accuracy must be a positive number'),
  body('battery_level')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Battery level must be an integer between 0 and 100'),
  body('network_type')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 }),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
];

module.exports = {
  VALID_REASONS,
  validateCreateEmergency,
};
