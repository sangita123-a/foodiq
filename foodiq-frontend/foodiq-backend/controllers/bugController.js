const { ok, fail } = require('../utils/respond');
const {
  getBugById,
  listBugs,
  updateBug,
  countBugsByStatus,
  SEVERITIES,
  STATUSES,
  normalizeStatus,
} = require('../models/bugReportModel');
const {
  createOrMergeBug,
  parseBrowser,
  parseDevice,
  generateWeeklyBugReport,
  ingestCrashFromError,
} = require('../services/bugTrackingService');

const sanitizeText = (s, max = 4000) =>
  String(s || '')
    .trim()
    .slice(0, max);

const isUuid = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(v || '')
  );

/**
 * Validate bug report payload. Returns { error } or { data }.
 */
const validateBugPayload = (body, { requireTitle = true } = {}) => {
  const title = sanitizeText(body.title || body.message, 255);
  const description = sanitizeText(body.description || body.message, 8000);
  if (requireTitle && !title) {
    return { error: 'title is required (max 255 chars)' };
  }
  if (!description && !title) {
    return { error: 'description or message is required' };
  }
  if (body.severity && !SEVERITIES.includes(String(body.severity))) {
    return { error: `severity must be one of: ${SEVERITIES.join(', ')}` };
  }
  if (body.error_event_id && !isUuid(body.error_event_id)) {
    return { error: 'error_event_id must be a valid UUID' };
  }
  if (body.reporter_id && !isUuid(body.reporter_id)) {
    return { error: 'invalid reporter_id' };
  }
  return {
    data: {
      title: title || sanitizeText(description, 255) || 'Untitled bug',
      description: description || title,
      severity: body.severity || 'medium',
      page_url: sanitizeText(body.page_url, 500) || null,
      api_endpoint: sanitizeText(body.api_endpoint || body.endpoint, 500) || null,
      stack_trace: sanitizeText(body.stack_trace || body.stack, 8000) || null,
      browser: sanitizeText(body.browser, 120) || null,
      device: sanitizeText(body.device, 120) || null,
      error_event_id: body.error_event_id || null,
    },
  };
};

const submitBug = async (req, res) => {
  try {
    const validated = validateBugPayload(req.body, { requireTitle: true });
    if (validated.error) return fail(res, 400, validated.error);

    const ua = sanitizeText(req.get('user-agent'), 500) || null;
    const row = await createOrMergeBug({
      ...validated.data,
      reporter_id: req.user?.id || null,
      user_agent: ua,
      browser: validated.data.browser || parseBrowser(ua),
      device: validated.data.device || parseDevice(ua),
      source: 'user_report',
    });

    const status = row._duplicate ? 200 : 201;
    const msg = row._duplicate
      ? 'Duplicate bug detected — occurrence count updated'
      : 'Bug report submitted';
    return ok(res, msg, row, status);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminListBugs = async (req, res) => {
  try {
    const result = await listBugs({
      status: req.query.status || null,
      severity: req.query.severity || null,
      filter: req.query.filter || null,
      q: req.query.q || '',
      limit: req.query.limit,
      offset: req.query.offset,
      includeDuplicates: req.query.include_duplicates === '1',
    });
    const counts = await countBugsByStatus();
    return ok(res, 'Bugs', {
      rows: result.rows,
      total: result.total,
      counts,
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminGetBug = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return fail(res, 400, 'Invalid bug id');
    const row = await getBugById(req.params.id);
    if (!row) return fail(res, 404, 'Bug not found');
    return ok(res, 'Bug', row);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminPatchBug = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return fail(res, 400, 'Invalid bug id');
    if (req.body.status != null && !normalizeStatus(req.body.status)) {
      return fail(
        res,
        400,
        `status must be one of: ${STATUSES.join(', ')}, fixed`
      );
    }
    if (req.body.severity != null && !SEVERITIES.includes(req.body.severity)) {
      return fail(res, 400, `severity must be one of: ${SEVERITIES.join(', ')}`);
    }
    if (req.body.assignee_id != null && req.body.assignee_id !== '' && !isUuid(req.body.assignee_id)) {
      return fail(res, 400, 'assignee_id must be a valid UUID');
    }

    const updated = await updateBug(req.params.id, {
      status: req.body.status,
      severity: req.body.severity,
      assignee_id: req.body.assignee_id === '' ? null : req.body.assignee_id,
      admin_notes:
        req.body.admin_notes != null
          ? sanitizeText(req.body.admin_notes, 8000)
          : undefined,
      title: req.body.title != null ? sanitizeText(req.body.title, 255) : undefined,
      description:
        req.body.description != null
          ? sanitizeText(req.body.description, 8000)
          : undefined,
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
    if (!errorEventId || !isUuid(errorEventId)) {
      return fail(res, 400, 'error_event_id is required (UUID)');
    }
    const { pool } = require('../config/db');
    const { rows } = await pool.query(
      `SELECT * FROM error_events WHERE id = $1`,
      [errorEventId]
    );
    const ev = rows[0];
    if (!ev) return fail(res, 404, 'Error event not found');

    const row = await ingestCrashFromError({
      errorEventId: ev.id,
      source: ev.source,
      type: ev.type,
      message: ev.message,
      stack: ev.stack,
      statusCode: ev.status_code,
      path: ev.path,
      method: ev.method,
      userId: ev.user_id || req.user.id,
      userAgent: ev.meta?.user_agent || null,
      meta: typeof ev.meta === 'object' ? ev.meta : {},
    });

    // Force create even for 4xx if admin explicitly linked
    if (!row) {
      const forced = await createOrMergeBug({
        reporter_id: req.user.id,
        title: sanitizeText(ev.message, 255) || 'Production error',
        description: [
          ev.message,
          ev.path ? `Path: ${ev.method || ''} ${ev.path}` : null,
          ev.stack ? `\nStack:\n${ev.stack}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        severity: Number(ev.status_code) >= 500 ? 'critical' : 'medium',
        page_url: ev.path || null,
        api_endpoint: ev.path
          ? `${ev.method || 'GET'} ${ev.path}`.slice(0, 500)
          : null,
        stack_trace: ev.stack || null,
        error_event_id: ev.id,
        source: ev.source || 'backend',
      });
      return ok(res, 'Bug created from error', forced, 201);
    }

    const code = row._duplicate ? 200 : 201;
    return ok(
      res,
      row._duplicate ? 'Linked to existing duplicate bug' : 'Bug created from error',
      row,
      code
    );
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminWeeklyBugReport = async (req, res) => {
  try {
    const persist = req.query.persist === '1' || req.body?.persist === true;
    const report = await generateWeeklyBugReport({
      persist,
      createdBy: req.user?.id,
    });
    return ok(res, 'Weekly bug report', report);
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
  adminWeeklyBugReport,
  validateBugPayload,
};
