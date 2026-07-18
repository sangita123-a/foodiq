const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');
const cache = require('../services/cacheService');

const health = async (_req, res) => {
  return ok(res, 'Foodiq API v1', {
    version: '3.0.0',
    api: 'v1',
    pricing_engine: String(process.env.PRICING_ENGINE_ENABLED || 'false'),
    search_provider: process.env.SEARCH_PROVIDER || 'pg',
    redis: String(process.env.REDIS_ENABLED || 'false'),
  });
};

const branding = async (req, res) => {
  try {
    const host = String(req.query.host || req.hostname || 'localhost')
      .split(':')[0]
      .toLowerCase();
    const { rows } = await pool.query(
      `SELECT brand_name, logo_url, primary_color, feature_flags, host
       FROM white_label_configs
       WHERE is_active = TRUE AND LOWER(host) = $1
       LIMIT 1`,
      [host]
    );
    return ok(
      res,
      'Branding',
      rows[0] || {
        brand_name: 'Foodiq',
        logo_url: null,
        primary_color: '#FC8019',
        feature_flags: {},
        host,
      }
    );
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const markets = async (_req, res) => {
  try {
    const key = cache.cacheKey('v1:markets', {});
    const { data } = await cache.wrap(key, 120, async () => {
      const { rows } = await pool.query(
        `SELECT id, code, name, country_code, state_code, city, currency_code, timezone
         FROM markets WHERE is_active = TRUE ORDER BY country_code, city`
      );
      return rows;
    });
    res.set('Cache-Control', 'public, max-age=60');
    return ok(res, 'Markets', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const restaurants = async (req, res) => {
  try {
    const marketId = req.query.market_id || req.tenant?.market_id || null;
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const key = cache.cacheKey('v1:restaurants', { marketId, limit });
    const { data } = await cache.wrap(key, 60, async () => {
      const values = [];
      let where = 'WHERE r.is_active = TRUE';
      if (marketId) {
        values.push(marketId);
        where += ` AND r.market_id = $${values.length}`;
      }
      values.push(limit);
      const { rows } = await pool.query(
        `SELECT r.id, r.name, r.slug, r.rating, r.image_url,
                r.market_id, r.chain_id, r.organization_id,
                m.currency_code
         FROM restaurants r
         LEFT JOIN markets m ON m.id = r.market_id
         ${where}
         ORDER BY r.rating DESC NULLS LAST
         LIMIT $${values.length}`,
        values
      );
      return rows;
    });
    res.set('Cache-Control', 'public, max-age=30');
    return ok(res, 'Restaurants', data);
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const partnerSummary = async (req, res) => {
  try {
    const orgId = req.apiKey?.organization_id;
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS restaurants,
              COALESCE(AVG(rating),0)::float AS avg_rating
       FROM restaurants
       WHERE ($1::uuid IS NULL OR organization_id = $1)`,
      [orgId || null]
    );
    return ok(res, 'Partner summary', {
      organization_id: orgId,
      ...rows[0],
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

const syncIntegration = async (req, res) => {
  try {
    const type = String(req.params.type || '').toLowerCase();
    const allowed = ['pos', 'erp', 'crm', 'warehouse'];
    if (!allowed.includes(type)) {
      return fail(res, 400, 'type must be pos|erp|crm|warehouse');
    }
    const orgId = req.apiKey?.organization_id || req.body.organization_id || null;
    const { rows } = await pool.query(
      `UPDATE integration_connectors
       SET last_sync_at = NOW(), status = 'syncing', last_error = NULL
       WHERE type = $1 AND ($2::uuid IS NULL OR organization_id = $2)
       RETURNING id, type, name, status, last_sync_at`,
      [type, orgId]
    );
    // Foundation stub — mark inactive sync complete
    if (rows[0]) {
      await pool.query(
        `UPDATE integration_connectors SET status = 'active' WHERE id = $1`,
        [rows[0].id]
      );
    }
    return ok(res, 'Integration sync accepted (stub)', {
      type,
      synced: rows.length,
      note: 'Vendor connectors ship in Foodiq 3.1',
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = {
  health,
  branding,
  markets,
  restaurants,
  partnerSummary,
  syncIntegration,
};
