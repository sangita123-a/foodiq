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
       VALUES ($1, $2, $3, 'credited', $4)`,
      [ref.id, ref.user_id, refereeId, points]
    );
  } catch (err) {
    if (err.code === '23505') return { duplicate: true };
    throw err;
  }

  // Credit referrer + referee welcome bonus via loyalty engine
  const loyaltyEngine = require('../services/loyaltyEngine');
  const referralRule = await require('../models/loyaltyModel').getRule('referral');
  const welcomeRule = await require('../models/loyaltyModel').getRule('referral_welcome');

  await loyaltyEngine.credit({
    userId: ref.user_id,
    points: Number(referralRule?.points || points),
    source: 'referral',
    referenceId: refereeId,
    description: `Referral bonus for new customer`,
  });

  const refereeBonus = Number(welcomeRule?.points || Math.round(points / 2));
  await loyaltyEngine.credit({
    userId: refereeId,
    points: refereeBonus,
    source: 'referral_welcome',
    referenceId: ref.user_id,
    description: 'Welcome referral bonus',
  });

  return { referrer_id: ref.user_id, points, referee_bonus: refereeBonus, code: ref.code };
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
  return { code: code.code, reward_points: code.reward_points, history: rows };
};

module.exports = {
  getOrCreateReferralCode,
  applyReferralOnSignup,
  listReferralStats,
};
