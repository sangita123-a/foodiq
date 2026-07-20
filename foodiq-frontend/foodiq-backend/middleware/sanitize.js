/**
 * Lightweight input sanitization (XSS / prototype pollution).
 * Does NOT HTML-entity-encode stored text (React escapes on render).
 * SQL injection is prevented by parameterized queries.
 */
const stripDangerousHtml = (value) =>
  String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\0/g, '');

const stripTags = (value) =>
  stripDangerousHtml(value)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const SENSITIVE_KEYS = /password|token|secret|authorization|cookie|credit|cvv|card|refresh/i;

const sanitizeObject = (obj, depth = 0) => {
  if (depth > 6 || obj == null) return obj;
  if (typeof obj === 'string') {
    const trimmed = obj.length > 50000 ? obj.slice(0, 50000) : obj;
    return stripDangerousHtml(trimmed);
  }
  if (Array.isArray(obj)) return obj.map((v) => sanitizeObject(v, depth + 1));
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (SENSITIVE_KEYS.test(k) && typeof v === 'string') {
        out[k] = v.length > 50000 ? v.slice(0, 50000) : v.replace(/\0/g, '');
        continue;
      }
      out[k] = sanitizeObject(v, depth + 1);
    }
    return out;
  }
  return obj;
};

const sanitizeBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
};

const sanitizeQuery = (req, _res, next) => {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
};

module.exports = {
  stripTags,
  stripDangerousHtml,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
};
