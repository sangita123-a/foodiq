const ReferralModel = require('../models/referralModel');
const { pool } = require('../config/db');
const { emitReferralUpdate, emitRewardCredited, emitAdminReferralNew } = require('../socket/emitters');

class ReferralService {
  /**
   * Automatically generate referral code for a newly registered or existing delivery partner.
   */
  static async ensurePartnerReferralCode(partnerId) {
    return await ReferralModel.getOrCreateReferralCode(partnerId);
  }

  /**
   * Process referral code entry when a new delivery partner registers.
   */
  static async processReferralRegistration(referredPartnerId, referralCode) {
    if (!referralCode) return null;

    const formattedCode = String(referralCode).trim().toUpperCase();

    // Find referrer by referral code
    const referrerRes = await pool.query(
      `SELECT referrer_partner_id FROM delivery_referrals WHERE referral_code = $1 LIMIT 1`,
      [formattedCode]
    );

    if (referrerRes.rows.length === 0) {
      console.warn(`[REFERRAL] Invalid referral code entered: ${formattedCode}`);
      return null;
    }

    const referrerPartnerId = referrerRes.rows[0].referrer_partner_id;

    // Prevent self-referral
    if (referrerPartnerId === referredPartnerId) {
      console.warn(`[REFERRAL] Self referral attempt blocked for partner: ${referredPartnerId}`);
      return null;
    }

    // Check if referral already exists
    const existing = await ReferralModel.findByReferredId(referredPartnerId);
    if (existing) {
      return existing;
    }

    const referral = await ReferralModel.createReferralRecord(
      referrerPartnerId,
      referredPartnerId,
      formattedCode
    );

    // Notify Referrer and Admin
    await this.createNotification(
      referrerPartnerId,
      'Referral Registered!',
      `A new delivery partner registered using your referral code (${formattedCode}).`,
      'referral_registered'
    );

    emitReferralUpdate(referrerPartnerId, {
      type: 'referral_registered',
      referral_id: referral.id,
      status: 'registered',
    });

    emitAdminReferralNew({
      referral_id: referral.id,
      referrer_partner_id: referrerPartnerId,
      referred_partner_id: referredPartnerId,
      code: formattedCode,
    });

    return referral;
  }

  /**
   * Check eligibility and transition status when Referred Partner KYC is approved
   */
  static async handleKycApproved(referredPartnerId) {
    const referral = await ReferralModel.findByReferredId(referredPartnerId);
    if (!referral) return null;

    if (referral.status === 'registered' || referral.status === 'pending') {
      const updated = await ReferralModel.updateStatus(referral.id, 'kyc_completed');

      await this.createNotification(
        referral.referrer_partner_id,
        'Referral Update: KYC Approved',
        `Your referred partner has completed KYC verification!`,
        'kyc_completed'
      );

      emitReferralUpdate(referral.referrer_partner_id, {
        type: 'referral_kyc_completed',
        referral_id: referral.id,
        status: 'kyc_completed',
      });

      // Re-evaluate eligibility for reward
      await this.evaluateAndCreditReward(referral.id);

      return updated;
    }

    return referral;
  }

  /**
   * Check eligibility and transition status when Referred Partner completes first delivery
   */
  static async handleFirstDeliveryCompleted(referredPartnerId) {
    const referral = await ReferralModel.findByReferredId(referredPartnerId);
    if (!referral) return null;

    if (
      referral.status === 'kyc_completed' ||
      referral.status === 'registered' ||
      referral.status === 'pending'
    ) {
      const updated = await ReferralModel.updateStatus(referral.id, 'first_delivery_completed');

      await this.createNotification(
        referral.referrer_partner_id,
        'Referral Update: First Delivery Done',
        `Your referred partner has successfully completed their first delivery!`,
        'first_delivery_completed'
      );

      emitReferralUpdate(referral.referrer_partner_id, {
        type: 'referral_first_delivery',
        referral_id: referral.id,
        status: 'first_delivery_completed',
      });

      // Re-evaluate eligibility and credit reward
      await this.evaluateAndCreditReward(referral.id);

      return updated;
    }

    return referral;
  }

  /**
   * Core Business Rule Evaluator & Reward Creditor
   * Requirements:
   * 1. Partner Registered
   * 2. KYC Approved (is_verified = true, status = 'approved')
   * 3. First Delivery Completed (orders_completed >= 1)
   * 4. No Active Fraud Flags (risk_score < 70 & not suspended/blocked)
   * 5. Account Active (status = 'approved')
   */
  static async evaluateAndCreditReward(referralId) {
    const res = await pool.query(
      `SELECT r.*,
              dp1.status as referrer_status, dp1.is_verified as referrer_verified,
              dp2.status as referred_status, dp2.is_verified as referred_verified
       FROM delivery_referrals r
       JOIN delivery_partners dp1 ON r.referrer_partner_id = dp1.id
       JOIN delivery_partners dp2 ON r.referred_partner_id = dp2.id
       WHERE r.id = $1 LIMIT 1`,
      [referralId]
    );

    if (res.rows.length === 0) return { eligible: false, reason: 'Referral not found' };

    const referral = res.rows[0];

    // Already rewarded or expired
    if (referral.status === 'rewarded') {
      return { eligible: false, reason: 'Already rewarded' };
    }
    if (referral.status === 'expired') {
      return { eligible: false, reason: 'Referral expired' };
    }

    // Check Referred Partner KYC
    const isKycApproved = referral.referred_status === 'approved' && referral.referred_verified;

    // Check Referred Partner completed deliveries
    const deliveryCheck = await pool.query(
      `SELECT COUNT(*) as count FROM orders WHERE delivery_partner_id = $1 AND status = 'Delivered'`,
      [referral.referred_partner_id]
    );
    const completedCount = parseInt(deliveryCheck.rows[0]?.count || 0, 10);
    const settings = await ReferralModel.getSettings();
    const minDeliveries = settings.min_deliveries_required || 1;
    const isFirstDeliveryDone = completedCount >= minDeliveries;

    // Check Fraud / Risk Status
    let hasFraudFlags = false;
    try {
      const fraudCheck = await pool.query(
        `SELECT risk_score, is_blocked, is_suspended FROM delivery_fraud_status WHERE partner_id = $1 LIMIT 1`,
        [referral.referrer_partner_id]
      );
      if (fraudCheck.rows.length > 0) {
        const f = fraudCheck.rows[0];
        if (f.is_blocked || f.is_suspended || f.risk_score >= 70) {
          hasFraudFlags = true;
        }
      }
    } catch (e) {
      // Table may be optional or empty
    }

    // Check Account Active
    const isReferrerActive = referral.referrer_status === 'approved';

    const isEligible =
      isKycApproved &&
      isFirstDeliveryDone &&
      !hasFraudFlags &&
      isReferrerActive &&
      referral.status === 'first_delivery_completed';

    if (!isEligible) {
      const reasons = [];
      if (!isKycApproved) reasons.push('KYC Not Approved');
      if (!isFirstDeliveryDone) reasons.push(`Deliveries < ${minDeliveries}`);
      if (hasFraudFlags) reasons.push('Active Fraud / Risk Flags');
      if (!isReferrerActive) reasons.push('Referrer Account Not Active');
      if (referral.status !== 'first_delivery_completed') reasons.push('First Delivery Stage Pending');

      return { eligible: false, reasons };
    }

    // Process Reward & Credit Wallet
    const amount = Number(referral.reward_amount || settings.default_reward_amount || 500);

    // Create Wallet Transaction
    let walletTxId = null;
    try {
      // 1. Update delivery_partners balance
      await pool.query(
        `UPDATE delivery_partners SET wallet_balance = wallet_balance + $1, updated_at = NOW() WHERE id = $2`,
        [amount, referral.referrer_partner_id]
      );

      // 2. Update delivery_wallets table
      await pool.query(
        `INSERT INTO delivery_wallets (partner_id, available_balance, lifetime_earnings, created_at, updated_at)
         VALUES ($1, $2, $2, NOW(), NOW())
         ON CONFLICT (partner_id) DO UPDATE SET
           available_balance = delivery_wallets.available_balance + EXCLUDED.available_balance,
           lifetime_earnings = delivery_wallets.lifetime_earnings + EXCLUDED.lifetime_earnings,
           updated_at = NOW()`,
        [referral.referrer_partner_id, amount]
      );

      // 3. Record transaction in delivery_transactions
      const txRes = await pool.query(
        `INSERT INTO delivery_transactions (partner_id, type, amount, description, status, created_at)
         VALUES ($1, 'credit', $2, $3, 'completed', NOW())
         RETURNING id`,
        [referral.referrer_partner_id, amount, `Referral reward for code ${referral.referral_code}`]
      );

      if (txRes && txRes.rows.length > 0) {
        walletTxId = txRes.rows[0].id;
      }
    } catch (err) {
      console.error('[REFERRAL] Wallet credit error:', err.message);
    }

    // Update Referral & Reward Records
    await ReferralModel.updateStatus(referralId, 'rewarded');
    const rewardRecord = await ReferralModel.createReward(
      referral.referrer_partner_id,
      referralId,
      amount,
      walletTxId,
      'credited'
    );

    // Create Notification
    await this.createNotification(
      referral.referrer_partner_id,
      'Referral Reward Credited! ₹' + amount,
      `Congratulations! You have received ₹${amount} referral bonus credited directly to your wallet.`,
      'reward_credited'
    );

    // Socket Emissions
    emitRewardCredited(referral.referrer_partner_id, {
      referral_id: referralId,
      amount,
      status: 'credited',
      reward_id: rewardRecord.id,
    });

    emitReferralUpdate(referral.referrer_partner_id, {
      type: 'referral_rewarded',
      referral_id: referralId,
      status: 'rewarded',
      amount,
    });

    return { eligible: true, referral_id: referralId, amount };
  }

  /**
   * Helper: In-App Delivery Notification creation
   */
  static async createNotification(partnerId, title, message, type) {
    try {
      const dn = require('../models/deliveryNotificationModel');
      await dn.createNotification({
        partnerId,
        type,
        title,
        message,
        actionUrl: '/delivery/referrals',
      });
    } catch (e) {
      try {
        await pool.query(
          `INSERT INTO delivery_notifications (partner_id, title, message, type, is_read, created_at)
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          [partnerId, title, message, type]
        );
      } catch (err2) {
        /* ignore */
      }
    }
  }

  /**
   * Share metadata builder
   */
  static getSharePayload(referralCode, platform = 'whatsapp') {
    const text = `Join Foodiq Delivery Team using my referral code ${referralCode} and earn up to ₹500 bonus! Download app or sign up here: https://foodiq.app/delivery/register?ref=${referralCode}`;
    const encodedText = encodeURIComponent(text);

    let shareUrl = '';
    if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    } else if (platform === 'telegram') {
      shareUrl = `https://t.me/share/url?url=${encodeURIComponent('https://foodiq.app/delivery/register?ref=' + referralCode)}&text=${encodedText}`;
    } else if (platform === 'email') {
      shareUrl = `mailto:?subject=${encodeURIComponent('Join Foodiq Delivery & Earn ₹500 Bonus')}&body=${encodedText}`;
    } else {
      shareUrl = `https://foodiq.app/delivery/register?ref=${referralCode}`;
    }

    return { referralCode, platform, text, shareUrl };
  }
}

module.exports = ReferralService;
