const { pool } = require('../config/db');

const taxEnabled = () =>
  String(process.env.TAX_ENGINE_ENABLED || '').toLowerCase() === 'true';

/**
 * Resolve tax amount for a subtotal. When disabled, returns legacy 5% GST.
 */
const calculateTax = async (subtotal, { countryCode = 'IN', stateCode = null } = {}) => {
  const amount = Number(subtotal) || 0;
  if (!taxEnabled()) {
    const rate = 0.05;
    return {
      enabled: false,
      rate,
      tax: Math.round(amount * rate * 100) / 100,
      tax_type: 'GST',
      rule: null,
    };
  }

  const { rows } = await pool.query(
    `SELECT * FROM tax_rules
     WHERE is_active = TRUE AND country_code = $1
       AND ($2::text IS NULL OR state_code IS NULL OR state_code = $2)
     ORDER BY CASE WHEN state_code = $2 THEN 0 ELSE 1 END, rate DESC
     LIMIT 1`,
    [countryCode, stateCode || null]
  );
  const rule = rows[0];
  const rate = rule ? Number(rule.rate) : 0.05;
  return {
    enabled: true,
    rate,
    tax: Math.round(amount * rate * 100) / 100,
    tax_type: rule?.tax_type || 'GST',
    rule: rule || null,
  };
};

module.exports = { taxEnabled, calculateTax };
