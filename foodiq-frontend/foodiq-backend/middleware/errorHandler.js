const { trackError } = require('../services/errorTracker');
const { log } = require('../utils/logger');
const { isDatabaseError, logFirstDbError, getClientDatabaseErrorMessage } = require('../config/db');

const errorHandler = (err, req, res, _next) => {
  const isDbErr = isDatabaseError(err);
  if (isDbErr) {
    logFirstDbError(err, `errorHandler: ${req.method} ${req.originalUrl}`);
  }

  const statusCode = isDbErr
    ? 503
    : err.status || err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
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
    code: err.code,
    request_id: req.requestId,
    path: req.originalUrl,
    status: statusCode,
    stack: err.stack,
  });

  // TEMP diagnostic — no Render dashboard log access available; remove once
  // the delivery shift check-in/check-out 500 is root-caused.
  res.setHeader('X-Debug-Global-Error', String(err?.message || 'unknown').slice(0, 300));

  const clientMessage = isDbErr
    ? getClientDatabaseErrorMessage(err)
    : statusCode >= 500
      ? 'Server Error'
      : err.expose === false
        ? 'Request failed'
        : err.message || 'Request failed';

  res.status(statusCode).json({
    success: false,
    message: isProd && statusCode >= 500 && !isDbErr ? 'Server Error' : clientMessage,
    error: isProd
      ? { request_id: req.requestId || null }
      : { code: err.code, stack: err.stack, request_id: req.requestId || null },
  });
};

module.exports = errorHandler;
