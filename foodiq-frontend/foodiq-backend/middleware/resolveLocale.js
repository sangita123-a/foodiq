const { normalizeLocale } = require('../services/i18nService');

const resolveLocale = (req, _res, next) => {
  const header = req.headers['x-locale'] || req.headers['accept-language'] || '';
  const fromQuery = req.query.locale;
  const fromUser = req.user?.language || req.user?.locale;
  const raw = fromQuery || fromUser || String(header).split(',')[0] || 'en';
  req.locale = normalizeLocale(raw);
  next();
};

module.exports = { resolveLocale };
