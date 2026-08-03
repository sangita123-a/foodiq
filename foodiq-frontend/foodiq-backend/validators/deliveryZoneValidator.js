const { body, param, query } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

const validateCreateZone = [
  body('name').trim().notEmpty().withMessage('Zone name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').optional().trim(),
  body('country').optional().trim(),
  body('zone_type')
    .optional()
    .isIn(['polygon', 'circle'])
    .withMessage('zone_type must be polygon or circle'),
  body('polygon').custom((val, { req }) => {
    const zoneType = req.body.zone_type || 'polygon';
    if (zoneType === 'polygon') {
      if (!val) throw new Error('Polygon geometry is required for polygon zones');
      const points = Array.isArray(val) ? val : null;
      if (points && points.length > 0 && points.length < 3) {
        throw new Error('A polygon needs at least 3 points');
      }
    }
    return true;
  }),
  body('center_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('center_latitude must be valid float between -90 and 90'),
  body('center_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('center_longitude must be valid float between -180 and 180'),
  body('radius_km')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('radius_km must be greater than 0'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('priority must be an integer between 0 and 1000'),
  handleValidationErrors,
];

const validateUpdateZone = [
  param('id').isUUID().withMessage('Invalid zone ID'),
  body('name').optional().trim().notEmpty().withMessage('Zone name cannot be empty'),
  body('city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('zone_type')
    .optional()
    .isIn(['polygon', 'circle'])
    .withMessage('zone_type must be polygon or circle'),
  body('center_latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }),
  body('center_longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }),
  body('radius_km')
    .optional()
    .isFloat({ min: 0.01 }),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('priority must be an integer between 0 and 1000'),
  body('is_active').optional().isBoolean(),
  handleValidationErrors,
];

const validateZoneIdParam = [
  param('id').isUUID().withMessage('Invalid zone ID'),
  handleValidationErrors,
];

const validateAssignPartner = [
  param('id').isUUID().withMessage('Invalid zone ID'),
  body('partner_id').isUUID().withMessage('Valid partner_id is required'),
  handleValidationErrors,
];

const validateRemovePartner = [
  param('id').isUUID().withMessage('Invalid zone ID'),
  body('partner_id').isUUID().withMessage('Valid partner_id is required'),
  handleValidationErrors,
];

const validateNearbyQuery = [
  query('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('latitude must be between -90 and 90'),
  query('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180'),
  query('radius_km').optional().isFloat({ min: 0.1, max: 200 }).withMessage('radius_km must be between 0.1 and 200'),
  handleValidationErrors,
];

module.exports = {
  validateCreateZone,
  validateUpdateZone,
  validateZoneIdParam,
  validateAssignPartner,
  validateRemovePartner,
  validateNearbyQuery,
};
