/**
 * Lightweight HTTP load test against Foodiq API.
 * Usage:
 *   node scripts/load-test.js
 *   BASE_URL=http://localhost:4000 CONCURRENCY=50 REQUESTS=2000 node scripts/load-test.js
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE = process.env.BASE_URL || 'http://localhost:4000';
const CONCURRENCY = Number(process.env.CONCURRENCY || 50);
const REQUESTS = Number(process.env.REQUESTS || 1000);

const ENDPOINTS = [
  '/api/health',
  '/api/restaurants?page=1&limit=10',
  '/api/restaurant-categories',
  '/api/offers',
  '/api/cuisines',
];

const timings = [];
let completed = 0;
let errors = 0;
let statusCounts = {};

const requestOnce = (path) =>
  new Promise((resolve) => {
    const url = new URL(path, BASE);
    const lib = url.protocol === 'https:' ? https : http;
    const started = process.hrtime.bigint();
    const req = lib.get(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        timeout: 10000,
        headers: { Accept: 'application/json', 'User-Agent': 'foodiq-load-test/1.0' },
      },
      (res) => {
        res.resume();
        res.on('end', () => {
          const ms = Number(process.hrtime.bigint() - started) / 1e6;
          timings.push(ms);
          statusCounts[res.statusCode] = (statusCounts[res.statusCode] || 0) + 1;
          if (res.statusCode >= 500) errors += 1;
          completed += 1;
          resolve();
        });
      }
    );
    req.on('error', () => {
      errors += 1;
      completed += 1;
      resolve();
    });
    req.on('timeout', () => {
      req.destroy();
      errors += 1;
      completed += 1;
      resolve();
    });
  });

const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

async function run() {
  console.log(`Foodiq load test → ${BASE}`);
  console.log(`Concurrency=${CONCURRENCY} Requests=${REQUESTS}`);
  const t0 = Date.now();
  let issued = 0;
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (issued < REQUESTS) {
      const i = issued++;
      const path = ENDPOINTS[i % ENDPOINTS.length];
      await requestOnce(path);
    }
  });
  await Promise.all(workers);
  const elapsedSec = (Date.now() - t0) / 1000;
  const avg = timings.reduce((a, b) => a + b, 0) / (timings.length || 1);
  const report = {
    base: BASE,
    concurrency: CONCURRENCY,
    requests: REQUESTS,
    completed,
    errors,
    rps: Number((completed / elapsedSec).toFixed(2)),
    latency_ms: {
      avg: Number(avg.toFixed(2)),
      p50: Number(percentile(timings, 50).toFixed(2)),
      p95: Number(percentile(timings, 95).toFixed(2)),
      p99: Number(percentile(timings, 99).toFixed(2)),
      max: Number(percentile(timings, 100).toFixed(2)),
    },
    statusCounts,
    elapsed_sec: Number(elapsedSec.toFixed(2)),
    target_api_p95_under_200ms: percentile(timings, 95) < 200,
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
