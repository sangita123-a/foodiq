const { pool } = require('../config/db');

const COUPON_TYPES = ['flat', 'percentage', 'free_delivery', 'first_order', 'festival'];

const getActiveCoupons = async () => {
  const { rows } = await pool.query(`
    SELECT * FROM coupons
    WHERE is_active = true
      AND (valid_until IS NULL OR valid_until > CURRENT_TIMESTAMP)
      AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
    ORDER BY created_at DESC
  `);
  return rows;
};

const getCouponByCode = async (code) => {
  const { rows } = await pool.query('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [code]);
  return rows[0];
};

const getCouponById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM coupons WHERE id = $1', [id]);
  return rows[0];
};

const getCouponUsageCountByUser = async (couponId, userId) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS cnt FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
    [couponId, userId]
  );
  return rows[0]?.cnt || 0;
};

const getCouponTotalUsageCount = async (couponId) => {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS cnt FROM coupon_usage WHERE coupon_id = $1',
    [couponId]
  );
  return rows[0]?.cnt || 0;
};

const getUserDeliveredOrderCount = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM orders
     WHERE user_id = $1 AND LOWER(status) = 'delivered'`,
    [userId]
  );
  return rows[0]?.cnt || 0;
};

const resolveCouponType = (coupon) => {
  if (coupon.coupon_type && COUPON_TYPES.includes(coupon.coupon_type)) {
    return coupon.coupon_type;
  }
  if (String(coupon.code).toUpperCase() === 'FREEDEL') return 'free_delivery';
  if (coupon.discount_type === 'fixed') return 'flat';
  return 'percentage';
};

const calculateDiscount = (coupon, subtotal) => {
  const type = resolveCouponType(coupon);
  if (type === 'free_delivery') {
    return { discount: 0, freeDelivery: true };
  }

  let discount = 0;
  if (coupon.discount_type === 'percentage' || type === 'percentage' || type === 'festival') {
    discount = subtotal * (parseFloat(coupon.discount_amount) / 100);
    if (coupon.max_discount_amount && discount > parseFloat(coupon.max_discount_amount)) {
      discount = parseFloat(coupon.max_discount_amount);
    }
  } else {
    discount = parseFloat(coupon.discount_amount);
  }

  return { discount: parseFloat(discount.toFixed(2)), freeDelivery: false };
};

const validateCoupon = async (coupon, userId, subtotal, { skipCartCheck = false } = {}) => {
  if (!coupon || !coupon.is_active) {
    return { valid: false, message: 'Invalid or inactive coupon' };
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, message: 'Coupon has expired' };
  }

  const type = resolveCouponType(coupon);

  if (type === 'first_order') {
    const delivered = await getUserDeliveredOrderCount(userId);
    if (delivered > 0) {
      return { valid: false, message: 'This coupon is valid for first order only' };
    }
  }

  if (coupon.usage_limit != null) {
    const totalUses = await getCouponTotalUsageCount(coupon.id);
    if (totalUses >= Number(coupon.usage_limit)) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }
  }

  const userUses = await getCouponUsageCountByUser(coupon.id, userId);
  if (coupon.one_time_per_user && userUses >= 1) {
    return { valid: false, message: 'You have already used this coupon' };
  }

  if (!skipCartCheck && subtotal > 0 && subtotal < parseFloat(coupon.min_order_amount || 0)) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${coupon.min_order_amount} required`,
    };
  }

  const { discount, freeDelivery } = calculateDiscount(coupon, subtotal);
  return {
    valid: true,
    discount,
    freeDelivery,
    couponType: type,
  };
};

const recordCouponUsage = async (couponId, userId, orderId, client = pool) => {
  await client.query(
    'INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES ($1, $2, $3)',
    [couponId, userId, orderId]
  );
  await client.query(
    `UPDATE user_coupons SET status = 'used', applied_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND coupon_id = $2`,
    [userId, couponId]
  );
};

const getCouponHistory = async (userId, limit = 50) => {
  const { rows } = await pool.query(
    `SELECT ch.*, c.title, c.coupon_type
     FROM coupon_history ch
     LEFT JOIN coupons c ON c.id = ch.coupon_id
     WHERE ch.user_id = $1
     ORDER BY ch.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const getMyRewardsSummary = async (userId) => {
  const [available, saved, history, referralStats] = await Promise.all([
    getActiveCoupons(),
    pool.query(
      `SELECT uc.*, c.code, c.discount_amount, c.discount_type, c.min_order_amount,
              c.valid_until, c.is_active, c.title, c.coupon_type, c.description
       FROM user_coupons uc
       JOIN coupons c ON uc.coupon_id = c.id
       WHERE uc.user_id = $1
       ORDER BY uc.created_at DESC`,
      [userId]
    ),
    getCouponHistory(userId, 30),
    pool.query(
      `SELECT COALESCE(SUM(points_awarded), 0)::int AS total_earned,
              COUNT(*)::int AS referral_count
       FROM referral_redemptions
       WHERE referrer_id = $1 AND status = 'credited'`,
      [userId]
    ),
  ]);

  const now = new Date();
  const active = available.filter(
    (c) => !c.valid_until || new Date(c.valid_until) >= now
  );
  const expired = available.filter(
    (c) => c.valid_until && new Date(c.valid_until) < now
  );

  return {
    available: active,
    saved: saved.rows,
    expired,
    coupon_history: history,
    referral_earnings: {
      total_points: referralStats.rows[0]?.total_earned || 0,
      referral_count: referralStats.rows[0]?.referral_count || 0,
    },
  };
};

const getCouponAnalytics = async () => {
  const { rows: summary } = await pool.query(`
    SELECT
      COUNT(*)::int AS total_coupons,
      COUNT(*) FILTER (WHERE is_active = true)::int AS active_coupons,
      COUNT(*) FILTER (WHERE coupon_type = 'festival')::int AS festival_coupons
    FROM coupons
  `);

  const { rows: usageByCoupon } = await pool.query(`
    SELECT c.id, c.code, c.coupon_type, c.title, c.is_active,
           COUNT(cu.id)::int AS total_uses,
           COALESCE(SUM(ch.discount_amount), 0)::float AS total_discount_given,
           c.usage_limit
    FROM coupons c
    LEFT JOIN coupon_usage cu ON cu.coupon_id = c.id
    LEFT JOIN coupon_history ch ON ch.coupon_id = c.id
    GROUP BY c.id
    ORDER BY total_uses DESC
    LIMIT 20
  `);

  const { rows: recentUsage } = await pool.query(`
    SELECT ch.coupon_code, ch.discount_amount, ch.final_price, ch.created_at,
           u.full_name AS user_name
    FROM coupon_history ch
    JOIN users u ON u.id = ch.user_id
    ORDER BY ch.created_at DESC
    LIMIT 15
  `);

  const { rows: dailyUsage } = await pool.query(`
    SELECT DATE(used_at) AS day, COUNT(*)::int AS uses
    FROM coupon_usage
    WHERE used_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(used_at)
    ORDER BY day DESC
  `);

  return {
    summary: summary[0],
    usage_by_coupon: usageByCoupon,
    recent_usage: recentUsage,
    daily_usage: dailyUsage,
  };
};

module.exports = {
  COUPON_TYPES,
  getActiveCoupons,
  getCouponByCode,
  getCouponById,
  getCouponUsageCountByUser,
  getCouponTotalUsageCount,
  getUserDeliveredOrderCount,
  resolveCouponType,
  calculateDiscount,
  validateCoupon,
  recordCouponUsage,
  getCouponHistory,
  getMyRewardsSummary,
  getCouponAnalytics,
  // backwards compatibility
  getCouponUsageCount: getCouponUsageCountByUser,
};
