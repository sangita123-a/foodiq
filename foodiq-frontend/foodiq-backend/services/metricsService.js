/**
 * In-memory metrics + periodic DB snapshots for monitoring.
 */
const os = require('os');
const { pool } = require('../config/db');
const { log } = require('../utils/logger');

const startedAt = Date.now();

const counters = {
  requests: 0,
  errors: 0,
  auth_failed: 0,
  payments_failed: 0,
  uploads: 0,
  socket_errors: 0,
};

const latencies = []; // rolling window of response ms
const MAX_LATENCIES = 500;

const recordRequest = (durationMs, statusCode) => {
  counters.requests += 1;
  latencies.push(durationMs);
  if (latencies.length > MAX_LATENCIES) latencies.shift();
  if (statusCode >= 500) counters.errors += 1;
};

const bump = (key, n = 1) => {
  if (counters[key] == null) counters[key] = 0;
  counters[key] += n;
};

const avgLatency = () => {
  if (!latencies.length) return 0;
  return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
};

const processMetrics = () => {
  const mem = process.memoryUsage();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const load = os.loadavg();
  return {
    uptime_sec: Math.round(process.uptime()),
    started_at: new Date(startedAt).toISOString(),
    node_version: process.version,
    pid: process.pid,
    cpu: {
      load_1m: Number(load[0]?.toFixed?.(2) ?? load[0]),
      load_5m: Number(load[1]?.toFixed?.(2) ?? load[1]),
      cores: os.cpus()?.length || 1,
    },
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      system_used_pct: Math.round(((totalMem - freeMem) / totalMem) * 100),
      system_free_mb: Math.round(freeMem / 1024 / 1024),
      system_total_mb: Math.round(totalMem / 1024 / 1024),
    },
    disk: {
      // Platform-agnostic placeholder; detailed disk via optional probe
      note: 'Host disk monitored via backup/ops agent when available',
    },
  };
};

const httpMetrics = () => ({
  requests: counters.requests,
  errors: counters.errors,
  error_rate:
    counters.requests > 0
      ? Number(((counters.errors / counters.requests) * 100).toFixed(2))
      : 0,
  avg_response_ms: avgLatency(),
  auth_failed: counters.auth_failed,
  payments_failed: counters.payments_failed,
  uploads: counters.uploads,
  socket_errors: counters.socket_errors,
});

const checkDatabase = async () => {
  const t0 = Date.now();
  try {
    await pool.query('SELECT 1 AS ok');
    return { status: 'up', latency_ms: Date.now() - t0 };
  } catch (err) {
    return { status: 'down', latency_ms: Date.now() - t0, error: err.message };
  }
};

const checkSocket = () => {
  try {
    const { getIO } = require('../socket/emitters');
    const io = getIO();
    if (!io) return { status: 'starting', connections: 0 };
    const sockets = io.engine?.clientsCount ?? 0;
    return { status: 'up', connections: sockets };
  } catch (err) {
    return { status: 'unknown', error: err.message };
  }
};

const checkPaymentGateway = () => {
  const mock =
    String(process.env.RAZORPAY_MOCK || '').toLowerCase() === 'true' ||
    !process.env.RAZORPAY_KEY_ID;
  return {
    status: mock ? 'mock' : 'configured',
    provider: 'razorpay',
    mock,
  };
};

const checkEmail = () => {
  const provider = String(process.env.EMAIL_PROVIDER || 'mock').toLowerCase();
  return { status: provider === 'mock' ? 'mock' : 'configured', provider };
};

const checkSms = () => {
  const provider = String(process.env.SMS_PROVIDER || 'mock').toLowerCase();
  return { status: provider === 'mock' ? 'mock' : 'configured', provider };
};

const checkStorage = () => {
  try {
    const { providerInfo } = require('../services/storage');
    return { status: 'configured', ...providerInfo() };
  } catch {
    return { status: 'unknown' };
  }
};

const checkCache = () => {
  try {
    const cache = require('./cacheService');
    return { status: 'up', ...cache.getStats() };
  } catch (err) {
    return { status: 'unknown', error: err.message };
  }
};

const checkPool = () => {
  try {
    const { getPoolStats } = require('../config/db');
    return { status: 'up', ...getPoolStats() };
  } catch {
    return { status: 'unknown' };
  }
};

const businessSnapshot = async () => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM orders WHERE LOWER(status) NOT IN ('delivered','cancelled','rejected')) AS active_orders,
        (SELECT COUNT(*)::int FROM restaurants WHERE COALESCE(is_active, TRUE) = TRUE) AS online_restaurants,
        (SELECT COUNT(*)::int FROM delivery_partners WHERE COALESCE(is_available, FALSE) = TRUE
          AND COALESCE(approval_status,'approved') = 'approved') AS online_delivery_partners,
        (SELECT COALESCE(SUM(total_amount),0)::float FROM orders
          WHERE created_at::date = CURRENT_DATE
            AND LOWER(status) NOT IN ('cancelled','rejected')) AS live_revenue_today,
        (SELECT COUNT(*)::int FROM users WHERE created_at > NOW() - INTERVAL '15 minutes') AS recent_signups
    `);
    return rows[0];
  } catch (err) {
    return { error: err.message };
  }
};

const getHealthBundle = async () => {
  const [database, business] = await Promise.all([
    checkDatabase(),
    businessSnapshot(),
  ]);
  return {
    status:
      database.status === 'up' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    process: processMetrics(),
    http: httpMetrics(),
    services: {
      database,
      socket: checkSocket(),
      payment: checkPaymentGateway(),
      email: checkEmail(),
      sms: checkSms(),
      storage: checkStorage(),
      cache: checkCache(),
      db_pool: checkPool(),
    },
    business,
  };
};

const persistSnapshot = async () => {
  try {
    const bundle = await getHealthBundle();
    await pool.query(
      `INSERT INTO system_metrics (payload, cpu_load, memory_used_mb, error_rate, avg_response_ms)
       VALUES ($1::jsonb, $2, $3, $4, $5)`,
      [
        JSON.stringify(bundle),
        bundle.process?.cpu?.load_1m || 0,
        bundle.process?.memory?.heap_used_mb || 0,
        bundle.http?.error_rate || 0,
        bundle.http?.avg_response_ms || 0,
      ]
    );
    return bundle;
  } catch (err) {
    log.warn('metrics snapshot failed', { error: err.message });
    return null;
  }
};

let metricsTimer = null;
const startMetricsLoop = () => {
  if (metricsTimer) return;
  const ms = Number(process.env.METRICS_INTERVAL_MS || 60000);
  metricsTimer = setInterval(() => {
    persistSnapshot().catch(() => {});
  }, ms);
  if (metricsTimer.unref) metricsTimer.unref();
};

module.exports = {
  recordRequest,
  bump,
  counters,
  processMetrics,
  httpMetrics,
  getHealthBundle,
  persistSnapshot,
  startMetricsLoop,
  checkDatabase,
};
