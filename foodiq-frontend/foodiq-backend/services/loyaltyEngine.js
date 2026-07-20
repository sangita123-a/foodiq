/**
 * Central loyalty earn/redeem engine with idempotency.
 */
const { pool } = require('../config/db');
const loyaltyModel = require('../models/loyaltyModel');

const DEFAULT_EXPIRY_DAYS = 365;

const credit = async ({
  userId,
  points,
  source,
  referenceId = null,
  description = null,
  orderId = null,
  expiresInDays = DEFAULT_EXPIRY_DAYS,
  client = null,
}) => {
  if (!userId || !points || points <= 0) return null;

  const db = client || (await pool.connect());
  const ownClient = !client;

  try {
    if (ownClient) await db.query('BEGIN');

    if (referenceId) {
      const dup = await db.query(
        `SELECT id FROM reward_history
         WHERE user_id = $1 AND source = $2 AND reference_id = $3 AND transaction_type = 'earned'
         LIMIT 1`,
        [userId, source, String(referenceId)]
      );
      if (dup.rows[0]) {
        if (ownClient) await db.query('ROLLBACK');
        return { duplicate: true };
      }
    }

    if (orderId && source === 'order_delivered') {
      const dupOrder = await db.query(
        `SELECT id FROM reward_history
         WHERE user_id = $1 AND order_id = $2 AND source = 'order_delivered' AND transaction_type = 'earned'
         LIMIT 1`,
        [userId, orderId]
      );
      if (dupOrder.rows[0]) {
        if (ownClient) await db.query('ROLLBACK');
        return { duplicate: true };
      }
    }

    await loyaltyModel.ensureRewardsRow(userId, db);

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const balRes = await db.query(
      `UPDATE rewards SET
         points_balance = points_balance + $1,
         total_earned = total_earned + $1,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING points_balance`,
      [points, userId]
    );
    const balanceAfter = balRes.rows[0]?.points_balance || points;

    await db.query(
      `INSERT INTO reward_history (user_id, order_id, points, transaction_type, source, reference_id, expires_at)
       VALUES ($1, $2, $3, 'earned', $4, $5, $6)`,
      [userId, orderId, points, source, referenceId ? String(referenceId) : null, expiresAt]
    );

    await db.query(
      `INSERT INTO loyalty_ledger (user_id, delta, balance_after, source, reference_id, description, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, points, balanceAfter, source, referenceId ? String(referenceId) : null, description, expiresAt]
    );

    if (ownClient) await db.query('COMMIT');
    return { points, balance_after: balanceAfter, source };
  } catch (err) {
    if (ownClient) await db.query('ROLLBACK');
    throw err;
  } finally {
    if (ownClient) db.release();
  }
};

const debit = async ({
  userId,
  points,
  source,
  referenceId = null,
  description = null,
  orderId = null,
  client = null,
}) => {
  if (!userId || !points || points <= 0) return null;

  const db = client || (await pool.connect());
  const ownClient = !client;

  try {
    if (ownClient) await db.query('BEGIN');

    const { rows } = await db.query(
      `SELECT points_balance FROM rewards WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );
    const balance = rows[0]?.points_balance || 0;
    if (balance < points) {
      if (ownClient) await db.query('ROLLBACK');
      const err = new Error('Insufficient loyalty points');
      err.status = 400;
      throw err;
    }

    const balRes = await db.query(
      `UPDATE rewards SET
         points_balance = points_balance - $1,
         total_redeemed = total_redeemed + $1,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 RETURNING points_balance`,
      [points, userId]
    );
    const balanceAfter = balRes.rows[0]?.points_balance || 0;

    await db.query(
      `INSERT INTO reward_history (user_id, order_id, points, transaction_type, source, reference_id)
       VALUES ($1, $2, $3, 'redeemed', $4, $5)`,
      [userId, orderId, points, source, referenceId ? String(referenceId) : null]
    );

    await db.query(
      `INSERT INTO loyalty_ledger (user_id, delta, balance_after, source, reference_id, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, -points, balanceAfter, source, referenceId ? String(referenceId) : null, description]
    );

    if (ownClient) await db.query('COMMIT');
    return { points, balance_after: balanceAfter, source };
  } catch (err) {
    if (ownClient) await db.query('ROLLBACK');
    throw err;
  } finally {
    if (ownClient) db.release();
  }
};

const creditForOrderDelivered = async (order) => {
  if (!order?.user_id || !order?.id) return null;

  const rule = await loyaltyModel.getRule('order_delivered');
  const ratePer100 = Number(rule?.conditions?.rate_per_100 || 1);
  let points = Math.floor(Number(order.total_amount || 0) / 100) * ratePer100;

  const tier = await loyaltyModel.getUserTier(order.user_id);
  const multiplier = Number(rule?.multiplier || 1);
  if (tier?.current?.benefits?.extra_discount_percent) {
    /* tier bonus on earn: +10% for gold, +20% for platinum approx */
    const slug = tier.current.slug;
    if (slug === 'gold') points = Math.round(points * 1.1);
    else if (slug === 'platinum') points = Math.round(points * 1.2);
  }
  points = Math.round(points * multiplier);
  if (points <= 0) return null;

  const result = await credit({
    userId: order.user_id,
    points,
    source: 'order_delivered',
    referenceId: order.id,
    orderId: order.id,
    description: `Order #${String(order.id).slice(0, 8)} delivered`,
  });

  if (result?.duplicate) return result;

  const { rows: orderCount } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM orders
     WHERE user_id = $1 AND LOWER(status) = 'delivered'`,
    [order.user_id]
  );
  if (orderCount[0]?.cnt === 1) {
    const firstRule = await loyaltyModel.getRule('first_order');
    await credit({
      userId: order.user_id,
      points: Number(firstRule?.points || 200),
      source: 'first_order',
      referenceId: order.id,
      orderId: order.id,
      description: 'First order bonus',
    });
  }

  return result;
};

const creditDailyLogin = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const rule = await loyaltyModel.getRule('daily_login');
  return credit({
    userId,
    points: Number(rule?.points || 10),
    source: 'daily_login',
    referenceId: today,
    description: 'Daily login bonus',
  });
};

const creditReview = async (userId, reviewId) => {
  const rule = await loyaltyModel.getRule('review');
  return credit({
    userId,
    points: Number(rule?.points || 50),
    source: 'review',
    referenceId: reviewId,
    description: 'Review submitted',
  });
};

const creditBirthday = async (userId) => {
  const year = new Date().getFullYear();
  const rule = await loyaltyModel.getRule('birthday');
  return credit({
    userId,
    points: Number(rule?.points || 250),
    source: 'birthday',
    referenceId: `birthday:${year}`,
    description: 'Birthday reward',
  });
};

const creditCampaign = async (userId, campaignId, bonusPoints) => {
  const rule = await loyaltyModel.getRule('campaign');
  const base = bonusPoints || Number(rule?.points || 0);
  const pts = Math.round(base * Number(rule?.multiplier || 1.5)) || 50;
  return credit({
    userId,
    points: pts,
    source: 'campaign',
    referenceId: campaignId,
    description: 'Festival campaign bonus',
  });
};

const redeemAtCheckout = async (userId, pointsToRedeem, orderId = null, client = null) => {
  const discount = pointsToRedeem / loyaltyModel.POINTS_TO_RUPEE;
  const result = await debit({
    userId,
    points: pointsToRedeem,
    source: 'checkout_redemption',
    referenceId: orderId || `checkout:${Date.now()}`,
    orderId,
    description: `Redeemed ${pointsToRedeem} points at checkout`,
    client,
  });

  if (orderId && client) {
    await client.query(
      `INSERT INTO loyalty_redemptions (user_id, order_id, points_used, discount_amount, redemption_type)
       VALUES ($1, $2, $3, $4, 'points')`,
      [userId, orderId, pointsToRedeem, discount]
    );
  }

  return { ...result, discount_amount: discount };
};

const previewRedemption = (pointsToRedeem, subtotal) => {
  const minPoints = 100;
  if (pointsToRedeem < minPoints) {
    return { valid: false, message: `Minimum ${minPoints} points required` };
  }
  const discount = pointsToRedeem / loyaltyModel.POINTS_TO_RUPEE;
  if (discount > subtotal) {
    return {
      valid: true,
      discount_amount: subtotal,
      points_required: Math.ceil(subtotal * loyaltyModel.POINTS_TO_RUPEE),
      capped: true,
    };
  }
  return { valid: true, discount_amount: discount, points_required: pointsToRedeem };
};

module.exports = {
  credit,
  debit,
  creditForOrderDelivered,
  creditDailyLogin,
  creditReview,
  creditBirthday,
  creditCampaign,
  redeemAtCheckout,
  previewRedemption,
};
