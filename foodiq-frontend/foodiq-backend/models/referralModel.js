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

  // Credit referrer + referee welcome bonus
  await pool.query(
    `INSERT INTO rewards (user_id, points_balance, total_earned)
     VALUES ($1, $2, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       points_balance = rewards.points_balance + $2,
       total_earned = rewards.total_earned + $2`,
    [ref.user_id, points]
  );
  await pool.query(
    `INSERT INTO reward_history (user_id, points, transaction_type)
     VALUES ($1, $2, 'earned')`,
    [ref.user_id, points]
  ).catch(() => {});

  const refereeBonus = Math.round(points / 2);
  await pool.query(
    `INSERT INTO rewards (user_id, points_balance, total_earned)
     VALUES ($1, $2, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       points_balance = rewards.points_balance + $2,
       total_earned = rewards.total_earned + $2`,
    [refereeId, refereeBonus]
  );
  await pool.query(
    `INSERT INTO reward_history (user_id, points, transaction_type)
     VALUES ($1, $2, 'earned')`,
    [refereeId, refereeBonus]
  ).catch(() => {});

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
