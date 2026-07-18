const { pool } = require('../config/db');

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'triaging', 'in_progress', 'resolved', 'wont_fix'];

/** Accept UI alias "fixed" → resolved */
const normalizeStatus = (status) => {
  if (!status) return null;
  const s = String(status).toLowerCase();
  if (s === 'fixed') return 'resolved';
  return STATUSES.includes(s) ? s : null;
};

const createBug = async (data) => {
  const {
    reporter_id,
    title,
    description,
    severity = 'medium',
    page_url,
    user_agent,
    error_event_id,
    stack_trace,
    api_endpoint,
    browser,
    device,
    fingerprint,
    duplicate_of_id,
  } = data;
  const sev = SEVERITIES.includes(severity) ? severity : 'medium';
  const { rows } = await pool.query(
    `INSERT INTO bug_reports (
       reporter_id, title, description, severity, page_url, user_agent, error_event_id,
       stack_trace, api_endpoint, browser, device, fingerprint, duplicate_of_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      reporter_id || null,
      title,
      description,
      sev,
      page_url || null,
      user_agent || null,
      error_event_id || null,
      stack_trace || null,
      api_endpoint || null,
      browser || null,
      device || null,
      fingerprint || null,
      duplicate_of_id || null,
    ]
  );
  return rows[0];
};

const getBugById = async (id) => {
  const { rows } = await pool.query(
    `SELECT b.*,
            u.full_name AS reporter_name, u.email AS reporter_email,
            a.full_name AS assignee_name
     FROM bug_reports b
     LEFT JOIN users u ON u.id = b.reporter_id
     LEFT JOIN users a ON a.id = b.assignee_id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
};

const findOpenByFingerprint = async (fingerprint) => {
  if (!fingerprint) return null;
  const { rows } = await pool.query(
    `SELECT * FROM bug_reports
     WHERE fingerprint = $1
       AND duplicate_of_id IS NULL
       AND status IN ('open', 'triaging', 'in_progress')
     ORDER BY created_at ASC
     LIMIT 1`,
    [fingerprint]
  );
  return rows[0] || null;
};

const incrementOccurrence = async (id, extras = {}) => {
  const { rows } = await pool.query(
    `UPDATE bug_reports
     SET occurrence_count = COALESCE(occurrence_count, 1) + 1,
         stack_trace = COALESCE($2, stack_trace),
         error_event_id = COALESCE($3, error_event_id),
         user_agent = COALESCE($4, user_agent),
         browser = COALESCE($5, browser),
         device = COALESCE($6, device),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      extras.stack_trace || null,
      extras.error_event_id || null,
      extras.user_agent || null,
      extras.browser || null,
      extras.device || null,
    ]
  );
  return rows[0];
};

const listBugs = async ({
  status,
  severity,
  filter,
  limit = 50,
  offset = 0,
  includeDuplicates = false,
  q = '',
} = {}) => {
  const values = [];
  let where = 'WHERE 1=1';

  if (!includeDuplicates) {
    where += ' AND b.duplicate_of_id IS NULL';
  }

  const resolvedStatus = normalizeStatus(status);
  if (resolvedStatus) {
    values.push(resolvedStatus);
    where += ` AND b.status = $${values.length}`;
  }
  if (severity && SEVERITIES.includes(severity)) {
    values.push(severity);
    where += ` AND b.severity = $${values.length}`;
  }

  // Preset filter chips (Open / In Progress / Fixed / Critical / Low Priority)
  const preset = String(filter || '').toLowerCase();
  if (preset === 'open') {
    where += ` AND b.status = 'open'`;
  } else if (preset === 'in_progress') {
    where += ` AND b.status = 'in_progress'`;
  } else if (preset === 'fixed') {
    where += ` AND b.status = 'resolved'`;
  } else if (preset === 'critical') {
    where += ` AND b.severity = 'critical'`;
  } else if (preset === 'low_priority' || preset === 'low') {
    where += ` AND b.severity = 'low'`;
  }

  if (q && String(q).trim()) {
    values.push(`%${String(q).trim()}%`);
    where += ` AND (b.title ILIKE $${values.length} OR b.description ILIKE $${values.length} OR b.api_endpoint ILIKE $${values.length})`;
  }

  const lim = Math.min(Number(limit) || 50, 200);
  const off = Number(offset) || 0;
  values.push(lim, off);

  const countSql = `SELECT COUNT(*)::int AS total FROM bug_reports b ${where}`;
  const listSql = `
     SELECT b.*,
            u.full_name AS reporter_name, u.email AS reporter_email,
            a.full_name AS assignee_name
     FROM bug_reports b
     LEFT JOIN users u ON u.id = b.reporter_id
     LEFT JOIN users a ON a.id = b.assignee_id
     ${where}
     ORDER BY
       CASE b.severity
         WHEN 'critical' THEN 0
         WHEN 'high' THEN 1
         WHEN 'medium' THEN 2
         ELSE 3
       END,
       b.occurrence_count DESC NULLS LAST,
       b.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`;

  const [countRes, listRes] = await Promise.all([
    pool.query(countSql, values.slice(0, -2)),
    pool.query(listSql, values),
  ]);

  return {
    rows: listRes.rows,
    total: countRes.rows[0]?.total || 0,
  };
};

const countBugsByStatus = async () => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE duplicate_of_id IS NULL AND status = 'open')::int AS open,
       COUNT(*) FILTER (WHERE duplicate_of_id IS NULL AND status = 'in_progress')::int AS in_progress,
       COUNT(*) FILTER (WHERE duplicate_of_id IS NULL AND status = 'resolved')::int AS fixed,
       COUNT(*) FILTER (WHERE duplicate_of_id IS NULL AND severity = 'critical' AND status NOT IN ('resolved','wont_fix'))::int AS critical,
       COUNT(*) FILTER (WHERE duplicate_of_id IS NULL AND severity = 'low' AND status NOT IN ('resolved','wont_fix'))::int AS low_priority,
       COUNT(*) FILTER (WHERE duplicate_of_id IS NULL)::int AS total
     FROM bug_reports`
  );
  return rows[0];
};

const weeklyBugStats = async (start, end) => {
  const { rows: summaryRows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE created_at >= $1 AND created_at < $2)::int AS created,
       COUNT(*) FILTER (WHERE status = 'resolved' AND updated_at >= $1 AND updated_at < $2)::int AS fixed,
       COUNT(*) FILTER (WHERE status IN ('open','triaging','in_progress'))::int AS still_open,
       COALESCE(SUM(occurrence_count) FILTER (WHERE created_at >= $1 AND created_at < $2), 0)::int AS occurrences
     FROM bug_reports
     WHERE duplicate_of_id IS NULL`,
    [start, end]
  );

  const { rows: byStatus } = await pool.query(
    `SELECT status, COUNT(*)::int AS count
     FROM bug_reports
     WHERE duplicate_of_id IS NULL AND created_at >= $1 AND created_at < $2
     GROUP BY status
     ORDER BY count DESC`,
    [start, end]
  );

  const { rows: bySeverity } = await pool.query(
    `SELECT severity, COUNT(*)::int AS count
     FROM bug_reports
     WHERE duplicate_of_id IS NULL AND created_at >= $1 AND created_at < $2
     GROUP BY severity
     ORDER BY count DESC`,
    [start, end]
  );

  const { rows: topDuplicates } = await pool.query(
    `SELECT id, title, severity, status, occurrence_count, api_endpoint, browser, created_at
     FROM bug_reports
     WHERE duplicate_of_id IS NULL AND occurrence_count > 1
       AND created_at >= $1 AND created_at < $2
     ORDER BY occurrence_count DESC
     LIMIT 10`,
    [start, end]
  );

  return {
    summary: summaryRows[0],
    by_status: byStatus,
    by_severity: bySeverity,
    top_duplicates: topDuplicates,
  };
};

const updateBug = async (id, patch) => {
  const {
    status,
    severity,
    assignee_id,
    admin_notes,
    title,
    description,
    error_event_id,
  } = patch;

  let resolvedStatus = status;
  if (status) {
    resolvedStatus = normalizeStatus(status);
    if (!resolvedStatus) {
      const err = new Error('Invalid bug status');
      err.status = 400;
      throw err;
    }
  }
  if (severity && !SEVERITIES.includes(severity)) {
    const err = new Error('Invalid severity');
    err.status = 400;
    throw err;
  }
  const { rows } = await pool.query(
    `UPDATE bug_reports
     SET status = COALESCE($1, status),
         severity = COALESCE($2, severity),
         assignee_id = COALESCE($3, assignee_id),
         admin_notes = COALESCE($4, admin_notes),
         title = COALESCE($5, title),
         description = COALESCE($6, description),
         error_event_id = COALESCE($7, error_event_id),
         updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      resolvedStatus || null,
      severity || null,
      assignee_id ?? null,
      admin_notes ?? null,
      title || null,
      description || null,
      error_event_id ?? null,
      id,
    ]
  );
  return rows[0];
};

module.exports = {
  createBug,
  getBugById,
  findOpenByFingerprint,
  incrementOccurrence,
  listBugs,
  countBugsByStatus,
  weeklyBugStats,
  updateBug,
  normalizeStatus,
  SEVERITIES,
  STATUSES,
};
