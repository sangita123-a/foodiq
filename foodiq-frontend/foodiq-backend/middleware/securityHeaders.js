/**
 * Helmet security headers — production-hardened defaults.
 */
const helmet = require('helmet');

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = helmet({
  contentSecurityPolicy: false, // SPA + Socket.IO; frontend owns CSP
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
  hsts: isProd
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});

module.exports = securityHeaders;
