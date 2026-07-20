const {
  getActiveCoupons,
  getCouponByCode,
  validateCoupon,
  getMyRewardsSummary,
  resolveCouponType,
} = require('../models/couponModel');
const { getCartByUserId, getCartItems } = require('../models/cartModel');
const { getOfferByCouponCode, validateOfferEligibility } = require('../models/offerModel');
const { validateRestaurantCoupon } = require('../models/liveDealModel');
const { listReferralStats } = require('../models/referralModel');
const { pool } = require('../config/db');

const getCoupons = async (req, res) => {
  try {
    const coupons = await getActiveCoupons();
    res.json({ success: true, message: 'Coupons retrieved', data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getMyCoupons = async (req, res) => {
  try {
    const summary = await getMyRewardsSummary(req.user.id);
    res.json({
      success: true,
      message: 'User coupons retrieved',
      data: {
        available: summary.available,
        saved: summary.saved,
        applied: summary.saved.filter((s) => s.status === 'applied'),
        expired: summary.expired,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getMyRewards = async (req, res) => {
  try {
    const [summary, referral] = await Promise.all([
      getMyRewardsSummary(req.user.id),
      listReferralStats(req.user.id),
    ]);
    res.json({
      success: true,
      message: 'My rewards retrieved',
      data: {
        available_coupons: summary.available,
        saved_coupons: summary.saved,
        coupon_history: summary.coupon_history,
        referral: {
          code: referral.code,
          reward_points: referral.reward_points,
          earnings: referral.earnings,
          history: referral.history,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const saveCoupon = async (req, res) => {
  try {
    const { coupon_id, code } = req.body;
    let coupon = null;
    if (coupon_id) {
      const { rows } = await pool.query('SELECT * FROM coupons WHERE id = $1', [coupon_id]);
      coupon = rows[0];
    } else if (code) {
      coupon = await getCouponByCode(String(code).toUpperCase());
    }
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found', error: {} });
    }
    const { rows } = await pool.query(
      `INSERT INTO user_coupons (user_id, coupon_id, status)
       VALUES ($1, $2, 'saved')
       ON CONFLICT (user_id, coupon_id) DO UPDATE SET status = 'saved'
       RETURNING *`,
      [req.user.id, coupon.id]
    );
    res.status(201).json({ success: true, message: 'Coupon saved', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required', error: {} });

    const coupon = await getCouponByCode(code.toUpperCase());
    const cart = await getCartByUserId(req.user.id);
    const items = cart ? await getCartItems(cart.id) : [];

    let subtotal = 0;
    items.forEach((item) => {
      const price = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
      subtotal += price * item.quantity;
    });

    const validation = await validateCoupon(coupon, req.user.id, subtotal, {
      skipCartCheck: items.length === 0,
    });
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message, error: {} });
    }

    const normalizedCode = code.toUpperCase();
    const linkedOffer = await getOfferByCouponCode(normalizedCode);
    if (linkedOffer && items.length > 0) {
      const eligibility = await validateOfferEligibility(linkedOffer, req.user.id, items, subtotal);
      if (!eligibility.valid) {
        return res.status(400).json({ success: false, message: eligibility.message, error: {} });
      }
    }

    if (items.length > 0) {
      const cartRestaurantId = items[0].restaurant_id;
      const restaurantCheck = await validateRestaurantCoupon(coupon.id, cartRestaurantId);
      if (!restaurantCheck.valid) {
        return res.status(400).json({ success: false, message: restaurantCheck.message, error: {} });
      }
    }

    await pool.query(
      `INSERT INTO user_coupons (user_id, coupon_id, status, applied_at)
       VALUES ($1, $2, 'applied', CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, coupon_id) DO UPDATE SET status = 'applied', applied_at = CURRENT_TIMESTAMP`,
      [req.user.id, coupon.id]
    );

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon_id: coupon.id,
        code: coupon.code,
        coupon_type: resolveCouponType(coupon),
        discount: validation.discount,
        free_delivery: validation.freeDelivery,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const removeCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;
    await pool.query(
      `UPDATE user_coupons SET status = 'saved', applied_at = NULL
       WHERE user_id = $1 AND coupon_id = $2`,
      [req.user.id, couponId]
    );
    res.json({ success: true, message: 'Coupon removed', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getCoupons,
  getMyCoupons,
  getMyRewards,
  saveCoupon,
  applyCoupon,
  removeCoupon,
};
