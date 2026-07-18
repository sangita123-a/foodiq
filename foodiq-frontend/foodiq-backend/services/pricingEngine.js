const { pool } = require('../config/db');

const pricingEnabled = () =>
  String(process.env.PRICING_ENGINE_ENABLED || '').toLowerCase() === 'true';

/**
 * Returns a multiplier (>= 1) for market/org context.
 * When disabled, always returns 1 (V2-compatible totals).
 */
const resolveMultiplier = async ({ marketId, organizationId } = {}) => {
  if (!pricingEnabled()) {
    return { multiplier: 1, surge: null, rules: [], enabled: false };
  }

  let surge = null;
  if (marketId) {
    const { rows } = await pool.query(
      `SELECT * FROM surge_events
       WHERE market_id = $1 AND is_active = TRUE
         AND starts_at <= NOW() AND ends_at >= NOW()
       ORDER BY multiplier DESC
       LIMIT 1`,
      [marketId]
    );
    surge = rows[0] || null;
  }

  const values = [];
  let where = `WHERE is_active = TRUE`;
  if (marketId) {
    values.push(marketId);
    where += ` AND (market_id = $${values.length} OR market_id IS NULL)`;
  }
  if (organizationId) {
    values.push(organizationId);
    where += ` AND (organization_id = $${values.length} OR organization_id IS NULL)`;
  }

  const { rows: rules } = await pool.query(
    `SELECT * FROM pricing_rules ${where} ORDER BY multiplier DESC LIMIT 20`,
    values
  );

  let multiplier = 1;
  for (const r of rules) {
    const m = Number(r.multiplier) || 1;
    if (m > multiplier) multiplier = m;
  }
  if (surge) {
    const sm = Number(surge.multiplier) || 1;
    if (sm > multiplier) multiplier = sm;
  }

  return { multiplier, surge, rules, enabled: true };
};

const applyToAmount = (amount, multiplier) => {
  const a = Number(amount) || 0;
  const m = Number(multiplier) || 1;
  return Math.round(a * m * 100) / 100;
};

module.exports = { pricingEnabled, resolveMultiplier, applyToAmount };
