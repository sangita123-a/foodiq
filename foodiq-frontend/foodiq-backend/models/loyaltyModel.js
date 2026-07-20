const { pool } = require('../config/db');

const POINTS_TO_RUPEE = 10;

const ensureRewardsRow = async (userId, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO rewards (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return rows[0];
};

const getWallet = async (userId) => {
  await ensureRewardsRow(userId);
  const { rows } = await pool.query(`SELECT * FROM rewards WHERE user_id = $1`, [userId]);
  const reward = rows[0] || { points_balance: 0, total_earned: 0, total_redeemed: 0 };

  const tier = await getUserTier(userId, reward.total_earned);

  const expiry = await pool.query(
    `SELECT MIN(expires_at) AS next_expiry FROM loyalty_ledger
     WHERE user_id = $1 AND expires_at IS NOT NULL AND expires_at > CURRENT_TIMESTAMP`,
    [userId]
  );

  const expiringSoon = await pool.query(
    `SELECT COALESCE(SUM(delta), 0)::int AS points
     FROM loyalty_ledger
     WHERE user_id = $1 AND expires_at IS NOT NULL
       AND expires_at <= CURRENT_TIMESTAMP + INTERVAL '30 days'
       AND expires_at > CURRENT_TIMESTAMP`,
    [userId]
  );

  return {
    points_balance: reward.points_balance || 0,
    lifetime_points: reward.total_earned || 0,
    redeemed_points: reward.total_redeemed || 0,
    next_expiry: expiry.rows[0]?.next_expiry || null,
    expiring_soon_points: expiringSoon.rows[0]?.points || 0,
    tier,
    points_to_rupee_rate: POINTS_TO_RUPEE,
  };
};

const getUserTier = async (userId, lifetimePoints) => {
  const lifetime = lifetimePoints ?? (await pool.query(
    `SELECT total_earned FROM rewards WHERE user_id = $1`, [userId]
  )).rows[0]?.total_earned ?? 0;

  const { rows } = await pool.query(
    `SELECT * FROM membership_tiers
     WHERE is_active = TRUE AND min_lifetime_points <= $1
     ORDER BY min_lifetime_points DESC LIMIT 1`,
    [lifetime]
  );
  const current = rows[0] || null;

  const { rows: allTiers } = await pool.query(
    `SELECT * FROM membership_tiers WHERE is_active = TRUE ORDER BY sort_order ASC`
  );

  const next = allTiers.find((t) => t.min_lifetime_points > lifetime) || null;

  return {
    current: current
      ? {
          slug: current.slug,
          name: current.name,
          min_lifetime_points: current.min_lifetime_points,
          benefits: current.benefits,
        }
      : { slug: 'silver', name: 'Foodiq Silver', min_lifetime_points: 0, benefits: {} },
    next: next
      ? {
          slug: next.slug,
          name: next.name,
          min_lifetime_points: next.min_lifetime_points,
          points_needed: next.min_lifetime_points - lifetime,
        }
      : null,
    lifetime_points: lifetime,
    progress_percent: next
      ? Math.min(100, Math.round((lifetime / next.min_lifetime_points) * 100))
      : 100,
  };
};

const getLedger = async (userId, { limit = 50, offset = 0 } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM loyalty_ledger WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
};

const getHistory = async (userId, { limit = 50 } = {}) => {
  const { rows } = await pool.query(
    `SELECT rh.*, o.id AS order_ref
     FROM reward_history rh
     LEFT JOIN orders o ON o.id = rh.order_id
     WHERE rh.user_id = $1
     ORDER BY rh.created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const getRule = async (ruleKey) => {
  const { rows } = await pool.query(
    `SELECT * FROM loyalty_rules WHERE rule_key = $1 AND is_active = TRUE`,
    [ruleKey]
  );
  return rows[0];
};

const listRules = async () => {
  const { rows } = await pool.query(`SELECT * FROM loyalty_rules ORDER BY rule_key ASC`);
  return rows;
};

const listTiers = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM membership_tiers ORDER BY sort_order ASC`
  );
  return rows;
};

const updateRule = async (ruleKey, data) => {
  const { label, points, multiplier, conditions, is_active } = data;
  const { rows } = await pool.query(
    `UPDATE loyalty_rules SET
       label = COALESCE($1, label),
       points = COALESCE($2, points),
       multiplier = COALESCE($3, multiplier),
       conditions = COALESCE($4, conditions),
       is_active = COALESCE($5, is_active),
       updated_at = CURRENT_TIMESTAMP
     WHERE rule_key = $6 RETURNING *`,
    [label, points, multiplier, conditions ? JSON.stringify(conditions) : null, is_active, ruleKey]
  );
  return rows[0];
};

const updateTier = async (slug, data) => {
  const { name, min_lifetime_points, benefits, is_active, sort_order } = data;
  const { rows } = await pool.query(
    `UPDATE membership_tiers SET
       name = COALESCE($1, name),
       min_lifetime_points = COALESCE($2, min_lifetime_points),
       benefits = COALESCE($3, benefits),
       is_active = COALESCE($4, is_active),
       sort_order = COALESCE($5, sort_order)
     WHERE slug = $6 RETURNING *`,
    [name, min_lifetime_points, benefits ? JSON.stringify(benefits) : null, is_active, sort_order, slug]
  );
  return rows[0];
};

const adminAdjustPoints = async (userId, delta, reason, adminId) => {
  const loyaltyEngine = require('../services/loyaltyEngine');
  if (delta > 0) {
    return loyaltyEngine.credit({
      userId,
      points: delta,
      source: 'admin_adjustment',
      referenceId: `admin:${adminId}`,
      description: reason || 'Admin adjustment',
    });
  }
  return loyaltyEngine.debit({
    userId,
    points: Math.abs(delta),
    source: 'admin_adjustment',
    referenceId: `admin:${adminId}`,
    description: reason || 'Admin adjustment',
  });
};

const expirePoints = async (userId = null) => {
  const condition = userId ? 'AND user_id = $1' : '';
  const params = userId ? [userId] : [];
  const { rows } = await pool.query(
    `SELECT user_id, COALESCE(SUM(delta), 0)::int AS expired_pts
     FROM loyalty_ledger
     WHERE expires_at IS NOT NULL AND expires_at <= CURRENT_TIMESTAMP ${condition}
     GROUP BY user_id`,
    params
  );

  const loyaltyEngine = require('../services/loyaltyEngine');
  let total = 0;
  for (const row of rows) {
    if (row.expired_pts > 0) {
      await loyaltyEngine.debit({
        userId: row.user_id,
        points: row.expired_pts,
        source: 'expired',
        referenceId: `expire:${Date.now()}`,
        description: 'Points expired',
      });
      total += row.expired_pts;
    }
  }
  return { users_affected: rows.length, points_expired: total };
};

const getAnalytics = async () => {
  const membership = await pool.query(
    `SELECT mt.slug, mt.name, COUNT(r.user_id)::int AS members
     FROM membership_tiers mt
     LEFT JOIN rewards r ON r.total_earned >= mt.min_lifetime_points
       AND r.total_earned < COALESCE(
         (SELECT min_lifetime_points FROM membership_tiers mt2
          WHERE mt2.min_lifetime_points > mt.min_lifetime_points AND mt2.is_active = TRUE
          ORDER BY mt2.min_lifetime_points ASC LIMIT 1), 999999999)
     WHERE mt.is_active = TRUE
     GROUP BY mt.id, mt.slug, mt.name, mt.min_lifetime_points
     ORDER BY mt.min_lifetime_points ASC`
  );

  const couponStats = await pool.query(
    `SELECT c.code, COUNT(cu.id)::int AS uses,
            COALESCE(SUM(o.discount_amount), 0)::float AS total_discount
     FROM coupons c
     LEFT JOIN coupon_usage cu ON cu.coupon_id = c.id
     LEFT JOIN orders o ON o.id = cu.order_id
     GROUP BY c.id, c.code
     ORDER BY uses DESC LIMIT 10`
  );

  const redemptionRate = await pool.query(
    `SELECT
       COALESCE(SUM(total_earned), 0)::int AS earned,
       COALESCE(SUM(total_redeemed), 0)::int AS redeemed
     FROM rewards`
  );

  const referralGrowth = await pool.query(
    `SELECT date_trunc('week', created_at)::date AS week, COUNT(*)::int AS referrals
     FROM referral_redemptions
     WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
     GROUP BY 1 ORDER BY 1`
  );

  const repeatCustomers = await pool.query(
    `SELECT COUNT(*)::int AS repeat_customers FROM (
       SELECT user_id FROM orders WHERE LOWER(status) = 'delivered'
       GROUP BY user_id HAVING COUNT(*) >= 2
     ) t`
  );

  const er = redemptionRate.rows[0] || { earned: 0, redeemed: 0 };
  const rate = er.earned > 0 ? Math.round((er.redeemed / er.earned) * 100) : 0;

  return {
    membership_distribution: membership.rows,
    most_used_coupons: couponStats.rows,
    redemption_rate_percent: rate,
    total_earned: er.earned,
    total_redeemed: er.redeemed,
    referral_growth: referralGrowth.rows,
    repeat_customers: repeatCustomers.rows[0]?.repeat_customers || 0,
  };
};

const getTierBenefits = async (userId) => {
  const wallet = await getWallet(userId);
  return wallet.tier.current.benefits || {};
};

module.exports = {
  POINTS_TO_RUPEE,
  ensureRewardsRow,
  getWallet,
  getUserTier,
  getLedger,
  getHistory,
  getRule,
  listRules,
  listTiers,
  updateRule,
  updateTier,
  adminAdjustPoints,
  expirePoints,
  getAnalytics,
  getTierBenefits,
};
