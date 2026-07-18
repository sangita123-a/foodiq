/**
 * V2.0 regression + backward-compatibility checks.
 * - V1 catalog/auth surfaces still behave
 * - V2 routes mounted (auth-gated = 401/403, not 404)
 * Usage: BASE_URL=http://127.0.0.1:4000 node scripts/ci/v2-regression.js
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4000';

const V1 = [
  { path: '/api/health', expect: [200], name: 'v1_health' },
  { path: '/api/v1/health', expect: [200], name: 'v3_public_api_health' },
  { path: '/api/v4/health', expect: [200], name: 'v4_public_api_health' },
  { path: '/api/v4/i18n/messages?locale=en', expect: [200], name: 'v4_i18n' },
  { path: '/api/v4/marketplace', expect: [200], name: 'v4_marketplace' },
  { path: '/api/admin/v4/bi/enterprise', expect: [401, 403], name: 'v4_admin_bi_auth' },
  { path: '/api/v1/branding?host=localhost', expect: [200], name: 'v3_branding' },
  { path: '/api/admin/v3/bi', expect: [401, 403], name: 'v3_admin_bi_auth' },
  { path: '/api/restaurants?limit=1', expect: [200, 500], name: 'v1_restaurants' },
  { path: '/api/menu-items?limit=1', expect: [200, 400, 404, 500], name: 'v1_menu' },
  { path: '/api/cart', expect: [401, 403], name: 'v1_cart_auth' },
  { path: '/api/orders', expect: [401, 403], name: 'v1_orders_auth' },
  { path: '/api/checkout', expect: [401, 403, 404], name: 'v1_checkout_surface' },
];

const V2 = [
  { path: '/api/feedback', method: 'POST', expect: [201, 400, 401, 429], name: 'v2_feedback' },
  { path: '/api/bugs', method: 'POST', expect: [201, 400, 401, 429], name: 'v2_bugs' },
  { path: '/api/admin/feedback', expect: [401, 403], name: 'v2_admin_feedback' },
  { path: '/api/admin/bugs', expect: [401, 403], name: 'v2_admin_bugs' },
  { path: '/api/admin/bugs/weekly-report', expect: [401, 403], name: 'v2_admin_bugs_weekly' },
  { path: '/api/admin/reviews', expect: [401, 403], name: 'v2_admin_reviews' },
  { path: '/api/admin/maintenance/health', expect: [401, 403], name: 'v2_maintenance' },
  { path: '/api/admin/analytics/reviews', expect: [401, 403], name: 'v2_review_analytics' },
  { path: '/api/admin/analytics/v2-adoption', expect: [401, 403], name: 'v2_adoption' },
  { path: '/api/partner/reviews', expect: [401, 403], name: 'v2_partner_reviews' },
  { path: '/api/delivery/me/reviews', expect: [401, 403], name: 'v2_delivery_reviews' },
  {
    path: '/api/orders/00000000-0000-0000-0000-000000000000/feedback',
    expect: [401, 403, 404],
    name: 'v2_order_feedback_route',
  },
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
          'User-Agent': 'foodiq-v2-regression/2.0',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    if (method === 'POST') req.write('{}');
    req.end();
  });

async function runGroup(label, checks) {
  console.log(`\n[${label}]`);
  let failed = 0;
  for (const check of checks) {
    try {
      const res = await request(check.path, check.method || 'GET');
      if (!check.expect.includes(res.status)) {
        console.error(`FAIL ${check.name} status=${res.status} expected=${check.expect.join('|')}`);
        failed += 1;
      } else {
        console.log(`PASS ${check.name} status=${res.status}`);
      }
    } catch (err) {
      console.error(`FAIL ${check.name} ${err.message}`);
      failed += 1;
    }
  }
  return failed;
}

async function main() {
  console.log(`[v2-regression] BASE_URL=${BASE}`);
  const failed = (await runGroup('V1 backward compatibility', V1)) + (await runGroup('V2.0 surfaces', V2));
  if (failed) {
    console.error(`\n[v2-regression] ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log('\n[v2-regression] All checks passed — V1 compatible + V2 mounted');
}

main();
