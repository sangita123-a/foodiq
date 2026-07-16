const { pool } = require('../config/db');

const getAllOffers = async () => {
  const { rows } = await pool.query(`
    SELECT o.*, c.code as coupon_code, c.discount_amount, c.discount_type, c.min_order_amount as coupon_min_order
    FROM offers o
    LEFT JOIN coupons c ON o.coupon_id = c.id
    WHERE o.is_active = true
      AND (o.valid_until IS NULL OR o.valid_until > CURRENT_TIMESTAMP)
      AND (o.valid_from IS NULL OR o.valid_from <= CURRENT_TIMESTAMP)
    ORDER BY o.created_at ASC
  `);
  return rows;
};

const getOfferBySlug = async (slug) => {
  const { rows } = await pool.query(
    `
    SELECT o.*, c.code as coupon_code, c.discount_amount, c.discount_type,
           c.min_order_amount as coupon_min_order, c.max_discount_amount, c.valid_until as coupon_valid_until
    FROM offers o
    LEFT JOIN coupons c ON o.coupon_id = c.id
    WHERE o.slug = $1 AND o.is_active = true
    `,
    [slug]
  );
  return rows[0];
};

const getOfferRestaurants = async (offerId) => {
  const { rows } = await pool.query(
    `
    SELECT r.id, r.name, r.description, r.image_url, r.rating, r.estimated_delivery_time, r.address
    FROM offer_restaurants orr
    JOIN restaurants r ON orr.restaurant_id = r.id
    WHERE orr.offer_id = $1 AND r.is_active = true
    ORDER BY r.rating DESC
    `,
    [offerId]
  );
  return rows;
};

const getOfferItems = async (offerId) => {
  const { rows } = await pool.query(
    `
    SELECT
      m.id as menu_item_id,
      m.name,
      m.description,
      m.price,
      m.discount_price,
      m.image_url,
      m.is_vegetarian,
      oi.offer_discount_percent,
      oi.display_order,
      r.id as restaurant_id,
      r.name as restaurant_name,
      r.rating as restaurant_rating,
      r.estimated_delivery_time
    FROM offer_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    JOIN restaurants r ON m.restaurant_id = r.id
    WHERE oi.offer_id = $1 AND m.is_available IS NOT FALSE
    ORDER BY oi.display_order ASC, m.name ASC
    `,
    [offerId]
  );
  return rows;
};

const validateOfferEligibility = async (offer, userId, cartItems, subtotal) => {
  if (!offer) return { valid: false, message: 'Offer not found' };

  const now = new Date();
  if (offer.valid_from && new Date(offer.valid_from) > now) {
    return { valid: false, message: 'Offer is not yet active' };
  }
  if (offer.valid_until && new Date(offer.valid_until) < now) {
    return { valid: false, message: 'Offer has expired' };
  }

  const minOrder = parseFloat(offer.min_order_amount || offer.coupon_min_order || 0);
  if (subtotal < minOrder) {
    return { valid: false, message: `Minimum order amount of ₹${minOrder} required for this offer` };
  }

  if (cartItems.length === 0) {
    return { valid: false, message: 'Cart is empty' };
  }

  const { rows: offerItemRows } = await pool.query(
    'SELECT menu_item_id FROM offer_items WHERE offer_id = $1',
    [offer.id]
  );
  const eligibleIds = new Set(offerItemRows.map((r) => r.menu_item_id));

  if (eligibleIds.size > 0) {
    const hasEligible = cartItems.some((item) => eligibleIds.has(item.menu_item_id));
    if (!hasEligible) {
      return { valid: false, message: 'Cart must include at least one item from this offer' };
    }
  }

  const { rows: offerRestRows } = await pool.query(
    'SELECT restaurant_id FROM offer_restaurants WHERE offer_id = $1',
    [offer.id]
  );
  const eligibleRestaurants = new Set(offerRestRows.map((r) => r.restaurant_id));

  if (eligibleRestaurants.size > 0) {
    const cartRestaurantId = cartItems[0]?.restaurant_id;
    if (!eligibleRestaurants.has(cartRestaurantId)) {
      return { valid: false, message: 'Restaurant is not eligible for this offer' };
    }
  }

  return { valid: true };
};

const recordOfferUsage = async (offerId, userId, orderId, discountAmount, client = pool) => {
  await client.query(
    `INSERT INTO offer_usage (offer_id, user_id, order_id, discount_amount) VALUES ($1, $2, $3, $4)`,
    [offerId, userId, orderId, discountAmount]
  );
};

const recordCouponHistory = async (
  { userId, couponId, offerId, orderId, couponCode, discountAmount, finalPrice },
  client = pool
) => {
  await client.query(
    `INSERT INTO coupon_history (user_id, coupon_id, offer_id, order_id, coupon_code, discount_amount, final_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, couponId, offerId, orderId, couponCode, discountAmount, finalPrice]
  );
};

const getOfferByCouponCode = async (code) => {
  const { rows } = await pool.query(
    `
    SELECT o.*, c.code as coupon_code
    FROM offers o
    JOIN coupons c ON o.coupon_id = c.id
    WHERE UPPER(c.code) = UPPER($1) AND o.is_active = true
    `,
    [code]
  );
  return rows[0];
};

module.exports = {
  getAllOffers,
  getOfferBySlug,
  getOfferRestaurants,
  getOfferItems,
  validateOfferEligibility,
  recordOfferUsage,
  recordCouponHistory,
  getOfferByCouponCode,
};
