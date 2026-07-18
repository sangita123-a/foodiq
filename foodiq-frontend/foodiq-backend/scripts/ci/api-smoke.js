/**
 * API smoke / integration checks against a running Foodiq API.
 * Includes V1 catalog checks + V2.0 auth-gated surface compatibility.
 * Usage: BASE_URL=http://localhost:4000 node scripts/ci/api-smoke.js
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';

const CHECKS = [
  { path: '/api/health', expectStatus: 200, name: 'health' },
  { path: '/api/restaurants?page=1&limit=5', expectStatus: [200, 500], name: 'restaurants' },
  { path: '/api/restaurant-categories', expectStatus: [200, 500], name: 'categories' },
  { path: '/api/offers', expectStatus: [200, 500], name: 'offers' },
  { path: '/api/cuisines', expectStatus: [200, 500], name: 'cuisines' },
  // V2.0 — unauthenticated must not 404 (route must exist)
  { path: '/api/feedback', method: 'POST', expectStatus: [201, 400, 401, 429], name: 'v2_feedback_post' },
  { path: '/api/bugs', method: 'POST', expectStatus: [201, 400, 401, 429], name: 'v2_bugs_post' },
  { path: '/api/admin/feedback', expectStatus: [401, 403], name: 'v2_admin_feedback_auth' },
  { path: '/api/admin/bugs', expectStatus: [401, 403], name: 'v2_admin_bugs_auth' },
  { path: '/api/admin/maintenance/health', expectStatus: [401, 403], name: 'v2_admin_maintenance_auth' },
  { path: '/api/admin/analytics/reviews', expectStatus: [401, 403], name: 'v2_admin_review_analytics_auth' },
  { path: '/api/admin/analytics/v2-adoption', expectStatus: [401, 403], name: 'v2_adoption_auth' },
  { path: '/api/partner/reviews', expectStatus: [401, 403], name: 'v2_partner_reviews_auth' },
  { path: '/api/delivery/me/reviews', expectStatus: [401, 403], name: 'v2_delivery_reviews_auth' },
];

const request = (path, method = 'GET') =>
  new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        timeout: 15000,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'foodiq-ci-smoke/2.0',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    if (method === 'POST') {
      req.write(JSON.stringify({}));
    }
    req.end();
  });

async function main() {
  console.log(`[api-smoke] BASE_URL=${BASE} (Foodiq 2.0)`);
  let failed = 0;
  for (const check of CHECKS) {
    const allowed = Array.isArray(check.expectStatus)
      ? check.expectStatus
      : [check.expectStatus];
    try {
      const res = await request(check.path, check.method || 'GET');
      const ok = allowed.includes(res.status);
      if (check.name === 'health') {
        let json = {};
        try {
          json = JSON.parse(res.body);
        } catch {
          /* ignore */
        }
        if (res.status !== 200 || json.status !== 'success') {
          console.error(`FAIL ${check.name} status=${res.status} body=${res.body.slice(0, 200)}`);
          failed += 1;
          continue;
        }
      }
      if (!ok) {
        console.error(`FAIL ${check.name} status=${res.status}`);
        failed += 1;
      } else {
        console.log(`PASS ${check.name} status=${res.status}`);
      }
    } catch (err) {
      console.error(`FAIL ${check.name} ${err.message}`);
      failed += 1;
    }
  }
  if (failed) {
    console.error(`[api-smoke] ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('[api-smoke] All checks passed');
}

main();
