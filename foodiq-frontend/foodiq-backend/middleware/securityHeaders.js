/**
 * Helmet security headers — production-hardened defaults.
 */
const helmet = require('helmet');

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = helmet({
  contentSecurityPolicy: false, // SPA + Socket.IO; frontend owns CSP
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
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
  permissionsPolicy: {
    features: {
      camera: ["'none'"],
      microphone: ["'none'"],
      geolocation: ["'self'"],
      payment: ["'self'", 'https://checkout.razorpay.com'],
    },
  },
});

module.exports = securityHeaders;
