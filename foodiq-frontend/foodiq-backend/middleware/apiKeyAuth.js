const { findByRawKey } = require('../models/apiKeyModel');

/**
 * Optional / required API key via Authorization: Bearer fq_... or X-Api-Key
 */
const extractKey = (req) => {
  const h = req.headers['x-api-key'];
  if (h) return String(h).trim();
  const auth = req.headers.authorization || '';
  if (auth.toLowerCase().startsWith('bearer fq_')) {
    return auth.slice(7).trim();
  }
  if (auth.toLowerCase().startsWith('apikey ')) {
    return auth.slice(7).trim();
  }
  return null;
};

const optionalApiKey = async (req, res, next) => {
  try {
    const raw = extractKey(req);
    if (raw) {
      req.apiKey = await findByRawKey(raw);
    }
    next();
  } catch (err) {
    next(err);
  }
};

const requireApiKey =
  (...scopes) =>
  async (req, res, next) => {
    try {
      const raw = extractKey(req);
      if (!raw) {
        return res.status(401).json({
          success: false,
          message: 'API key required',
          error: { code: 'API_KEY_REQUIRED' },
        });
      }
      const key = await findByRawKey(raw);
      if (!key) {
        return res.status(401).json({
          success: false,
          message: 'Invalid API key',
          error: { code: 'API_KEY_INVALID' },
        });
      }
      const keyScopes = key.scopes || [];
      if (
        scopes.length &&
        !scopes.some((s) => keyScopes.includes(s) || keyScopes.includes('enterprise'))
      ) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient API key scope',
          error: { code: 'API_KEY_SCOPE' },
        });
      }
      req.apiKey = key;
      next();
    } catch (err) {
      next(err);
    }
  };

module.exports = { optionalApiKey, requireApiKey, extractKey };
