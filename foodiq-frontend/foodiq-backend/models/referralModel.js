const crypto = require('crypto');
const { pool } = require('../config/db');

const makeCode = (name = '') => {
  const base = String(name || 'FOOD')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 6)
    .toUpperCase() || 'FOOD';
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${base}${suffix}`;
};

const getOrCreateReferralCode = async (userId, fullName = '') => {
  const existing = await pool.query(
    `SELECT * FROM referral_codes WHERE user_id = $1`,
    [userId]
  );
  if (existing.rows[0]) return existing.rows[0];

  for (let i = 0; i < 5; i++) {
    const code = makeCode(fullName);
    try {
      const { rows } = await pool.query(
        `INSERT INTO referral_codes (user_id, code) VALUES ($1, $2) RETURNING *`,
        [userId, code]
      );
      return rows[0];
    } catch (err) {
      if (err.code !== '23505') throw err;
    }
  }
  throw new Error('Could not allocate referral code');
};

const applyReferralOnSignup = async ({ refereeId, code }) => {
  if (!code || !refereeId) return null;
  const { rows: codes } = await pool.query(
    `SELECT * FROM referral_codes WHERE UPPER(code) = UPPER($1)`,
    [String(code).trim()]
  );
  const ref = codes[0];
  if (!ref || ref.user_id === refereeId) return null;

  const points = Number(ref.reward_points) || 100;
  try {
    await pool.query(
      `INSERT INTO referral_redemptions
         (referral_code_id, referrer_id, referee_id, status, points_awarded)
       VALUES ($1, $2, $3, 'pending', $4)`,
      [ref.id, ref.user_id, refereeId, points]
    );
  } catch (err) {
    if (err.code === '23505') return { duplicate: true };
    throw err;
  }

  const loyaltyEngine = require('../services/loyaltyEngine');
  const welcomeRule = await require('../models/loyaltyModel').getRule('referral_welcome');
  const refereeBonus = Number(welcomeRule?.points || Math.round(points / 2));

  await loyaltyEngine.credit({
    userId: refereeId,
    points: refereeBonus,
    source: 'referral_welcome',
    referenceId: ref.user_id,
    description: 'Welcome referral bonus',
  });

  return {
    referrer_id: ref.user_id,
    points,
    referee_bonus: refereeBonus,
    code: ref.code,
    status: 'pending',
  };
};

const creditReferralOnFirstOrder = async (refereeId, orderId) => {
  const { rows } = await pool.query(
    `SELECT rr.*, rc.reward_points
     FROM referral_redemptions rr
     JOIN referral_codes rc ON rc.id = rr.referral_code_id
     WHERE rr.referee_id = $1 AND rr.status = 'pending'
     LIMIT 1`,
    [refereeId]
  );
  const redemption = rows[0];
  if (!redemption) return null;

  const { rows: orderCount } = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM orders
     WHERE user_id = $1 AND LOWER(status) = 'delivered'`,
    [refereeId]
  );
  if (orderCount[0]?.cnt !== 1) return null;

  const points = Number(redemption.reward_points || redemption.points_awarded) || 100;
  const loyaltyEngine = require('../services/loyaltyEngine');
  const referralRule = await require('../models/loyaltyModel').getRule('referral');

  const result = await loyaltyEngine.credit({
    userId: redemption.referrer_id,
    points: Number(referralRule?.points || points),
    source: 'referral',
    referenceId: refereeId,
    orderId,
    description: 'Referral bonus — friend completed first order',
  });

  if (result?.duplicate) return result;

  await pool.query(
    `UPDATE referral_redemptions
     SET status = 'credited', points_awarded = $1
     WHERE id = $2`,
    [Number(referralRule?.points || points), redemption.id]
  );

  try {
    const cashbackAmount = Math.round(Number(referralRule?.points || points) / 10);
    if (cashbackAmount > 0) {
      const { creditWallet } = require('../models/customerWalletModel');
      await creditWallet(redemption.referrer_id, cashbackAmount, {
        type: 'cashback',
        category: 'cashback',
        cashbackPortion: cashbackAmount,
        referenceType: 'referral',
        referenceId: refereeId,
        dedupeKey: `referral_cashback:${refereeId}`,
        note: 'Referral cashback — friend completed first order',
      });
    }
  } catch (cbErr) {
    console.warn('[referral] cashback credit skipped:', cbErr.message);
  }

  return {
    referrer_id: redemption.referrer_id,
    points: Number(referralRule?.points || points),
    order_id: orderId,
  };
};

const listReferralStats = async (userId) => {
  const code = await getOrCreateReferralCode(userId);
  const { rows } = await pool.query(
    `SELECT rr.*, u.full_name AS referee_name, u.email AS referee_email
     FROM referral_redemptions rr
     JOIN users u ON u.id = rr.referee_id
     WHERE rr.referrer_id = $1
     ORDER BY rr.created_at DESC
     LIMIT 50`,
    [userId]
  );

  const { rows: earnings } = await pool.query(
    `SELECT COALESCE(SUM(points_awarded), 0)::int AS total_points,
            COUNT(*) FILTER (WHERE status = 'credited')::int AS credited_count,
            COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count
     FROM referral_redemptions
     WHERE referrer_id = $1`,
    [userId]
  );

  return {
    code: code.code,
    reward_points: code.reward_points,
    history: rows,
    earnings: earnings[0] || { total_points: 0, credited_count: 0, pending_count: 0 },
  };
};

module.exports = {
  getOrCreateReferralCode,
  applyReferralOnSignup,
  creditReferralOnFirstOrder,
  listReferralStats,
};
