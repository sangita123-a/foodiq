/**
 * Auth cookie helpers for access + refresh tokens.
 * Cross-origin SPAs still use Bearer; cookies harden same-site / credentialed flows.
 */
const isProd = () => process.env.NODE_ENV === 'production';

const secureCookiesEnabled = () =>
  String(process.env.AUTH_SECURE_COOKIES || 'true').toLowerCase() === 'true';

const cookieBase = () => {
  const sameSiteEnv = String(process.env.AUTH_COOKIE_SAMESITE || '').toLowerCase();
  // Cross-site (Vercel → Render) needs None+Secure; same-site can use lax
  const sameSite =
    sameSiteEnv === 'none' || sameSiteEnv === 'lax' || sameSiteEnv === 'strict'
      ? sameSiteEnv
      : isProd()
        ? 'none'
        : 'lax';

  return {
    httpOnly: true,
    secure: isProd() || sameSite === 'none',
    sameSite,
    path: '/',
  };
};

const setAuthCookies = (res, { accessToken, refreshToken }) => {
  if (!secureCookiesEnabled()) return;
  const base = cookieBase();
  if (accessToken) {
    res.cookie('token', accessToken, {
      ...base,
      maxAge: Number(process.env.JWT_ACCESS_COOKIE_MS || 60 * 60 * 1000),
    });
  }
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, {
      ...base,
      maxAge: Number(process.env.JWT_REFRESH_COOKIE_MS || 7 * 24 * 60 * 60 * 1000),
    });
  }
};

const clearAuthCookies = (res) => {
  if (!secureCookiesEnabled()) return;
  const base = cookieBase();
  res.clearCookie('token', base);
  res.clearCookie('refresh_token', base);
};

module.exports = {
  secureCookiesEnabled,
  setAuthCookies,
  clearAuthCookies,
  cookieBase,
};
