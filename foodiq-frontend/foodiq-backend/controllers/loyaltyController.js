const loyaltyModel = require('../models/loyaltyModel');
const loyaltyEngine = require('../services/loyaltyEngine');
const { listReferralStats, getOrCreateReferralCode } = require('../models/referralModel');
const { getActiveCoupons } = require('../models/couponModel');

const ok = (res, message, data) => res.json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const getWallet = async (req, res) => {
  try {
    const wallet = await loyaltyModel.getWallet(req.user.id);
    ok(res, 'Loyalty wallet retrieved', wallet);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getMembership = async (req, res) => {
  try {
    const tier = await loyaltyModel.getUserTier(req.user.id);
    const benefits = tier.current?.benefits || {};
    ok(res, 'Membership retrieved', { ...tier, benefits });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getHistory = async (req, res) => {
  try {
    const [ledger, history] = await Promise.all([
      loyaltyModel.getLedger(req.user.id, { limit: Number(req.query.limit) || 50 }),
      loyaltyModel.getHistory(req.user.id, { limit: Number(req.query.limit) || 50 }),
    ]);
    ok(res, 'Loyalty history retrieved', { ledger, history });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getOverview = async (req, res) => {
  try {
    const [wallet, referral, coupons, history] = await Promise.all([
      loyaltyModel.getWallet(req.user.id),
      listReferralStats(req.user.id),
      getActiveCoupons(),
      loyaltyModel.getHistory(req.user.id, { limit: 20 }),
    ]);

    const tierSlug = wallet.tier?.current?.slug;
    const exclusiveCoupons = coupons.filter((c) => {
      if (tierSlug === 'platinum') return true;
      if (tierSlug === 'gold') return !String(c.code).startsWith('PLAT');
      return !String(c.code).startsWith('GOLD') && !String(c.code).startsWith('PLAT');
    });

    ok(res, 'Loyalty overview retrieved', {
      wallet,
      membership: wallet.tier,
      referral: {
        code: referral.code,
        reward_points: referral.reward_points,
        history: referral.history,
      },
      coupons: exclusiveCoupons.slice(0, 12),
      history,
      earn_rules: await loyaltyModel.listRules(),
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const redeemPoints = async (req, res) => {
  try {
    const { points_to_redeem } = req.body;
    const pts = Number(points_to_redeem);
    if (!pts || pts < 100) {
      return fail(res, 400, 'Minimum 100 points required to redeem');
    }

    const wallet = await loyaltyModel.getWallet(req.user.id);
    if (wallet.points_balance < pts) {
      return fail(res, 400, 'Insufficient points');
    }

    await loyaltyEngine.debit({
      userId: req.user.id,
      points: pts,
      source: 'manual_redeem',
      referenceId: `redeem:${Date.now()}`,
      description: 'Points redeemed for coupon',
    });

    const discountAmount = pts / loyaltyModel.POINTS_TO_RUPEE;
    const couponCode = `REWARD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { pool } = require('../config/db');
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { rows } = await pool.query(
      `INSERT INTO coupons (code, discount_amount, discount_type, min_order_amount, usage_limit, valid_until, is_active)
       VALUES ($1, $2, 'fixed', 199, 1, $3, TRUE) RETURNING *`,
      [couponCode, discountAmount, validUntil]
    );

    ok(res, 'Points redeemed successfully', { coupon: rows[0], discount_amount: discountAmount });
  } catch (error) {
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

const previewCheckout = async (req, res) => {
  try {
    const { subtotal = 0, points_to_redeem = 0, redemption_type = 'coupon' } = req.body;
    const wallet = await loyaltyModel.getWallet(req.user.id);
    const benefits = wallet.tier?.current?.benefits || {};

    let pointsPreview = null;
    if (redemption_type === 'points' && points_to_redeem > 0) {
      pointsPreview = loyaltyEngine.previewRedemption(Number(points_to_redeem), Number(subtotal));
    }

    let customerWallet = { balance: 0 };
    try {
      customerWallet = await require('../models/customerWalletModel').getWalletByUserId(req.user.id);
    } catch {
      /* ignore */
    }

    ok(res, 'Checkout preview retrieved', {
      wallet: {
        points_balance: wallet.points_balance,
        tier: wallet.tier.current,
        foodiq_balance: Number(customerWallet.balance || 0),
      },
      redemption_options: {
        coupon: { available: true, label: 'Use Coupon Code' },
        wallet: {
          available: Number(customerWallet.balance || 0) > 0,
          label: 'Foodiq Wallet',
          balance: Number(customerWallet.balance || 0),
          max_usable: Math.min(Number(customerWallet.balance || 0), Number(subtotal)),
        },
        points: {
          available: wallet.points_balance >= 100,
          label: 'Use Loyalty Points',
          rate: `10 points = ₹1`,
          max_redeemable: Math.min(wallet.points_balance, Math.floor(Number(subtotal) * loyaltyModel.POINTS_TO_RUPEE)),
          preview: pointsPreview,
        },
      },
      tier_benefits: benefits,
      free_delivery: benefits.free_delivery === true,
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const ensureReferral = async (req, res) => {
  try {
    const code = await getOrCreateReferralCode(req.user.id, req.user.full_name);
    ok(res, 'Referral code retrieved', code);
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getWallet,
  getMembership,
  getHistory,
  getOverview,
  redeemPoints,
  previewCheckout,
  ensureReferral,
};
