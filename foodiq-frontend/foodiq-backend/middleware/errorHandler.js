const { trackError } = require('../services/errorTracker');
const { log } = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const statusCode =
    err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  trackError({
    source: 'backend',
    type: err.code || 'exception',
    message: err.message || 'Server Error',
    stack: err.stack,
    statusCode,
    path: req.originalUrl,
    method: req.method,
    userId: req.user?.id || null,
    requestId: req.requestId || null,
  }).catch(() => {});

  log.error(err.message || 'Unhandled error', {
    request_id: req.requestId,
    path: req.originalUrl,
    status: statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    error:
      process.env.NODE_ENV === 'production'
        ? { request_id: req.requestId || null }
        : { stack: err.stack, request_id: req.requestId || null },
  });
};

module.exports = errorHandler;
