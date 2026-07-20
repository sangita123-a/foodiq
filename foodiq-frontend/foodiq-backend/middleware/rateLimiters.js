/**
 * Route-scoped rate limiters. Never applied to Razorpay webhook.
 */
const rateLimit = require('express-rate-limit');
const { log } = require('../utils/logger');
const { writeAudit } = require('../services/auditService');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);

const rateLimitHandler = (label) => (req, res, _next, options) => {
  const ip = req.headers['x-forwarded-for'] || req.ip;
  log.warn('rate_limit_blocked', {
    label,
    ip,
    path: req.originalUrl,
    method: req.method,
    user_id: req.user?.id || null,
  });
  writeAudit({
    userId: req.user?.id || null,
    action: 'rate_limit_blocked',
    category: 'security',
    status: 'blocked',
    message: `${label} rate limit exceeded`,
    req,
  }).catch(() => {});

  res.status(options.statusCode).json({
    success: false,
    message: options.message?.message || options.message || 'Too many requests',
    error: { code: 'RATE_LIMIT' },
  });
};

const makeLimiter = ({ label, ...opts }) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler(label || 'api'),
    ...opts,
  });

const authLimiter = makeLimiter({
  label: 'auth',
  windowMs,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 30),
  message: 'Too many auth attempts. Please try again later.',
});

const otpLimiter = makeLimiter({
  label: 'otp',
  windowMs: Number(process.env.RATE_LIMIT_OTP_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_OTP_MAX || 10),
  message: 'Too many OTP requests. Please try again later.',
});

const uploadLimiter = makeLimiter({
  label: 'upload',
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX || 40),
  message: 'Upload rate limit exceeded.',
});

const apiLimiter = makeLimiter({
  label: 'api',
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX || 300),
  skip: (req) => {
    const p = req.originalUrl || '';
    if (
      p.startsWith('/api/payments/webhook') ||
      p.startsWith('/api/health') ||
      p.startsWith('/api/monitoring/health')
    ) {
      return true;
    }
    if (
      String(process.env.PERF_LOADTEST_BYPASS || '').toLowerCase() === 'true' &&
      String(req.headers['user-agent'] || '').includes('foodiq-load-test')
    ) {
      return true;
    }
    return false;
  },
  message: 'Too many requests. Please slow down.',
});

const contactLimiter = makeLimiter({
  label: 'contact',
  windowMs: Number(process.env.RATE_LIMIT_CONTACT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_CONTACT_MAX || 8),
  message: 'Too many contact submissions. Please try again later.',
});

const feedbackLimiter = makeLimiter({
  label: 'feedback',
  windowMs: Number(process.env.RATE_LIMIT_FEEDBACK_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_FEEDBACK_MAX || 20),
  message: 'Too many feedback submissions. Please try again later.',
});

const paymentLimiter = makeLimiter({
  label: 'payment',
  windowMs: Number(process.env.RATE_LIMIT_PAYMENT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_PAYMENT_MAX || 25),
  message: 'Too many payment attempts. Please try again later.',
});

const reviewLimiter = makeLimiter({
  label: 'review',
  windowMs: Number(process.env.RATE_LIMIT_REVIEW_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_REVIEW_MAX || 15),
  message: 'Too many review submissions. Please try again later.',
});

module.exports = {
  authLimiter,
  otpLimiter,
  uploadLimiter,
  apiLimiter,
  contactLimiter,
  feedbackLimiter,
  paymentLimiter,
  reviewLimiter,
};
