/**
 * Sanitize query string and route params; validate UUID-shaped IDs.
 */
const { sanitizeObject } = require('./sanitize');

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value) => UUID_RE.test(String(value || '').trim());

const sanitizeRequest = (req, _res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

const validateUuidParam =
  (...keys) =>
  (req, res, next) => {
    for (const key of keys) {
      const val = req.params[key];
      if (val != null && val !== '' && !isValidUuid(val)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${key}`,
          error: { code: 'INVALID_ID' },
        });
      }
    }
    next();
  };

module.exports = {
  isValidUuid,
  sanitizeRequest,
  validateUuidParam,
};
