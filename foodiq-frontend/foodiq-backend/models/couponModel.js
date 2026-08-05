const { pool } = require('../config/db');
const { getReferralEarnings } = require('../services/customerReferralService');

const COUPON_TYPES = ['flat', 'percentage', 'free_delivery', 'first_order', 'festival'];
const DISCOUNT_TYPES = ['percentage', 'fixed'];

/**
 * Shared validator for every coupon write path (admin CRUD, loyalty
 * point-redemption coupon minting). Throws an err.status = 400 error
 * on the first batch of problems found instead of writing a bad row —
 * previously the admin write path did no validation at all, allowing
 * e.g. a 500%-off coupon or a coupon_type/discount_type mismatch that
 * resolveCouponType() would then misinterpret at redemption time.
 */
const validateCouponInput = (data, { isUpdate = false } = {}) => {
  const errors = [];

  if (!isUpdate && !String(data.code || '').trim()) {
    errors.push('code is required');
  }

  if (data.discount_type != null && !DISCOUNT_TYPES.includes(data.discount_type)) {
    errors.push(`discount_type must be one of ${DISCOUNT_TYPES.join(', ')}`);
  }
  if (data.coupon_type != null && !COUPON_TYPES.includes(data.coupon_type)) {
    errors.push(`coupon_type must be one of ${COUPON_TYPES.join(', ')}`);
  }
  if (data.coupon_type === 'flat' && data.discount_type && data.discount_type !== 'fixed') {
    errors.push('coupon_type "flat" requires discount_type "fixed"');
  }
  if (data.coupon_type === 'percentage' && data.discount_type && data.discount_type !== 'percentage') {
    errors.push('coupon_type "percentage" requires discount_type "percentage"');
  }

  if (!isUpdate || data.discount_amount != null) {
    const amount = Number(data.discount_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push('discount_amount must be a positive number');
    } else if ((data.discount_type || 'percentage') === 'percentage' && amount > 100) {
      errors.push('percentage discount_amount cannot exceed 100');
    }
  }

  if (data.max_discount_amount != null && Number(data.max_discount_amount) <= 0) {
    errors.push('max_discount_amount must be a positive number');
  }
  if (data.min_order_amount != null && Number(data.min_order_amount) < 0) {
    errors.push('min_order_amount cannot be negative');
  }
  if (
    data.usage_limit != null &&
    (!Number.isInteger(Number(data.usage_limit)) || Number(data.usage_limit) <= 0)
  ) {
    errors.push('usage_limit must be a positive integer');
  }
  if (data.valid_from && data.valid_until && new Date(data.valid_from) >= new Date(data.valid_until)) {
    errors.push('valid_from must be before valid_until');
  }

  if (errors.length > 0) {
    const err = new Error(errors.join('; '));
    err.status = 400;
    throw err;
  }
};

/**
 * Single source of truth for writing a coupon row. Used by the admin CRUD
 * surface and by system-generated coupons (e.g. loyalty point redemption),
 * which previously wrote directly via raw SQL with no validation.
 */
const createCoupon = async (data) => {
  validateCouponInput(data);
  const {
    code, discount_amount, discount_type, min_order_amount, max_discount_amount,
    usage_limit, valid_from, valid_until, is_active,
    coupon_type, one_time_per_user, title, description,
  } = data;
  const { rows } = await pool.query(
    `INSERT INTO coupons (
       code, discount_amount, discount_type, min_order_amount, max_discount_amount,
       usage_limit, valid_from, valid_until, is_active,
       coupon_type, one_time_per_user, title, description
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9, TRUE),$10,COALESCE($11, FALSE),$12,$13) RETURNING *`,
    [
      String(code).toUpperCase().trim(),
      discount_amount,
      discount_type || 'percentage',
      min_order_amount || 0,
      max_discount_amount || null,
      usage_limit || null,
      valid_from || null,
      valid_until || null,
      is_active,
      coupon_type || (discount_type === 'fixed' ? 'flat' : 'percentage'),
      one_time_per_user,
      title || null,
      description || null,
    ]
  );
  return rows[0];
};

const updateCoupon = async (id, data) => {
  validateCouponInput(data, { isUpdate: true });
  const {
    code, discount_amount, discount_type, min_order_amount, max_discount_amount,
    usage_limit, valid_from, valid_until, is_active,
    coupon_type, one_time_per_user, title, description,
  } = data;
  const { rows } = await pool.query(
    `UPDATE coupons SET
       code = COALESCE($1, code),
       discount_amount = COALESCE($2, discount_amount),
       discount_type = COALESCE($3, discount_type),
       min_order_amount = COALESCE($4, min_order_amount),
       max_discount_amount = COALESCE($5, max_discount_amount),
       usage_limit = COALESCE($6, usage_limit),
       valid_from = COALESCE($7, valid_from),
       valid_until = COALESCE($8, valid_until),
       is_active = COALESCE($9, is_active),
       coupon_type = COALESCE($10, coupon_type),
       one_time_per_user = COALESCE($11, one_time_per_user),
       title = COALESCE($12, title),
       description = COALESCE($13, description),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $14 RETURNING *`,
    [
      code ? String(code).toUpperCase().trim() : null,
      discount_amount, discount_type, min_order_amount, max_discount_amount,
      usage_limit, valid_from, valid_until, is_active,
      coupon_type, one_time_per_user, title, description, id,
    ]
  );
  return rows[0] || null;
};

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
  // Lock the coupon row for the duration of this transaction so concurrent
  // checkouts redeeming the same coupon serialize instead of racing past
  // the usage_limit / one_time_per_user checks (see validateCoupon above,
  // which is only an advisory pre-check done before the transaction opens).
  const { rows: lockRows } = await client.query(
    'SELECT usage_limit, one_time_per_user FROM coupons WHERE id = $1 FOR UPDATE',
    [couponId]
  );
  const coupon = lockRows[0];
  if (!coupon) {
    const err = new Error('Coupon no longer exists');
    err.status = 400;
    throw err;
  }

  if (coupon.usage_limit != null) {
    const { rows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM coupon_usage WHERE coupon_id = $1',
      [couponId]
    );
    if (rows[0].count >= Number(coupon.usage_limit)) {
      const err = new Error('Coupon usage limit reached');
      err.status = 400;
      throw err;
    }
  }

  if (coupon.one_time_per_user) {
    const { rows } = await client.query(
      'SELECT COUNT(*)::int AS count FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
      [couponId, userId]
    );
    if (rows[0].count >= 1) {
      const err = new Error('You have already used this coupon');
      err.status = 400;
      throw err;
    }
  }

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
  const [available, saved, history, referralEarnings] = await Promise.all([
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
    getReferralEarnings(userId),
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
    referral_earnings: referralEarnings,
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
  validateCouponInput,
  createCoupon,
  updateCoupon,
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
