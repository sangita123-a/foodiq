const { pool } = require('../config/db');

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'triaging', 'in_progress', 'resolved', 'wont_fix'];

const createBug = async (data) => {
  const {
    reporter_id,
    title,
    description,
    severity = 'medium',
    page_url,
    user_agent,
    error_event_id,
  } = data;
  const sev = SEVERITIES.includes(severity) ? severity : 'medium';
  const { rows } = await pool.query(
    `INSERT INTO bug_reports (
       reporter_id, title, description, severity, page_url, user_agent, error_event_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      reporter_id || null,
      title,
      description,
      sev,
      page_url || null,
      user_agent || null,
      error_event_id || null,
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

const listBugs = async ({ status, severity, limit = 50, offset = 0 } = {}) => {
  const values = [];
  let where = 'WHERE 1=1';
  if (status) {
    values.push(status);
    where += ` AND b.status = $${values.length}`;
  }
  if (severity) {
    values.push(severity);
    where += ` AND b.severity = $${values.length}`;
  }
  values.push(Math.min(Number(limit) || 50, 100));
  values.push(Number(offset) || 0);
  const { rows } = await pool.query(
    `SELECT b.*,
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
       b.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  return rows;
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
  if (status && !STATUSES.includes(status)) {
    const err = new Error('Invalid bug status');
    err.status = 400;
    throw err;
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
      status || null,
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
  listBugs,
  updateBug,
  SEVERITIES,
  STATUSES,
};
