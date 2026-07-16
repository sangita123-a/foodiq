const { pool } = require('../config/db');

const getAllLiveDeals = async () => {
  const { rows } = await pool.query(`
    SELECT
      ld.id,
      ld.deal_key,
      ld.offer_title,
      ld.description,
      ld.logo_url,
      ld.banner_url,
      ld.delivery_time_label,
      ld.timer_seconds,
      ld.sort_order,
      r.id AS restaurant_id,
      r.name AS restaurant_name,
      r.rating,
      r.estimated_delivery_time,
      c.code AS coupon_code,
      c.discount_amount,
      c.discount_type,
      c.min_order_amount
    FROM live_deals ld
    JOIN restaurants r ON ld.restaurant_id = r.id
    LEFT JOIN coupons c ON ld.coupon_id = c.id
    WHERE ld.is_active = TRUE AND r.is_active = TRUE
    ORDER BY ld.sort_order ASC, ld.id ASC
  `);
  return rows;
};

const getLiveDealByRestaurantId = async (restaurantId) => {
  const { rows } = await pool.query(
    `
    SELECT
      ld.*,
      r.name AS restaurant_name,
      c.code AS coupon_code,
      c.discount_amount,
      c.discount_type,
      c.min_order_amount
    FROM live_deals ld
    JOIN restaurants r ON ld.restaurant_id = r.id
    LEFT JOIN coupons c ON ld.coupon_id = c.id
    WHERE ld.restaurant_id = $1 AND ld.is_active = TRUE
    LIMIT 1
    `,
    [restaurantId]
  );
  return rows[0];
};

const getLiveDealByCouponCode = async (couponCode, restaurantId) => {
  const { rows } = await pool.query(
    `
    SELECT
      ld.*,
      r.name AS restaurant_name,
      c.code AS coupon_code,
      c.discount_amount,
      c.discount_type,
      c.min_order_amount
    FROM live_deals ld
    JOIN restaurants r ON ld.restaurant_id = r.id
    JOIN coupons c ON ld.coupon_id = c.id
    JOIN restaurant_coupons rc ON rc.restaurant_id = r.id AND rc.coupon_id = c.id
    WHERE ld.restaurant_id = $1 AND UPPER(c.code) = UPPER($2) AND ld.is_active = TRUE
    `,
    [restaurantId, couponCode]
  );
  return rows[0];
};

const validateRestaurantCoupon = async (couponId, restaurantId) => {
  const { rows } = await pool.query(
    'SELECT restaurant_id FROM restaurant_coupons WHERE coupon_id = $1',
    [couponId]
  );
  if (rows.length === 0) return { valid: true };
  if (!restaurantId) {
    return { valid: false, message: 'This coupon is only valid at participating restaurants' };
  }
  const eligible = rows.some((r) => r.restaurant_id === restaurantId);
  if (!eligible) {
    return { valid: false, message: 'This coupon is not valid for the restaurant in your cart' };
  }
  return { valid: true };
};

module.exports = {
  getAllLiveDeals,
  getLiveDealByRestaurantId,
  getLiveDealByCouponCode,
  validateRestaurantCoupon,
};
