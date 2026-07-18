/**
 * Log slow API requests; set X-Response-Time before the response is finalized.
 */
const { log } = require('../utils/logger');

const SLOW_MS = Number(process.env.SLOW_REQUEST_MS || 500);

const requestTiming = (req, res, next) => {
  const start = process.hrtime.bigint();
  const origEnd = res.end.bind(res);

  res.end = function patchedEnd(...args) {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) {
      try {
        res.setHeader('X-Response-Time', `${ms.toFixed(1)}ms`);
      } catch {
        /* ignore */
      }
    }
    if (ms >= SLOW_MS && !String(req.originalUrl || '').startsWith('/api/health')) {
      log.warn('slow_request', {
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        ms: Math.round(ms),
      });
    }
    return origEnd(...args);
  };

  next();
};

module.exports = { requestTiming };
