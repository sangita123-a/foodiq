/**
 * Admin monitoring APIs: health, metrics, audits, errors, alerts, logs, backups.
 */
const { getHealthBundle, persistSnapshot, startMetricsLoop } = require('../services/metricsService');
const { evaluateHealthAlerts, listAlerts, acknowledgeAlert, createAlert } = require('../services/alertService');
const { listAudits, writeAudit } = require('../services/auditService');
const { listErrors, trackError } = require('../services/errorTracker');
const { listLogFiles, readLogTail, LOG_DIR } = require('../utils/logger');
const { recordBackup, listBackups, backupHealth } = require('../services/backupService');
const path = require('path');
const fs = require('fs');

const ok = (res, message, data = {}) =>
  res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({
    success: false,
    message,
    error: typeof error === 'string' ? { detail: error } : error,
  });

const getPublicHealth = async (_req, res) => {
  try {
    const bundle = await getHealthBundle();
    // Public endpoint — omit sensitive internals
    return res.status(bundle.status === 'healthy' ? 200 : 503).json({
      status: bundle.status === 'healthy' ? 'success' : 'degraded',
      message: 'API health',
      realtime: bundle.services?.socket?.status === 'up',
      database: bundle.services?.database?.status,
      uptime_sec: bundle.process?.uptime_sec,
      timestamp: bundle.timestamp,
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      message: error.message,
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const bundle = await getHealthBundle();
    await evaluateHealthAlerts(bundle);
    const [alerts, backups, recentErrors, recentAudits] = await Promise.all([
      listAlerts({ limit: 20 }),
      backupHealth(),
      listErrors({ limit: 15 }),
      listAudits({ limit: 15 }),
    ]);
    return ok(res, 'Monitoring dashboard', {
      ...bundle,
      alerts,
      backups,
      recent_errors: recentErrors,
      recent_audits: recentAudits,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getMetrics = async (_req, res) => {
  try {
    const bundle = await getHealthBundle();
    return ok(res, 'Metrics', bundle);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const postSnapshot = async (_req, res) => {
  try {
    const snap = await persistSnapshot();
    return ok(res, 'Snapshot stored', snap);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getAudits = async (req, res) => {
  try {
    const rows = await listAudits({
      q: req.query.q || '',
      category: req.query.category || '',
      action: req.query.action || '',
      userId: req.query.user_id || '',
      role: req.query.role || '',
      from: req.query.from || '',
      to: req.query.to || '',
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, 'Audit logs', rows);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const exportAudits = async (req, res) => {
  try {
    const rows = await listAudits({
      q: req.query.q || '',
      category: req.query.category || '',
      limit: Math.min(Number(req.query.limit) || 1000, 5000),
    });
    const header =
      'id,created_at,user_email,role,action,category,status,ip_address,device,browser,message\n';
    const csv =
      header +
      rows
        .map((r) =>
          [
            r.id,
            r.created_at,
            r.user_email || '',
            r.role || '',
            r.action,
            r.category,
            r.status,
            r.ip_address || '',
            r.device || '',
            r.browser || '',
            JSON.stringify(r.message || ''),
          ].join(',')
        )
        .join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="foodiq-audit-export.csv"');
    return res.send(csv);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getErrors = async (req, res) => {
  try {
    const rows = await listErrors({
      source: req.query.source || '',
      type: req.query.type || '',
      q: req.query.q || '',
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, 'Error events', rows);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

/** Public-ish client error reporter (authenticated optional) */
const postClientError = async (req, res) => {
  try {
    const { message, stack, path: pagePath, meta } = req.body || {};
    await trackError({
      source: 'frontend',
      type: 'exception',
      message: message || 'Frontend error',
      stack,
      path: pagePath || req.headers.referer || null,
      method: 'CLIENT',
      userId: req.user?.id || null,
      requestId: req.requestId,
      meta: meta || {},
    });
    return ok(res, 'Error recorded');
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getAlertsHandler = async (req, res) => {
  try {
    return ok(res, 'Alerts', await listAlerts({ status: req.query.status || '', limit: req.query.limit }));
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const ackAlert = async (req, res) => {
  try {
    const row = await acknowledgeAlert(req.params.id, req.user.id);
    if (!row) return fail(res, 404, 'Alert not found');
    await writeAudit({
      userId: req.user.id,
      role: 'admin',
      action: 'alert_acknowledged',
      category: 'security',
      resourceId: req.params.id,
      req,
    });
    return ok(res, 'Alert acknowledged', row);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getLogFiles = async (_req, res) => {
  try {
    return ok(res, 'Log files', listLogFiles());
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getLogContent = async (req, res) => {
  try {
    const name = req.params.name || req.query.file;
    if (!name) return fail(res, 400, 'file name required');
    const rows = readLogTail(name, {
      lines: req.query.lines || 200,
      q: req.query.q || '',
    });
    return ok(res, 'Log content', rows);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const exportLogFile = async (req, res) => {
  try {
    const safe = path.basename(req.params.name);
    const full = path.join(LOG_DIR, safe);
    if (!fs.existsSync(full)) return fail(res, 404, 'Log file not found');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${safe}"`);
    return fs.createReadStream(full).pipe(res);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getBackups = async (_req, res) => {
  try {
    return ok(res, 'Backups', {
      runs: await listBackups({ limit: 50 }),
      health: await backupHealth(),
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const postBackup = async (req, res) => {
  try {
    const row = await recordBackup(req.body || {});
    await writeAudit({
      userId: req.user.id,
      role: 'admin',
      action: 'backup_recorded',
      category: 'ops',
      meta: req.body,
      req,
    });
    return ok(res, 'Backup recorded', row);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const postTestAlert = async (req, res) => {
  try {
    const row = await createAlert({
      severity: req.body.severity || 'info',
      type: req.body.type || 'manual_test',
      title: req.body.title || 'Test alert',
      message: req.body.message || 'Manual test from monitoring dashboard',
    });
    return ok(res, 'Alert created', row);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

// kick metrics loop when controller loads under server
startMetricsLoop();

module.exports = {
  getPublicHealth,
  getDashboard,
  getMetrics,
  postSnapshot,
  getAudits,
  exportAudits,
  getErrors,
  postClientError,
  getAlertsHandler,
  ackAlert,
  getLogFiles,
  getLogContent,
  exportLogFile,
  getBackups,
  postBackup,
  postTestAlert,
};
