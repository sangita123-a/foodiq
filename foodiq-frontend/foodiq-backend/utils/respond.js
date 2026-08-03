/**
 * Safe API error responses — never leak internals in production.
 */
const { log } = require('./logger');

const isProd = () => process.env.NODE_ENV === 'production';

const fail = (res, status, clientMessage, err = null, extra = {}) => {
  if (err) {
    log.error(err.message || clientMessage, {
      status,
      detail: err.message,
      ...(extra.log || {}),
    });
    // 500s passed through fail() only ever hit the Winston file logs, which
    // aren't reachable from the admin error dashboard — persist them the
    // same way the global errorHandler does so they're actually visible.
    if (status >= 500) {
      const req = extra.req || null;
      require('../services/errorTracker')
        .trackError({
          source: 'backend',
          type: err.code || 'exception',
          message: err.message || clientMessage,
          stack: err.stack,
          statusCode: status,
          path: req?.originalUrl || extra.path || null,
          method: req?.method || null,
          userId: req?.user?.id || req?.deliveryPartner?.id || null,
          requestId: extra.requestId || null,
        })
        .catch(() => {});
    }
  }
  const message =
    isProd() && status >= 500
      ? 'Server Error'
      : clientMessage || 'Request failed';

  return res.status(status).json({
    success: false,
    message,
    error: isProd()
      ? { request_id: extra.requestId || null }
      : {
          detail: err?.message || null,
          request_id: extra.requestId || null,
        },
  });
};

const ok = (res, message, data = {}, status = 200) =>
  res.status(status).json({ success: true, message, data });

module.exports = { fail, ok, isProd };
