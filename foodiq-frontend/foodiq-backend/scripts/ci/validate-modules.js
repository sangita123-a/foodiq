/**
 * Post-deploy module validation checklist (HTTP smoke).
 * Validates customer catalog + health surfaces without mutating data.
 * Usage: BASE_URL=https://api.example.com node scripts/ci/validate-modules.js
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';
const FRONTEND = process.env.FRONTEND_URL || '';

const MODULES = [
  { id: 'health', path: '/api/health', required: true },
  { id: 'customer_catalog_restaurants', path: '/api/restaurants?page=1&limit=3', required: true },
  { id: 'customer_categories', path: '/api/restaurant-categories', required: true },
  { id: 'offers', path: '/api/offers', required: false },
  { id: 'cuisines', path: '/api/cuisines', required: false },
  { id: 'auth_surface', path: '/api/auth/profile', expectStatus: [401, 403], required: true },
];

const get = (base, path) =>
  new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        timeout: 20000,
        headers: { Accept: 'application/json', 'User-Agent': 'foodiq-ci-validate/1.0' },
      },
      (res) => {
        res.resume();
        res.on('end', () => resolve(res.statusCode));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });

async function main() {
  console.log(`[validate-modules] API=${BASE}`);
  let failed = 0;
  for (const m of MODULES) {
    const allowed = m.expectStatus || [200];
    try {
      const status = await get(BASE, m.path);
      const ok = allowed.includes(status);
      if (!ok && m.required) {
        console.error(`FAIL module=${m.id} status=${status}`);
        failed += 1;
      } else if (!ok) {
        console.warn(`WARN module=${m.id} status=${status}`);
      } else {
        console.log(`PASS module=${m.id} status=${status}`);
      }
    } catch (err) {
      if (m.required) {
        console.error(`FAIL module=${m.id} ${err.message}`);
        failed += 1;
      } else {
        console.warn(`WARN module=${m.id} ${err.message}`);
      }
    }
  }

  if (FRONTEND) {
    try {
      const status = await get(FRONTEND, '/');
      if (status >= 200 && status < 400) {
        console.log(`PASS frontend_home status=${status}`);
      } else {
        console.error(`FAIL frontend_home status=${status}`);
        failed += 1;
      }
    } catch (err) {
      console.error(`FAIL frontend_home ${err.message}`);
      failed += 1;
    }
  }

  console.log(
    [
      'Checklist (manual / E2E when credentials available):',
      '- Customer App',
      '- Restaurant Dashboard',
      '- Delivery Partner Module',
      '- Admin Dashboard',
      '- Payments (Razorpay mock/test)',
      '- Notifications',
      '- Tracking / Socket.IO',
      '- Cloud Storage',
      '- Authentication',
    ].join('\n')
  );

  if (failed) {
    process.exit(1);
  }
  console.log('[validate-modules] Automated checks passed');
}

main();
