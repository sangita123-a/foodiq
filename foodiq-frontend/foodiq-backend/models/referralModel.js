const { pool } = require('../config/db');

class ReferralModel {
  /**
   * Ensure partner has a unique referral code.
   */
  static async getOrCreateReferralCode(partnerId) {
    // Check existing referral record where partner is referrer
    const existing = await pool.query(
      `SELECT referral_code FROM delivery_referrals WHERE referrer_partner_id = $1 LIMIT 1`,
      [partnerId]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].referral_code;
    }

    // Generate unique code FDQ-AB1234
    let code = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `FDQ-${randomPart}`;

      const check = await pool.query(
        `SELECT id FROM delivery_referrals WHERE referral_code = $1`,
        [code]
      );
      if (check.rows.length === 0) {
        isUnique = true;
      }
      attempts++;
    }

    // Settings for reward amount
    const settingsRes = await pool.query(
      `SELECT default_reward_amount, reward_type FROM delivery_referral_settings LIMIT 1`
    );
    const rewardAmount = settingsRes.rows[0]?.default_reward_amount || 500.0;
    const rewardType = settingsRes.rows[0]?.reward_type || 'cash';

    // Insert master placeholder for this partner's referral code
    await pool.query(
      `INSERT INTO delivery_referrals (referrer_partner_id, referral_code, status, reward_amount, reward_type)
       VALUES ($1, $2, 'pending', $3, $4)
       ON CONFLICT (referral_code) DO NOTHING`,
      [partnerId, code, rewardAmount, rewardType]
    );

    return code;
  }

  /**
   * Register a new referred delivery partner using a referral code
   */
  static async createReferralRecord(referrerPartnerId, referredPartnerId, code) {
    const settingsRes = await pool.query(
      `SELECT default_reward_amount, reward_type FROM delivery_referral_settings LIMIT 1`
    );
    const rewardAmount = settingsRes.rows[0]?.default_reward_amount || 500.0;
    const rewardType = settingsRes.rows[0]?.reward_type || 'cash';

    const query = `
      INSERT INTO delivery_referrals (
        referrer_partner_id,
        referred_partner_id,
        referral_code,
        status,
        reward_amount,
        reward_type,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'registered', $4, $5, NOW(), NOW())
      RETURNING *;
    `;
    const res = await pool.query(query, [
      referrerPartnerId,
      referredPartnerId,
      code,
      rewardAmount,
      rewardType,
    ]);
    return res.rows[0];
  }

  /**
   * Find referral record by referred partner ID
   */
  static async findByReferredId(referredPartnerId) {
    const res = await pool.query(
      `SELECT * FROM delivery_referrals WHERE referred_partner_id = $1 LIMIT 1`,
      [referredPartnerId]
    );
    return res.rows[0] || null;
  }

  /**
   * Find referral by referral code
   */
  static async findByCode(code) {
    const res = await pool.query(
      `SELECT * FROM delivery_referrals WHERE referral_code = $1 AND referred_partner_id IS NULL LIMIT 1`,
      [code]
    );
    return res.rows[0] || null;
  }

  /**
   * Update referral status
   */
  static async updateStatus(id, status) {
    const res = await pool.query(
      `UPDATE delivery_referrals SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return res.rows[0];
  }

  /**
   * Get referral stats & list for delivery partner
   */
  static async getPartnerReferralSummary(partnerId) {
    const code = await this.getOrCreateReferralCode(partnerId);

    const historyRes = await pool.query(
      `SELECT r.*, dp.full_name as referred_name, dp.phone_number as referred_phone, dp.created_at as registered_at
       FROM delivery_referrals r
       LEFT JOIN delivery_partners dp ON r.referred_partner_id = dp.id
       WHERE r.referrer_partner_id = $1 AND r.referred_partner_id IS NOT NULL
       ORDER BY r.created_at DESC`,
      [partnerId]
    );

    const rewardsRes = await pool.query(
      `SELECT rw.*, r.referral_code, dp.full_name as referred_name
       FROM delivery_referral_rewards rw
       JOIN delivery_referrals r ON rw.referral_id = r.id
       LEFT JOIN delivery_partners dp ON r.referred_partner_id = dp.id
       WHERE rw.partner_id = $1
       ORDER BY rw.created_at DESC`,
      [partnerId]
    );

    const settings = await pool.query(`SELECT default_reward_amount FROM delivery_referral_settings LIMIT 1`);
    const defaultReward = Number(settings.rows[0]?.default_reward_amount || 500);

    const history = historyRes.rows;
    const rewards = rewardsRes.rows;

    const totalReferrals = history.length;
    const pendingReferrals = history.filter((item) => item.status !== 'rewarded' && item.status !== 'expired').length;
    const completedReferrals = history.filter((item) => item.status === 'rewarded').length;
    const totalEarned = rewards
      .filter((rw) => rw.status === 'credited')
      .reduce((sum, rw) => sum + Number(rw.amount), 0);

    // Leaderboard calculation
    const leaderboardRes = await pool.query(
      `SELECT r.referrer_partner_id as partner_id, dp.full_name, COUNT(r.id) as completed_count, COALESCE(SUM(r.reward_amount), 0) as total_earned
       FROM delivery_referrals r
       JOIN delivery_partners dp ON r.referrer_partner_id = dp.id
       WHERE r.status = 'rewarded'
       GROUP BY r.referrer_partner_id, dp.full_name
       ORDER BY completed_count DESC, total_earned DESC
       LIMIT 10`
    );

    let leaderboardPosition = 1;
    const leaderboard = leaderboardRes.rows.map((row, index) => {
      if (row.partner_id === partnerId) {
        leaderboardPosition = index + 1;
      }
      return {
        rank: index + 1,
        partner_id: row.partner_id,
        full_name: row.full_name,
        completed_count: Number(row.completed_count),
        total_earned: Number(row.total_earned),
      };
    });

    return {
      referral_code: code,
      default_reward_amount: defaultReward,
      stats: {
        total_referrals: totalReferrals,
        pending_referrals: pendingReferrals,
        completed_referrals: completedReferrals,
        total_earned: totalEarned,
        leaderboard_position: leaderboardPosition,
      },
      history,
      rewards,
      leaderboard,
    };
  }

  /**
   * Create reward record
   */
  static async createReward(partnerId, referralId, amount, walletTxId, status = 'credited') {
    const res = await pool.query(
      `INSERT INTO delivery_referral_rewards (partner_id, referral_id, amount, wallet_transaction_id, status, credited_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [partnerId, referralId, amount, walletTxId, status, status === 'credited' ? new Date() : null]
    );
    return res.rows[0];
  }

  /**
   * Admin: Get all referrals with pagination & filters
   */
  static async getAdminReferrals({ status, search, limit = 50, offset = 0 }) {
    let whereClause = `WHERE r.referred_partner_id IS NOT NULL`;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      whereClause += ` AND r.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      const pIdx = params.length;
      whereClause += ` AND (r.referral_code ILIKE $${pIdx} OR dp1.full_name ILIKE $${pIdx} OR dp2.full_name ILIKE $${pIdx} OR dp2.phone_number ILIKE $${pIdx})`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM delivery_referrals r
       LEFT JOIN delivery_partners dp1 ON r.referrer_partner_id = dp1.id
       LEFT JOIN delivery_partners dp2 ON r.referred_partner_id = dp2.id
       ${whereClause}`,
      params
    );

    params.push(limit, offset);
    const dataRes = await pool.query(
      `SELECT r.*,
              dp1.full_name as referrer_name, dp1.phone_number as referrer_phone,
              dp2.full_name as referred_name, dp2.phone_number as referred_phone, dp2.status as referred_partner_status, dp2.is_verified as referred_kyc_approved,
              rw.id as reward_id, rw.status as reward_status, rw.credited_at
       FROM delivery_referrals r
       LEFT JOIN delivery_partners dp1 ON r.referrer_partner_id = dp1.id
       LEFT JOIN delivery_partners dp2 ON r.referred_partner_id = dp2.id
       LEFT JOIN delivery_referral_rewards rw ON rw.referral_id = r.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const statsRes = await pool.query(
      `SELECT
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered_count,
        COUNT(CASE WHEN status = 'kyc_completed' THEN 1 END) as kyc_completed_count,
        COUNT(CASE WHEN status = 'first_delivery_completed' THEN 1 END) as first_delivery_count,
        COUNT(CASE WHEN status = 'rewarded' THEN 1 END) as rewarded_count,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
        COALESCE(SUM(CASE WHEN status = 'rewarded' THEN reward_amount ELSE 0 END), 0) as total_payout
       FROM delivery_referrals WHERE referred_partner_id IS NOT NULL`
    );

    return {
      total: parseInt(countRes.rows[0].count, 10),
      referrals: dataRes.rows,
      stats: statsRes.rows[0],
    };
  }

  /**
   * Admin settings
   */
  static async getSettings() {
    const res = await pool.query(`SELECT * FROM delivery_referral_settings LIMIT 1`);
    return res.rows[0] || {
      default_reward_amount: 500.00,
      reward_type: 'cash',
      expiry_days: 30,
      min_deliveries_required: 1,
      auto_credit_enabled: true
    };
  }

  static async updateSettings({ default_reward_amount, reward_type, expiry_days, min_deliveries_required, auto_credit_enabled }) {
    const current = await this.getSettings();
    const res = await pool.query(
      `UPDATE delivery_referral_settings
       SET default_reward_amount = $1,
           reward_type = $2,
           expiry_days = $3,
           min_deliveries_required = $4,
           auto_credit_enabled = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        default_reward_amount ?? current.default_reward_amount,
        reward_type ?? current.reward_type,
        expiry_days ?? current.expiry_days,
        min_deliveries_required ?? current.min_deliveries_required,
        auto_credit_enabled ?? current.auto_credit_enabled,
        current.id,
      ]
    );
    return res.rows[0];
  }
}

module.exports = ReferralModel;
