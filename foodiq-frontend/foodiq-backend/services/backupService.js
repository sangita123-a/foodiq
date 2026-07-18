/**
 * Database / upload backup run tracking (ops can push results via API or cron).
 */
const { pool } = require('../config/db');
const { log } = require('../utils/logger');
const { createAlert } = require('./alertService');

const recordBackup = async ({
  type = 'database',
  status = 'success',
  location = null,
  sizeBytes = null,
  message = null,
  meta = {},
}) => {
  const { rows } = await pool.query(
    `INSERT INTO backup_runs (type, status, location, size_bytes, message, meta)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb)
     RETURNING *`,
    [type, status, location, sizeBytes, message, JSON.stringify(meta)]
  );

  if (status === 'failed') {
    await createAlert({
      severity: 'critical',
      type: 'backup_failure',
      title: `${type} backup failed`,
      message: message || 'Backup job reported failure',
      meta: { backup_id: rows[0]?.id },
    });
  }

  log.info('backup recorded', { type, status, location });
  return rows[0];
};

const listBackups = async ({ limit = 50 } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM backup_runs ORDER BY created_at DESC LIMIT $1`,
    [Math.min(Number(limit) || 50, 200)]
  );
  return rows;
};

const backupHealth = async () => {
  const { rows } = await pool.query(
    `SELECT type,
            MAX(created_at) AS last_run,
            (ARRAY_AGG(status ORDER BY created_at DESC))[1] AS last_status
     FROM backup_runs
     GROUP BY type`
  );
  const staleHours = Number(process.env.BACKUP_STALE_HOURS || 36);
  const now = Date.now();
  return rows.map((r) => {
    const ageH = r.last_run ? (now - new Date(r.last_run).getTime()) / 36e5 : null;
    return {
      ...r,
      stale: ageH == null || ageH > staleHours || r.last_status === 'failed',
    };
  });
};

module.exports = {
  recordBackup,
  listBackups,
  backupHealth,
};
