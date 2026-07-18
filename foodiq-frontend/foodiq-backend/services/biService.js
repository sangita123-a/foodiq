const { pool } = require('../config/db');

const getPlatformKpis = async ({ days = 30, marketId = null } = {}) => {
  const d = Math.min(Math.max(Number(days) || 30, 1), 90);
  const params = [d];
  let marketFilter = '';
  if (marketId) {
    params.push(marketId);
    marketFilter = ` AND o.market_id = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS orders,
       COUNT(*) FILTER (WHERE o.status = 'Delivered')::int AS delivered,
       COALESCE(SUM(o.total_amount), 0)::float AS gmv,
       COUNT(DISTINCT o.restaurant_id)::int AS active_restaurants,
       COUNT(DISTINCT o.user_id)::int AS active_customers
     FROM orders o
     WHERE o.created_at >= NOW() - ($1::int * INTERVAL '1 day')
     ${marketFilter}`,
    params
  );

  const markets = await pool.query(
    `SELECT m.id, m.code, m.name, m.city, m.country_code, m.currency_code,
            COUNT(o.id)::int AS orders_30d,
            COALESCE(SUM(o.total_amount), 0)::float AS gmv_30d
     FROM markets m
     LEFT JOIN orders o ON o.market_id = m.id
       AND o.created_at >= NOW() - INTERVAL '30 days'
     WHERE m.is_active = TRUE
     GROUP BY m.id
     ORDER BY gmv_30d DESC
     LIMIT 20`
  );

  return {
    days: d,
    summary: rows[0],
    markets: markets.rows,
    app_version: '4.0.0',
  };
};

const getEnterpriseKpis = async ({ days = 30, organizationId = null } = {}) => {
  const base = await getPlatformKpis({ days });
  const params = [Math.min(Math.max(Number(days) || 30, 1), 90)];
  let orgFilter = '';
  if (organizationId) {
    params.push(organizationId);
    orgFilter = ` AND r.organization_id = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT
       COUNT(o.id)::int AS org_orders,
       COALESCE(SUM(o.total_amount), 0)::float AS org_gmv,
       COUNT(DISTINCT o.restaurant_id)::int AS org_restaurants
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.created_at >= NOW() - ($1::int * INTERVAL '1 day')
     ${orgFilter}`,
    params
  );
  const corp = await pool.query(
    `SELECT COUNT(*)::int AS corporate_orders,
            COALESCE(SUM(total_amount),0)::float AS corporate_gmv
     FROM corporate_orders
     WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
       AND ($2::uuid IS NULL OR organization_id = $2)`,
    [params[0], organizationId || null]
  ).catch(() => ({ rows: [{ corporate_orders: 0, corporate_gmv: 0 }] }));

  return {
    ...base,
    organization_id: organizationId,
    enterprise: rows[0],
    corporate: corp.rows[0],
  };
};

module.exports = { getPlatformKpis, getEnterpriseKpis };
