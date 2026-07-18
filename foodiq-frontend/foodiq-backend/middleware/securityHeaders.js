/**
 * Helmet security headers — webhook & Socket.IO friendly defaults.
 */
const helmet = require('helmet');

const securityHeaders = helmet({
  contentSecurityPolicy: false, // SPA + Socket.IO; frontend owns CSP
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' },
});

module.exports = securityHeaders;
