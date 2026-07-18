const { ok, fail } = require('../utils/respond');
const {
  createBug,
  getBugById,
  listBugs,
  updateBug,
} = require('../models/bugReportModel');

const sanitizeText = (s, max = 4000) =>
  String(s || '')
    .trim()
    .slice(0, max);

const submitBug = async (req, res) => {
  try {
    const title = sanitizeText(req.body.title, 255);
    const description = sanitizeText(req.body.description, 8000);
    if (!title || !description) {
      return fail(res, 400, 'title and description are required');
    }
    const row = await createBug({
      reporter_id: req.user?.id || null,
      title,
      description,
      severity: req.body.severity || 'medium',
      page_url: sanitizeText(req.body.page_url, 500) || null,
      user_agent: sanitizeText(req.get('user-agent'), 500) || null,
      error_event_id: req.body.error_event_id || null,
    });
    return ok(res, 'Bug report submitted', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminListBugs = async (req, res) => {
  try {
    const rows = await listBugs({
      status: req.query.status || null,
      severity: req.query.severity || null,
      limit: req.query.limit,
      offset: req.query.offset,
    });
    return ok(res, 'Bugs', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminGetBug = async (req, res) => {
  try {
    const row = await getBugById(req.params.id);
    if (!row) return fail(res, 404, 'Bug not found');
    return ok(res, 'Bug', row);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPatchBug = async (req, res) => {
  try {
    const updated = await updateBug(req.params.id, {
      status: req.body.status,
      severity: req.body.severity,
      assignee_id: req.body.assignee_id,
      admin_notes: req.body.admin_notes,
      title: req.body.title,
      description: req.body.description,
      error_event_id: req.body.error_event_id,
    });
    if (!updated) return fail(res, 404, 'Bug not found');
    return ok(res, 'Bug updated', updated);
  } catch (err) {
    return fail(res, err.status || 500, err.message || 'Server Error', err);
  }
};

const adminCreateBugFromError = async (req, res) => {
  try {
    const errorEventId = req.body.error_event_id || req.params.errorId;
    if (!errorEventId) return fail(res, 400, 'error_event_id is required');
    const { pool } = require('../config/db');
    const { rows } = await pool.query(
      `SELECT * FROM error_events WHERE id = $1`,
      [errorEventId]
    );
    const ev = rows[0];
    if (!ev) return fail(res, 404, 'Error event not found');
    const row = await createBug({
      reporter_id: req.user.id,
      title: sanitizeText(ev.message, 255) || 'Production error',
      description: [
        ev.message,
        ev.path ? `Path: ${ev.method || ''} ${ev.path}` : null,
        ev.stack ? `\nStack:\n${ev.stack}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      severity: Number(ev.status_code) >= 500 ? 'high' : 'medium',
      page_url: ev.path || null,
      user_agent: null,
      error_event_id: ev.id,
    });
    return ok(res, 'Bug created from error', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  submitBug,
  adminListBugs,
  adminGetBug,
  adminPatchBug,
  adminCreateBugFromError,
};
