/**
 * Security / ops alerts for admins.
 */
const { pool } = require('../config/db');
const { log } = require('../utils/logger');
const { counters } = require('./metricsService');

const createAlert = async ({
  severity = 'warning',
  type,
  title,
  message,
  meta = {},
}) => {
  if (!type || !title) return null;
  try {
    // Dedupe same alert type within 10 minutes
    const recent = await pool.query(
      `SELECT id FROM security_alerts
       WHERE type = $1 AND created_at > NOW() - INTERVAL '10 minutes'
       ORDER BY created_at DESC LIMIT 1`,
      [type]
    );
    if (recent.rows[0]) return recent.rows[0];

    const { rows } = await pool.query(
      `INSERT INTO security_alerts (severity, type, title, message, meta)
       VALUES ($1,$2,$3,$4,$5::jsonb)
       RETURNING *`,
      [severity, type, title, message || '', JSON.stringify(meta)]
    );

    log.warn(`ALERT: ${title}`, { type, severity, message });

    try {
      const { notifyAdmins } = require('./notificationService');
      await notifyAdmins({
        type: 'security_alert',
        title: `[${severity}] ${title}`,
        message: message || title,
        link: '/admin/monitoring',
        dedupeKey: `alert:${type}:${new Date().toISOString().slice(0, 13)}`,
      });
    } catch {
      /* ignore */
    }

    return rows[0];
  } catch (err) {
    log.warn('createAlert failed', { error: err.message });
    return null;
  }
};

const evaluateHealthAlerts = async (bundle) => {
  if (!bundle) return;
  if (bundle.services?.database?.status === 'down') {
    await createAlert({
      severity: 'critical',
      type: 'database_failure',
      title: 'Database failure',
      message: bundle.services.database.error || 'PostgreSQL health check failed',
    });
  }
  const cpu = bundle.process?.cpu?.load_1m || 0;
  const cores = bundle.process?.cpu?.cores || 1;
  if (cpu > cores * 0.9) {
    await createAlert({
      severity: 'warning',
      type: 'high_cpu',
      title: 'High CPU load',
      message: `1m load average ${cpu} on ${cores} cores`,
      meta: { cpu, cores },
    });
  }
  const memPct = bundle.process?.memory?.system_used_pct || 0;
  if (memPct >= 92) {
    await createAlert({
      severity: 'warning',
      type: 'high_memory',
      title: 'High memory usage',
      message: `System memory ${memPct}% used`,
    });
  }
  if (counters.auth_failed >= Number(process.env.ALERT_FAILED_LOGIN_THRESHOLD || 20)) {
    await createAlert({
      severity: 'warning',
      type: 'failed_logins',
      title: 'Elevated failed logins',
      message: `${counters.auth_failed} failed login attempts since process start`,
    });
  }
  if (counters.payments_failed >= Number(process.env.ALERT_PAYMENT_FAIL_THRESHOLD || 10)) {
    await createAlert({
      severity: 'critical',
      type: 'payment_failures',
      title: 'Multiple payment failures',
      message: `${counters.payments_failed} payment failures recorded`,
    });
  }
};

const listAlerts = async ({ status = '', limit = 50 } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM security_alerts
     WHERE ($1 = '' OR status = $1)
     ORDER BY created_at DESC
     LIMIT $2`,
    [status, Math.min(Number(limit) || 50, 200)]
  );
  return rows;
};

const acknowledgeAlert = async (id, userId) => {
  const { rows } = await pool.query(
    `UPDATE security_alerts SET
       status = 'acknowledged',
       acknowledged_by = $1,
       acknowledged_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [userId, id]
  );
  return rows[0] || null;
};

module.exports = {
  createAlert,
  evaluateHealthAlerts,
  listAlerts,
  acknowledgeAlert,
};
