const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const { createApiKey } = require('../models/apiKeyModel');
const { getPlatformKpis } = require('../services/biService');
const { runForecast } = require('../services/aiForecastService');
const { resolveMultiplier } = require('../services/pricingEngine');
const { search } = require('../services/searchAdapter');

const listMarkets = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM markets WHERE is_active = TRUE ORDER BY country_code, city`
    );
    return ok(res, 'Markets', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const listOrganizations = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM organizations ORDER BY created_at DESC LIMIT 100`
    );
    return ok(res, 'Organizations', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const createOrganization = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return fail(res, 400, 'name is required');
    const slug =
      String(req.body.slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || null;
    const { rows } = await pool.query(
      `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING *`,
      [name, slug]
    );
    return ok(res, 'Organization created', rows[0], 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const createMarket = async (req, res) => {
  try {
    const { code, name, country_code, state_code, city, currency_code, timezone } =
      req.body;
    if (!code || !name) return fail(res, 400, 'code and name are required');
    const { rows } = await pool.query(
      `INSERT INTO markets (code, name, country_code, state_code, city, currency_code, timezone)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        code,
        name,
        country_code || 'IN',
        state_code || null,
        city || null,
        currency_code || 'INR',
        timezone || 'Asia/Kolkata',
      ]
    );
    return ok(res, 'Market created', rows[0], 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const listFranchises = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT f.*, o.name AS organization_name, m.name AS market_name
       FROM franchises f
       LEFT JOIN organizations o ON o.id = f.organization_id
       LEFT JOIN markets m ON m.id = f.market_id
       ORDER BY f.created_at DESC LIMIT 100`
    );
    return ok(res, 'Franchises', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const createFranchise = async (req, res) => {
  try {
    const { organization_id, market_id, name, code } = req.body;
    if (!organization_id || !name) {
      return fail(res, 400, 'organization_id and name are required');
    }
    const { rows } = await pool.query(
      `INSERT INTO franchises (organization_id, market_id, name, code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [organization_id, market_id || null, name, code || null]
    );
    return ok(res, 'Franchise created', rows[0], 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const listChains = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, o.name AS organization_name,
              (SELECT COUNT(*)::int FROM restaurants r WHERE r.chain_id = c.id) AS restaurant_count
       FROM restaurant_chains c
       LEFT JOIN organizations o ON o.id = c.organization_id
       ORDER BY c.created_at DESC LIMIT 100`
    );
    return ok(res, 'Chains', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const createChain = async (req, res) => {
  try {
    const { organization_id, name, slug, logo_url } = req.body;
    if (!organization_id || !name) {
      return fail(res, 400, 'organization_id and name are required');
    }
    const { rows } = await pool.query(
      `INSERT INTO restaurant_chains (organization_id, name, slug, logo_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [organization_id, name, slug || null, logo_url || null]
    );
    return ok(res, 'Chain created', rows[0], 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const upsertWhiteLabel = async (req, res) => {
  try {
    const { organization_id, host, brand_name, logo_url, primary_color, feature_flags } =
      req.body;
    if (!organization_id || !host) {
      return fail(res, 400, 'organization_id and host are required');
    }
    const { rows } = await pool.query(
      `INSERT INTO white_label_configs (
         organization_id, host, brand_name, logo_url, primary_color, feature_flags
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (host) DO UPDATE SET
         brand_name = EXCLUDED.brand_name,
         logo_url = EXCLUDED.logo_url,
         primary_color = EXCLUDED.primary_color,
         feature_flags = EXCLUDED.feature_flags,
         organization_id = EXCLUDED.organization_id
       RETURNING *`,
      [
        organization_id,
        host,
        brand_name || null,
        logo_url || null,
        primary_color || '#FC8019',
        JSON.stringify(feature_flags || {}),
      ]
    );
    return ok(res, 'White-label saved', rows[0]);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const postApiKey = async (req, res) => {
  try {
    const name = String(req.body.name || 'default').trim();
    const scopes = Array.isArray(req.body.scopes)
      ? req.body.scopes
      : ['public'];
    const key = await createApiKey({
      organization_id: req.body.organization_id || null,
      name,
      scopes,
    });
    return ok(res, 'API key created — store raw_key now; it will not be shown again', key, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getBi = async (req, res) => {
  try {
    const data = await getPlatformKpis({
      days: req.query.days,
      marketId: req.query.market_id || null,
    });
    return ok(res, 'BI KPIs', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const postForecast = async (req, res) => {
  try {
    const run = await runForecast({
      forecastType: req.body.forecast_type || req.query.type || 'sales',
      marketId: req.body.market_id || req.query.market_id || null,
      organizationId: req.body.organization_id || null,
      horizonDays: req.body.horizon_days || 7,
    });
    return ok(res, 'Forecast generated', run, 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const getPricingPreview = async (req, res) => {
  try {
    const result = await resolveMultiplier({
      marketId: req.query.market_id || null,
      organizationId: req.query.organization_id || null,
    });
    return ok(res, 'Pricing preview', result);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const listInventory = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, m.name AS menu_item_name, w.name AS warehouse_name
       FROM inventory_items i
       LEFT JOIN menu_items m ON m.id = i.menu_item_id
       LEFT JOIN warehouses w ON w.id = i.warehouse_id
       ORDER BY i.updated_at DESC LIMIT 100`
    );
    return ok(res, 'Inventory', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const listConnectors = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM integration_connectors ORDER BY created_at DESC LIMIT 50`
    );
    return ok(res, 'Connectors', rows);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const upsertConnector = async (req, res) => {
  try {
    const { organization_id, type, name, webhook_url, status, config } = req.body;
    if (!type || !name) return fail(res, 400, 'type and name are required');
    const { rows } = await pool.query(
      `INSERT INTO integration_connectors (
         organization_id, type, name, webhook_url, status, config
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *`,
      [
        organization_id || null,
        type,
        name,
        webhook_url || null,
        status || 'inactive',
        JSON.stringify(config || {}),
      ]
    );
    return ok(res, 'Connector saved', rows[0], 201);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const adminSearch = async (req, res) => {
  try {
    const data = await search(req.query.q || '', { limit: req.query.limit });
    return ok(res, 'Search', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  listMarkets,
  listOrganizations,
  createOrganization,
  createMarket,
  listFranchises,
  createFranchise,
  listChains,
  createChain,
  upsertWhiteLabel,
  postApiKey,
  getBi,
  postForecast,
  getPricingPreview,
  listInventory,
  listConnectors,
  upsertConnector,
  adminSearch,
};
