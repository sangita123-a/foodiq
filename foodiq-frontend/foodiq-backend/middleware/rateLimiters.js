/**
 * Route-scoped rate limiters. Never applied to Razorpay webhook.
 */
const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);

const authLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many auth attempts. Please try again later.',
    error: { code: 'RATE_LIMIT' },
  },
});

const otpLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_OTP_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_OTP_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.',
    error: { code: 'RATE_LIMIT' },
  },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX || 40),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload rate limit exceeded.',
    error: { code: 'RATE_LIMIT' },
  },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const p = req.originalUrl || '';
    if (
      p.startsWith('/api/payments/webhook') ||
      p.startsWith('/api/health') ||
      p.startsWith('/api/monitoring/health')
    ) {
      return true;
    }
    // Opt-in only: allow local/staging load tests (never enable in public prod without LB limits)
    if (
      String(process.env.PERF_LOADTEST_BYPASS || '').toLowerCase() === 'true' &&
      String(req.headers['user-agent'] || '').includes('foodiq-load-test')
    ) {
      return true;
    }
    return false;
  },
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: { code: 'RATE_LIMIT' },
  },
});

module.exports = {
  authLimiter,
  otpLimiter,
  uploadLimiter,
  apiLimiter,
};
