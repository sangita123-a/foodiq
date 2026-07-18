const { pool } = require('../config/db');

const getCheckoutCurrency = async (marketId) => {
  if (!marketId) return 'INR';
  const { rows } = await pool.query(
    `SELECT currency_code FROM markets WHERE id = $1 LIMIT 1`,
    [marketId]
  );
  return rows[0]?.currency_code || 'INR';
};

const convertAmount = async (amount, from, to) => {
  const a = Number(amount) || 0;
  if (!from || !to || from === to) return a;
  const { rows } = await pool.query(
    `SELECT rate FROM fx_rates
     WHERE base_currency = $1 AND quote_currency = $2
     ORDER BY effective_at DESC LIMIT 1`,
    [from, to]
  );
  const rate = Number(rows[0]?.rate);
  if (!rate) return a;
  return Math.round(a * rate * 100) / 100;
};

module.exports = { getCheckoutCurrency, convertAmount };
