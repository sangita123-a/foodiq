/**
 * UI route smoke — fetches public HTML routes (no browser required).
 * Usage: FRONTEND_URL=http://localhost:3000 node scripts/ui-smoke.mjs
 */
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const BASE = process.env.FRONTEND_URL || 'http://127.0.0.1:3000';

const ROUTES = [
  '/',
  '/login',
  '/register',
  '/search',
  '/offers',
  '/popular-restaurants',
  '/admin/login',
  '/partner/login',
  '/delivery/login',
];

function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.get(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        timeout: 30000,
        headers: { 'User-Agent': 'foodiq-ui-smoke/1.0', Accept: 'text/html' },
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
}

let failed = 0;
console.log(`[ui-smoke] FRONTEND_URL=${BASE}`);
for (const route of ROUTES) {
  try {
    const status = await get(route);
    if (status >= 200 && status < 400) {
      console.log(`PASS ${route} ${status}`);
    } else {
      console.error(`FAIL ${route} ${status}`);
      failed += 1;
    }
  } catch (err) {
    console.error(`FAIL ${route} ${err.message}`);
    failed += 1;
  }
}

if (failed) {
  console.error(`[ui-smoke] ${failed} route(s) failed`);
  process.exit(1);
}
console.log('[ui-smoke] All routes reachable');
