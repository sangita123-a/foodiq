const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const { getEnterpriseKpis } = require('../services/biService');
const { listAudits, writeAudit } = require('../services/auditService');
const { listVehicles, createVehicle } = require('../services/fleetService');
const { listSuggestions, generateSuggestions } = require('../services/predictiveInventoryService');
const { registerDevice } = require('../services/iotKitchenService');
const { formatInTimezone } = require('../services/i18nService');

const listTaxRules = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM tax_rules ORDER BY country_code, state_code NULLS FIRST`
    );
    return ok(res, 'Tax rules', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const createTaxRule = async (req, res) => {
  try {
    const { country_code, state_code, tax_type, rate, name, is_active } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tax_rules (country_code, state_code, tax_type, rate, name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        country_code || 'IN',
        state_code || null,
        tax_type || 'GST',
        rate ?? 0.05,
        name || null,
        Boolean(is_active),
      ]
    );
    return ok(res, 'Tax rule created', rows[0], 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const enterpriseBi = async (req, res) => {
  try {
    const data = await getEnterpriseKpis({
      days: req.query.days,
      organizationId: req.query.organization_id || null,
    });
    data.generated_local = formatInTimezone(
      new Date(),
      req.query.timezone || 'Asia/Kolkata'
    );
    return ok(res, 'Enterprise BI', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const auditExport = async (req, res) => {
  try {
    const rows = await listAudits({
      q: req.query.q || '',
      category: req.query.category || '',
      limit: Math.min(Number(req.query.limit) || 200, 500),
      offset: Number(req.query.offset) || 0,
    });
    const orgId = req.query.organization_id;
    const filtered = orgId
      ? rows.filter(
          (r) =>
            r.organization_id === orgId ||
            r.meta?.organization_id === orgId
        )
      : rows;
    return ok(res, 'Audit export', {
      count: filtered.length,
      rows: filtered,
      exported_at: new Date().toISOString(),
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const fleetList = async (req, res) => {
  try {
    const rows = await listVehicles({
      organizationId: req.query.organization_id || null,
    });
    return ok(res, 'Fleet', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const fleetCreate = async (req, res) => {
  try {
    if (!req.body.label) return fail(res, 400, 'label required');
    const row = await createVehicle(req.body);
    await writeAudit({
      userId: req.user?.id,
      role: req.user?.role,
      action: 'fleet.vehicle.create',
      category: 'fleet',
      resourceType: 'fleet_vehicle',
      resourceId: row.id,
      req,
      meta: { organization_id: row.organization_id },
    });
    return ok(res, 'Vehicle created', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const aiStats = async (_req, res) => {
  try {
    const sessions = await pool.query(
      `SELECT COUNT(*)::int AS sessions,
              COUNT(*) FILTER (WHERE status = 'open')::int AS open_sessions
       FROM ai_chat_sessions`
    );
    const forecasts = await pool.query(
      `SELECT COUNT(*)::int AS forecast_runs FROM ai_forecast_runs`
    ).catch(() => ({ rows: [{ forecast_runs: 0 }] }));
    return ok(res, 'AI stats', {
      ...sessions.rows[0],
      ...forecasts.rows[0],
      ai_assistants_enabled: String(process.env.AI_ASSISTANTS_ENABLED || 'false'),
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const inventorySuggestions = async (req, res) => {
  try {
    if (req.query.generate === '1') {
      const data = await generateSuggestions();
      return ok(res, 'Generated', data);
    }
    const rows = await listSuggestions();
    return ok(res, 'Suggestions', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const iotDeviceCreate = async (req, res) => {
  try {
    const row = await registerDevice(req.body);
    return ok(res, 'Device registered', row, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const listMemberships = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.email, u.full_name
       FROM organization_memberships m
       JOIN users u ON u.id = m.user_id
       WHERE ($1::uuid IS NULL OR m.organization_id = $1)
       ORDER BY m.created_at DESC LIMIT 100`,
      [req.query.organization_id || null]
    );
    return ok(res, 'Memberships', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const upsertMembership = async (req, res) => {
  try {
    const { organization_id, user_id, role_code } = req.body;
    if (!organization_id || !user_id) {
      return fail(res, 400, 'organization_id and user_id required');
    }
    const { rows } = await pool.query(
      `INSERT INTO organization_memberships (organization_id, user_id, role_code)
       VALUES ($1, $2, $3)
       ON CONFLICT (organization_id, user_id) DO UPDATE SET
         role_code = EXCLUDED.role_code, is_active = TRUE
       RETURNING *`,
      [organization_id, user_id, role_code || 'viewer']
    );
    return ok(res, 'Membership saved', rows[0]);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  listTaxRules,
  createTaxRule,
  enterpriseBi,
  auditExport,
  fleetList,
  fleetCreate,
  aiStats,
  inventorySuggestions,
  iotDeviceCreate,
  listMemberships,
  upsertMembership,
};
