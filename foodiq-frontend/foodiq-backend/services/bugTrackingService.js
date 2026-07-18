/**
 * Production bug / crash tracking: fingerprinting, duplicate merge, UA parse, weekly reports.
 */
const crypto = require('crypto');
const {
  createBug,
  findOpenByFingerprint,
  incrementOccurrence,
  listBugs,
  countBugsByStatus,
  weeklyBugStats,
} = require('../models/bugReportModel');

const normalizeMessage = (msg) =>
  String(msg || '')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b\d{4,}\b/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500)
    .toLowerCase();

const buildFingerprint = ({ message, api_endpoint, page_url, source }) => {
  const key = [
    normalizeMessage(message),
    String(api_endpoint || page_url || '').split('?')[0].toLowerCase().slice(0, 200),
    String(source || 'app'),
  ].join('|');
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 64);
};

const parseBrowser = (ua) => {
  if (!ua) return null;
  const s = String(ua);
  if (/Edg\//i.test(s)) return 'Edge';
  if (/OPR\/|Opera/i.test(s)) return 'Opera';
  if (/Chrome\//i.test(s) && !/Edg\//i.test(s)) return 'Chrome';
  if (/Firefox\//i.test(s)) return 'Firefox';
  if (/Safari\//i.test(s) && !/Chrome\//i.test(s)) return 'Safari';
  return 'Other';
};

const parseDevice = (ua) => {
  if (!ua) return null;
  const s = String(ua);
  if (/iPad|Tablet|PlayBook/i.test(s)) return 'Tablet';
  if (/Mobile|Android|iPhone|iPod|webOS|BlackBerry|IEMobile/i.test(s)) return 'Mobile';
  return 'Desktop';
};

const severityFromStatusCode = (code) => {
  const n = Number(code);
  if (n >= 500) return 'critical';
  if (n >= 400) return 'medium';
  return 'high';
};

/**
 * Create a crash/bug report or merge into an existing open duplicate.
 */
const createOrMergeBug = async (data) => {
  const fingerprint =
    data.fingerprint ||
    buildFingerprint({
      message: data.title || data.message || data.description,
      api_endpoint: data.api_endpoint,
      page_url: data.page_url,
      source: data.source || 'manual',
    });

  const existing = await findOpenByFingerprint(fingerprint);
  if (existing) {
    const merged = await incrementOccurrence(existing.id, {
      stack_trace: data.stack_trace,
      error_event_id: data.error_event_id,
      user_agent: data.user_agent,
      browser: data.browser,
      device: data.device,
    });
    return { ...merged, _duplicate: true, duplicate_of_id: existing.id };
  }

  const row = await createBug({
    ...data,
    fingerprint,
    browser: data.browser || parseBrowser(data.user_agent),
    device: data.device || parseDevice(data.user_agent),
  });
  return { ...row, _duplicate: false };
};

/**
 * Auto-ingest significant production errors into bug_reports (with dedupe).
 */
const ingestCrashFromError = async ({
  errorEventId,
  source,
  type,
  message,
  stack,
  statusCode,
  path,
  method,
  userId,
  userAgent,
  meta = {},
}) => {
  const code = Number(statusCode);
  const isFrontend = source === 'frontend';
  const isServerCrash = !Number.isNaN(code) && code >= 500;
  const isUnhandled = !statusCode && (type === 'exception' || isFrontend);
  if (!isFrontend && !isServerCrash && !isUnhandled) return null;

  const apiEndpoint =
    meta.api_path ||
    (method && path ? `${method} ${String(path).split('?')[0]}` : path) ||
    null;
  const ua = userAgent || meta.user_agent || null;

  return createOrMergeBug({
    reporter_id: userId || null,
    title: String(message || 'Production error').slice(0, 255),
    description: [
      message,
      apiEndpoint ? `Endpoint: ${apiEndpoint}` : null,
      path && !apiEndpoint ? `Path: ${path}` : null,
      stack ? `\nStack:\n${String(stack).slice(0, 6000)}` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    severity: isFrontend
      ? meta.level === 'warn'
        ? 'low'
        : 'high'
      : severityFromStatusCode(code),
    page_url: isFrontend ? path : null,
    api_endpoint: apiEndpoint ? String(apiEndpoint).slice(0, 500) : null,
    stack_trace: stack ? String(stack).slice(0, 8000) : null,
    user_agent: ua ? String(ua).slice(0, 500) : null,
    browser: meta.browser || parseBrowser(ua),
    device: meta.device || parseDevice(ua),
    error_event_id: errorEventId || null,
    source: source || 'backend',
  });
};

const generateWeeklyBugReport = async ({ persist = false, createdBy = null } = {}) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const stats = await weeklyBugStats(start, end);
  const openCritical = await listBugs({
    status: 'open',
    severity: 'critical',
    limit: 20,
    offset: 0,
    includeDuplicates: false,
  });

  const report = {
    period: 'weekly',
    period_start: start.toISOString().slice(0, 10),
    period_end: end.toISOString().slice(0, 10),
    generated_at: new Date().toISOString(),
    summary: stats.summary,
    by_status: stats.by_status,
    by_severity: stats.by_severity,
    top_duplicates: stats.top_duplicates,
    open_critical: openCritical.rows,
    counts: await countBugsByStatus(),
  };

  if (persist) {
    const { pool } = require('../config/db');
    const { rows } = await pool.query(
      `INSERT INTO maintenance_reports (period, period_start, period_end, payload, created_by)
       VALUES ('weekly', $1::date, $2::date, $3::jsonb, $4)
       RETURNING id, created_at`,
      [
        report.period_start,
        report.period_end,
        JSON.stringify({ type: 'bug_weekly', ...report }),
        createdBy || null,
      ]
    );
    report.persisted_id = rows[0]?.id || null;
  }

  return report;
};

/** Map UI filter presets to listBugs args */
const resolveFilterPreset = (preset) => {
  const p = String(preset || '').toLowerCase();
  switch (p) {
    case 'open':
      return { status: 'open' };
    case 'in_progress':
      return { status: 'in_progress' };
    case 'fixed':
      return { status: 'resolved' };
    case 'critical':
      return { severity: 'critical' };
    case 'low_priority':
    case 'low':
      return { severity: 'low' };
    default:
      return {};
  }
};

module.exports = {
  buildFingerprint,
  parseBrowser,
  parseDevice,
  createOrMergeBug,
  ingestCrashFromError,
  generateWeeklyBugReport,
  resolveFilterPreset,
};
