const { pool } = require('../config/db');

const getActiveCoupons = async () => {
  const query = `
    SELECT * FROM coupons 
    WHERE is_active = true 
      AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
      AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
  `;
  const { rows } = await pool.query(query);
  return rows;
};

const getCouponByCode = async (code) => {
  const { rows } = await pool.query('SELECT * FROM coupons WHERE code = $1', [code]);
  return rows[0];
};

const getCouponUsageCount = async (couponId, userId) => {
  const { rows } = await pool.query('SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2', [couponId, userId]);
  return parseInt(rows[0].count);
};

const recordCouponUsage = async (couponId, userId, orderId, client = pool) => {
  await client.query('INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES ($1, $2, $3)', [couponId, userId, orderId]);
};

module.exports = {
  getActiveCoupons,
  getCouponByCode,
  getCouponUsageCount,
  recordCouponUsage
};
