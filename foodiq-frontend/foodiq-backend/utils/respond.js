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
