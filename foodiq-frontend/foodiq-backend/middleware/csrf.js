/**
 * Optional CSRF protection for cookie-based mutating requests.
 * Bearer JWT (Authorization header) is exempt — SPA default.
 */
const crypto = require('crypto');

const CSRF_COOKIE = 'foodiq_csrf';
const CSRF_HEADER = 'x-csrf-token';

const enabled = () => String(process.env.CSRF_ENABLED || 'false').toLowerCase() === 'true';

const issueToken = () => crypto.randomBytes(24).toString('hex');

const csrfProtection = (req, res, next) => {
  if (!enabled()) return next();

  // Always allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = issueToken();
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return next();
  }

  // Webhooks & public signed callbacks
  const path = req.originalUrl || '';
  if (path.startsWith('/api/payments/webhook')) return next();

  // Bearer JWT auth — not cookie session → CSRF not applicable
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
      error: { code: 'CSRF' },
    });
  }
  return next();
};

module.exports = {
  csrfProtection,
  CSRF_COOKIE,
  CSRF_HEADER,
  enabled,
};
