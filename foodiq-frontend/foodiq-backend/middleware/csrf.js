/**
 * Optional CSRF protection for cookie-based mutating requests.
 * Bearer JWT (Authorization header) is exempt — SPA default.
 */
const crypto = require('crypto');

const CSRF_COOKIE = 'foodiq_csrf';
const CSRF_HEADER = 'x-csrf-token';

const enabled = () =>
  String(
    process.env.CSRF_ENABLED ||
      (process.env.NODE_ENV === 'production' ? 'true' : 'false')
  ).toLowerCase() === 'true';

/** Public credential endpoints — no session yet; must not require CSRF cookie. */
const isAuthCredentialPath = (path) => {
  const p = String(path || '').split('?')[0];
  return (
    p === '/api/auth/login' ||
    p === '/api/auth/register' ||
    p === '/api/auth/refresh' ||
    p === '/api/auth/forgot-password' ||
    p === '/api/auth/reset-password' ||
    p === '/api/auth/logout' ||
    p.startsWith('/api/delivery/register')
  );
};

const issueToken = () => crypto.randomBytes(24).toString('hex');

const csrfProtection = (req, res, next) => {
  if (!enabled()) return next();

  const path = req.originalUrl || req.url || '';

  // Webhooks & public signed callbacks
  if (path.startsWith('/api/payments/webhook')) return next();

  // Login/register/refresh must work before any CSRF cookie exists (SPA + API proxy).
  if (isAuthCredentialPath(path)) return next();

  // Always allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    if (!req.cookies?.[CSRF_COOKIE]) {
      const token = issueToken();
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return next();
  }

  // Bearer JWT auth — not cookie session → CSRF not applicable
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];
  const a = Buffer.from(String(cookieToken || ''), 'utf8');
  const b = Buffer.from(String(headerToken || ''), 'utf8');
  const match =
    a.length > 0 &&
    a.length === b.length &&
    crypto.timingSafeEqual(a, b);
  if (!match) {
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
