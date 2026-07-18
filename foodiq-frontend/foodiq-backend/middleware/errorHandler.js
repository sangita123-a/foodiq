const { trackError } = require('../services/errorTracker');
const { log } = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const statusCode =
    err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  const isProd = process.env.NODE_ENV === 'production';

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

  const clientMessage =
    statusCode >= 500
      ? 'Server Error'
      : err.expose === false
        ? 'Request failed'
        : err.message || 'Request failed';

  res.status(statusCode).json({
    success: false,
    message: isProd && statusCode >= 500 ? 'Server Error' : clientMessage,
    error: isProd
      ? { request_id: req.requestId || null }
      : { stack: err.stack, request_id: req.requestId || null },
  });
};

module.exports = errorHandler;
