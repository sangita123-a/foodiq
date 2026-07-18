/**
 * HTTPS enforcement behind TLS terminators (Render/Vercel/Nginx).
 * Set FORCE_HTTPS=true (default in production) to redirect HTTP → HTTPS.
 */
const forceHttps = (req, res, next) => {
  const enabled =
    String(
      process.env.FORCE_HTTPS ||
        (process.env.NODE_ENV === 'production' ? 'true' : 'false')
    ).toLowerCase() === 'true';

  if (!enabled) return next();

  // Skip health probes and local
  const path = req.originalUrl || '';
  if (path.startsWith('/api/health') || path.startsWith('/api/monitoring/health')) {
    return next();
  }

  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || '')
    .split(',')[0]
    .trim();
  if (proto === 'https') return next();

  // Only redirect when Host is present (behind proxy)
  const host = req.headers.host;
  if (!host) return next();

  return res.redirect(301, `https://${host}${req.originalUrl}`);
};

module.exports = forceHttps;
