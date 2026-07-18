/**
 * Request ID + timing + HTTP access log.
 */
const crypto = require('crypto');
const { log } = require('../utils/logger');
const { recordRequest } = require('../services/metricsService');

const requestContext = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  req._startAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - req._startAt) / 1e6;
    recordRequest(durationMs, res.statusCode);
    const path = req.originalUrl || req.url;
    // Skip noisy health polls in file logs at info — still counted in metrics
    if (path.startsWith('/api/health') && res.statusCode < 400) return;
    log.http('request', {
      request_id: req.requestId,
      method: req.method,
      path,
      status: res.statusCode,
      duration_ms: Math.round(durationMs),
      user_id: req.user?.id || null,
      ip: req.headers['x-forwarded-for'] || req.ip,
    });

    // Suspicious activity: auth failures, forbidden, CSRF
    if (res.statusCode === 401 || res.statusCode === 403) {
      log.warn('suspicious_activity', {
        request_id: req.requestId,
        method: req.method,
        path,
        status: res.statusCode,
        user_id: req.user?.id || null,
        ip: req.headers['x-forwarded-for'] || req.ip,
        ua: req.headers['user-agent'] || null,
      });
    }
  });

  next();
};

module.exports = requestContext;
