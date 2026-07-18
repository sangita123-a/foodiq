const { pool } = require('../config/db');

const personalizedOffers = async ({ userId = null, limit = 10 } = {}) => {
  const lim = Math.min(Number(limit) || 10, 30);
  let offers = [];
  try {
    const r = await pool.query(
      `SELECT id, title, description, discount_type, discount_value, code, is_active, created_at
       FROM offers WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 50`
    );
    offers = r.rows;
  } catch {
    try {
      const r = await pool.query(
        `SELECT id, code, discount_type, discount_amount AS discount_value, is_active, created_at
         FROM coupons WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 50`
      );
      offers = r.rows;
    } catch {
      offers = [];
    }
  }

  let historyBoost = 0;
  if (userId) {
    const hist = await pool.query(
      `SELECT COUNT(*)::int AS c FROM orders WHERE user_id = $1`,
      [userId]
    ).catch(() => ({ rows: [{ c: 0 }] }));
    historyBoost = hist.rows[0]?.c > 0 ? 10 : 0;
  }

  const scored = offers.map((o, idx) => ({
    ...o,
    score: 100 - idx + historyBoost,
  }));
  scored.sort((a, b) => b.score - a.score);
  return {
    offers: scored.slice(0, lim),
    strategy: userId ? 'history_boost' : 'recent',
  };
};

module.exports = { personalizedOffers };
