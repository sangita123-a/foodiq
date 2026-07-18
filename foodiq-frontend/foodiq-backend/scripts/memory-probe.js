/**
 * Memory / heap snapshot helper for leak detection during soak tests.
 * Usage: node scripts/memory-probe.js
 * Optional: INTERVAL_MS=5000 DURATION_MS=60000 node scripts/memory-probe.js
 */
const fs = require('fs');
const path = require('path');

const interval = Number(process.env.INTERVAL_MS || 5000);
const duration = Number(process.env.DURATION_MS || 60000);
const outDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(outDir, { recursive: true });

const samples = [];
const start = Date.now();

console.log('Sampling process memory…');
const timer = setInterval(() => {
  const mem = process.memoryUsage();
  const sample = {
    t: new Date().toISOString(),
    rss_mb: Math.round(mem.rss / 1024 / 1024),
    heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
    heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
    external_mb: Math.round(mem.external / 1024 / 1024),
  };
  samples.push(sample);
  console.log(sample);
  if (Date.now() - start >= duration) {
    clearInterval(timer);
    const file = path.join(outDir, `memory-probe-${Date.now()}.json`);
    const first = samples[0];
    const last = samples[samples.length - 1];
    const report = {
      samples,
      delta_heap_mb: last.heap_used_mb - first.heap_used_mb,
      delta_rss_mb: last.rss_mb - first.rss_mb,
      leak_suspect: last.heap_used_mb - first.heap_used_mb > 50,
    };
    fs.writeFileSync(file, JSON.stringify(report, null, 2));
    console.log('Wrote', file);
    console.log(
      report.leak_suspect
        ? 'WARNING: heap grew >50MB — investigate sockets/listeners/caches'
        : 'Heap growth within normal bounds for this window'
    );
    process.exit(0);
  }
}, interval);

timer.unref?.();
