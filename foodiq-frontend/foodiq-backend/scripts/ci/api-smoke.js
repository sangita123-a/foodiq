/**
 * API smoke / integration checks against a running Foodiq API.
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
];

const get = (path) =>
  new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        timeout: 15000,
        headers: { Accept: 'application/json', 'User-Agent': 'foodiq-ci-smoke/1.0' },
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
  });

async function main() {
  console.log(`[api-smoke] BASE_URL=${BASE}`);
  let failed = 0;
  for (const check of CHECKS) {
    const allowed = Array.isArray(check.expectStatus)
      ? check.expectStatus
      : [check.expectStatus];
    try {
      const res = await get(check.path);
      const ok = allowed.includes(res.status);
      // Health must always be 200 with success when API is up
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
