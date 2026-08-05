const { pool } = require('../config/db');

const generateUniqueCode = async (fullName) => {
  const base = String(fullName || '')
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 6)
    .toUpperCase() || 'FOODIQ';

  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const code = `${base}${suffix}`;
    const { rows } = await pool.query('SELECT 1 FROM referral_codes WHERE code = $1', [code]);
    if (rows.length === 0) return code;
  }
  return `REF${Date.now().toString(36).toUpperCase()}`;
};

const getOrCreateReferralCode = async (userId, fullName) => {
  const existing = await pool.query(
    'SELECT code, reward_points FROM referral_codes WHERE user_id = $1',
    [userId]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const code = await generateUniqueCode(fullName);
  const { rows } = await pool.query(
    `INSERT INTO referral_codes (user_id, code)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING code, reward_points`,
    [userId, code]
  );
  return rows[0];
};

const getReferralEarnings = async (userId) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(points_awarded), 0)::int AS total_points,
            COUNT(*)::int AS referral_count
     FROM referral_redemptions
     WHERE referrer_id = $1 AND status = 'credited'`,
    [userId]
  );
  return {
    total_points: rows[0]?.total_points || 0,
    referral_count: rows[0]?.referral_count || 0,
  };
};

const getReferralHistory = async (userId, limit = 50) => {
  const { rows } = await pool.query(
    `SELECT rr.id, rr.status, rr.points_awarded, rr.created_at,
            u.full_name AS referee_name
     FROM referral_redemptions rr
     LEFT JOIN users u ON u.id = rr.referee_id
     WHERE rr.referrer_id = $1
     ORDER BY rr.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
};

const redeemReferralCode = async ({ code, refereeId }) => {
  if (!code || !refereeId) return null;
  const normalizedCode = String(code).trim().toUpperCase();

  const { rows: codeRows } = await pool.query(
    'SELECT id, user_id, reward_points FROM referral_codes WHERE UPPER(code) = $1',
    [normalizedCode]
  );
  const referralCode = codeRows[0];
  if (!referralCode || referralCode.user_id === refereeId) return null;

  const { rows } = await pool.query(
    `INSERT INTO referral_redemptions (referral_code_id, referrer_id, referee_id, status, points_awarded)
     VALUES ($1, $2, $3, 'credited', $4)
     ON CONFLICT (referee_id) DO NOTHING
     RETURNING *`,
    [referralCode.id, referralCode.user_id, refereeId, referralCode.reward_points]
  );
  const redemption = rows[0];
  if (!redemption) return null;

  const loyaltyEngine = require('./loyaltyEngine');
  await loyaltyEngine.credit({
    userId: referralCode.user_id,
    points: referralCode.reward_points,
    source: 'referral',
    referenceId: redemption.id,
    description: 'Referral bonus for inviting a new user',
  });

  return redemption;
};

const listReferralStats = async (userId, fullName) => {
  const [{ code, reward_points }, earnings, history] = await Promise.all([
    getOrCreateReferralCode(userId, fullName),
    getReferralEarnings(userId),
    getReferralHistory(userId),
  ]);
  return {
    code,
    reward_points,
    earnings: earnings.total_points,
    referral_count: earnings.referral_count,
    history,
  };
};

module.exports = {
  getOrCreateReferralCode,
  redeemReferralCode,
  listReferralStats,
  getReferralEarnings,
  getReferralHistory,
};
