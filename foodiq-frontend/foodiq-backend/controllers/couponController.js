const { getActiveCoupons, getCouponByCode, getCouponUsageCount } = require('../models/couponModel');
const { getCartByUserId, getCartItems } = require('../models/cartModel');
const { getOfferByCouponCode, validateOfferEligibility } = require('../models/offerModel');
const { validateRestaurantCoupon } = require('../models/liveDealModel');
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
    const available = await getActiveCoupons();
    const { rows: saved } = await pool.query(
      `SELECT uc.*, c.code, c.discount_amount, c.discount_type, c.min_order_amount, c.valid_until, c.is_active
       FROM user_coupons uc
       JOIN coupons c ON uc.coupon_id = c.id
       WHERE uc.user_id = $1
       ORDER BY uc.created_at DESC`,
      [req.user.id]
    );
    const expired = available.filter(
      (c) => c.valid_until && new Date(c.valid_until) < new Date()
    );
    res.json({
      success: true,
      message: 'User coupons retrieved',
      data: {
        available: available.filter((c) => !c.valid_until || new Date(c.valid_until) >= new Date()),
        saved,
        applied: saved.filter((s) => s.status === 'applied'),
        expired: [...expired, ...saved.filter((s) => s.status === 'expired')],
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
    if (!coupon || !coupon.is_active) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive coupon', error: {} });
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return res.status(400).json({ success: false, message: 'Coupon is not yet valid', error: {} });
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return res.status(400).json({ success: false, message: 'Coupon has expired', error: {} });
    }

    if (coupon.usage_limit) {
      const usageCount = await getCouponUsageCount(coupon.id, req.user.id);
      if (usageCount >= coupon.usage_limit) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached', error: {} });
      }
    }

    const cart = await getCartByUserId(req.user.id);
    const items = await getCartItems(cart.id);

    let subtotal = 0;
    items.forEach((item) => {
      const price = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
      subtotal += price * item.quantity;
    });

    if (items.length > 0 && subtotal < parseFloat(coupon.min_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.min_order_amount} required`,
        error: {},
      });
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

    let discount = 0;
    const isFreeDelivery = normalizedCode === 'FREEDEL';
    if (!isFreeDelivery) {
      if (coupon.discount_type === 'percentage') {
        discount = subtotal * (parseFloat(coupon.discount_amount) / 100);
        if (coupon.max_discount_amount && discount > parseFloat(coupon.max_discount_amount)) {
          discount = parseFloat(coupon.max_discount_amount);
        }
      } else {
        discount = parseFloat(coupon.discount_amount);
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
        discount: parseFloat(discount.toFixed(2)),
        free_delivery: isFreeDelivery,
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

module.exports = { getCoupons, getMyCoupons, saveCoupon, applyCoupon, removeCoupon };
