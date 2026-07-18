/**
 * Lightweight input sanitization helpers (XSS / prototype pollution).
 * SQL injection is prevented by parameterized queries — never concatenate user input into SQL.
 */
const stripTags = (value) =>
  String(value ?? '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const sanitizeObject = (obj, depth = 0) => {
  if (depth > 6 || obj == null) return obj;
  if (typeof obj === 'string') return obj.length > 50000 ? obj.slice(0, 50000) : obj;
  if (Array.isArray(obj)) return obj.map((v) => sanitizeObject(v, depth + 1));
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
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

module.exports = {
  stripTags,
  sanitizeObject,
  sanitizeBody,
};
