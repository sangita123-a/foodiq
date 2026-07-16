const { pool } = require('../config/db');
const { getCartByUserId, getCartItems } = require('../models/cartModel');
const { getAddressById } = require('../models/addressModel');
const { getCouponByCode, getCouponUsageCount, recordCouponUsage } = require('../models/couponModel');
const {
  getOfferByCouponCode,
  validateOfferEligibility,
  recordOfferUsage,
  recordCouponHistory,
} = require('../models/offerModel');
const { validateRestaurantCoupon } = require('../models/liveDealModel');

const checkout = async (req, res) => {
  const client = await pool.connect();
  try {
    const { address_id, coupon_code, delivery_instructions } = req.body;
    if (!address_id) {
      return res.status(400).json({ success: false, message: 'Address ID is required', error: {} });
    }

    await client.query('BEGIN'); // Start transaction

    // 1. Validate Cart
    const cart = await getCartByUserId(req.user.id);
    const items = await getCartItems(cart.id);
    
    if (items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Cart is empty', error: {} });
    }

    // We assume all items belong to the same restaurant_id for the order
    const restaurantId = items[0].restaurant_id;

    let subtotal = 0;
    items.forEach(item => {
      const price = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
      subtotal += price * item.quantity;
    });

    // 2. Validate Address
    const address = await getAddressById(address_id, req.user.id);
    if (!address) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid address', error: {} });
    }

    // 3. Validate and calculate Coupon
    let discount = 0;
    let couponId = null;
    let offerId = null;
    let normalizedCode = null;

    if (coupon_code) {
      normalizedCode = String(coupon_code).trim().toUpperCase();
      const coupon = await getCouponByCode(normalizedCode);
      
      if (!coupon || !coupon.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Invalid or inactive coupon', error: {} });
      }

      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Coupon is not yet valid', error: {} });
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Coupon has expired', error: {} });
      }
      
      if (coupon.usage_limit) {
        const usageCount = await getCouponUsageCount(coupon.id, req.user.id);
        if (usageCount >= coupon.usage_limit) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: 'Coupon usage limit reached', error: {} });
        }
      }

      if (subtotal < parseFloat(coupon.min_order_amount)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Minimum order amount of ₹${coupon.min_order_amount} required`, error: {} });
      }

      if (normalizedCode !== 'FREEDEL') {
        if (coupon.discount_type === 'percentage') {
          discount = subtotal * (parseFloat(coupon.discount_amount) / 100);
          if (coupon.max_discount_amount && discount > parseFloat(coupon.max_discount_amount)) {
            discount = parseFloat(coupon.max_discount_amount);
          }
        } else {
          discount = parseFloat(coupon.discount_amount);
        }
      }
      couponId = coupon.id;

      const linkedOffer = await getOfferByCouponCode(normalizedCode);
      if (linkedOffer) {
        const eligibility = await validateOfferEligibility(linkedOffer, req.user.id, items, subtotal);
        if (!eligibility.valid) {
          await client.query('ROLLBACK');
          return res.status(400).json({ success: false, message: eligibility.message, error: {} });
        }
        offerId = linkedOffer.id;
      }

      const restaurantCheck = await validateRestaurantCoupon(couponId, restaurantId);
      if (!restaurantCheck.valid) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: restaurantCheck.message, error: {} });
      }
    }

    // 4. Calculate Final Amount
    let deliveryCharge = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
    if (normalizedCode === 'FREEDEL' && couponId) {
      deliveryCharge = 0;
    }
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + deliveryCharge + tax - discount;

    // 5. Create Order
    const orderQuery = `
      INSERT INTO orders (user_id, restaurant_id, delivery_address_id, coupon_id, offer_id, status, subtotal, discount_amount, delivery_fee, total_amount, delivery_instructions)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const orderValues = [
      req.user.id,
      restaurantId,
      address_id,
      couponId,
      offerId,
      'pending',
      subtotal,
      discount,
      deliveryCharge,
      totalAmount,
      delivery_instructions || null,
    ];
    
    const { rows: orderRows } = await client.query(orderQuery, orderValues);
    const newOrder = orderRows[0];

    // 6. Move cart_items to order_items
    for (const item of items) {
      const priceAtTime = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [newOrder.id, item.menu_item_id, item.quantity, priceAtTime]
      );
    }

    // 7. Record Coupon / Offer Usage (if any)
    if (couponId) {
      await recordCouponUsage(couponId, req.user.id, newOrder.id, client);
      await recordCouponHistory(
        {
          userId: req.user.id,
          couponId,
          offerId,
          orderId: newOrder.id,
          couponCode: normalizedCode,
          discountAmount: discount,
          finalPrice: totalAmount,
        },
        client
      );
    }
    if (offerId) {
      await recordOfferUsage(offerId, req.user.id, newOrder.id, discount, client);
    }

    // 8. Clear Cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Checkout successful, order created pending payment',
      data: {
        order_id: newOrder.id,
        summary: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          discount: parseFloat(discount.toFixed(2)),
          delivery_charge: parseFloat(deliveryCharge.toFixed(2)),
          tax: parseFloat(tax.toFixed(2)),
          grand_total: parseFloat(totalAmount.toFixed(2)),
          estimated_delivery_minutes: 30,
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error during checkout', error: error.message });
  } finally {
    client.release();
  }
};

module.exports = { checkout };
