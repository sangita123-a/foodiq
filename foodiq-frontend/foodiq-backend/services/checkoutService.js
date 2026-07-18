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
const { createPaymentRecord } = require('../models/paymentModel');
const { pool } = require('../config/db');

const ALLOWED_PAYMENT_METHODS = [
  'cod',
  'upi',
  'credit_card',
  'debit_card',
  'razorpay',
  'wallet',
  'net_banking',
];

const normalizePaymentMethod = (method) => {
  if (!method) return null;
  const map = {
    upi: 'upi',
    UPI: 'upi',
    card: 'credit_card',
    'Credit Card': 'credit_card',
    'Credit/Debit Card': 'credit_card',
    credit_card: 'credit_card',
    debit_card: 'debit_card',
    'Debit Card': 'debit_card',
    razorpay: 'razorpay',
    Razorpay: 'razorpay',
    wallet: 'wallet',
    Wallet: 'wallet',
    cod: 'cod',
    cash: 'cod',
    'Cash on Delivery': 'cod',
    net_banking: 'net_banking',
    'Net Banking': 'net_banking',
  };
  const normalized = map[method] || String(method).toLowerCase().replace(/\s+/g, '_');
  return ALLOWED_PAYMENT_METHODS.includes(normalized) ? normalized : null;
};

const isOnlineMethod = (method) => method && method !== 'cod';

/**
 * Validates cart + pricing for checkout. Does not create an order.
 */
const prepareCheckout = async (userId, body) => {
  const {
    address_id,
    coupon_code,
    delivery_instructions,
    delivery_mode,
    scheduled_for,
    payment_method,
  } = body;

  if (!address_id) {
    const err = new Error('Address ID is required');
    err.status = 400;
    throw err;
  }

  const normalizedPaymentMethod = normalizePaymentMethod(payment_method || 'cod');
  if (!normalizedPaymentMethod) {
    const err = new Error(
      `Invalid payment method. Supported: ${ALLOWED_PAYMENT_METHODS.join(', ')}`
    );
    err.status = 400;
    throw err;
  }

  // Enforce admin payment toggles when available.
  try {
    const settings = await pool.query('SELECT * FROM admin_settings WHERE id = 1');
    const s = settings.rows[0];
    if (s) {
      if (normalizedPaymentMethod === 'cod' && s.payment_cod_enabled === false) {
        const err = new Error('Cash on Delivery is currently disabled');
        err.status = 400;
        throw err;
      }
      if (normalizedPaymentMethod === 'upi' && s.payment_upi_enabled === false) {
        const err = new Error('UPI payments are currently disabled');
        err.status = 400;
        throw err;
      }
      if (
        ['credit_card', 'debit_card'].includes(normalizedPaymentMethod) &&
        s.payment_card_enabled === false
      ) {
        const err = new Error('Card payments are currently disabled');
        err.status = 400;
        throw err;
      }
      if (
        isOnlineMethod(normalizedPaymentMethod) &&
        s.payment_razorpay_enabled === false &&
        normalizedPaymentMethod !== 'cod'
      ) {
        // Online methods go through Razorpay; respect the Razorpay toggle.
        const err = new Error('Online payments are currently disabled');
        err.status = 400;
        throw err;
      }
    }
  } catch (e) {
    if (e.status) throw e;
  }

  const cart = await getCartByUserId(userId);
  const items = await getCartItems(cart.id);

  if (items.length === 0) {
    const err = new Error('Cart is empty');
    err.status = 400;
    throw err;
  }

  const restaurantIds = new Set(items.map((item) => item.restaurant_id));
  if (restaurantIds.size !== 1) {
    const err = new Error('An order can contain items from only one restaurant');
    err.status = 409;
    err.code = 'MULTIPLE_RESTAURANTS';
    throw err;
  }

  const restaurantId = items[0].restaurant_id;

  let subtotal = 0;
  items.forEach((item) => {
    const price = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
    subtotal += price * item.quantity;
  });

  const address = await getAddressById(address_id, userId);
  if (!address) {
    const err = new Error('Invalid address');
    err.status = 400;
    throw err;
  }

  let discount = 0;
  let couponId = null;
  let offerId = null;
  let normalizedCode = null;

  if (coupon_code) {
    normalizedCode = String(coupon_code).trim().toUpperCase();
    const coupon = await getCouponByCode(normalizedCode);

    if (!coupon || !coupon.is_active) {
      const err = new Error('Invalid or inactive coupon');
      err.status = 400;
      throw err;
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      const err = new Error('Coupon is not yet valid');
      err.status = 400;
      throw err;
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      const err = new Error('Coupon has expired');
      err.status = 400;
      throw err;
    }

    if (coupon.usage_limit) {
      const usageCount = await getCouponUsageCount(coupon.id, userId);
      if (usageCount >= coupon.usage_limit) {
        const err = new Error('Coupon usage limit reached');
        err.status = 400;
        throw err;
      }
    }

    if (subtotal < parseFloat(coupon.min_order_amount)) {
      const err = new Error(`Minimum order amount of ₹${coupon.min_order_amount} required`);
      err.status = 400;
      throw err;
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
      const eligibility = await validateOfferEligibility(linkedOffer, userId, items, subtotal);
      if (!eligibility.valid) {
        const err = new Error(eligibility.message);
        err.status = 400;
        throw err;
      }
      offerId = linkedOffer.id;
    }

    const restaurantCheck = await validateRestaurantCoupon(couponId, restaurantId);
    if (!restaurantCheck.valid) {
      const err = new Error(restaurantCheck.message);
      err.status = 400;
      throw err;
    }
  }

  let deliveryCharge = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
  if (normalizedCode === 'FREEDEL' && couponId) {
    deliveryCharge = 0;
  }
  const tax = subtotal * 0.05;
  const totalAmount = subtotal + deliveryCharge + tax - discount;

  return {
    cart,
    items,
    restaurantId,
    address_id,
    couponId,
    offerId,
    normalizedCode,
    subtotal,
    discount,
    deliveryCharge,
    tax,
    totalAmount,
    delivery_instructions: delivery_instructions || null,
    delivery_mode: delivery_mode === 'Schedule' ? 'Schedule' : 'Now',
    scheduled_for:
      delivery_mode === 'Schedule' && scheduled_for ? new Date(scheduled_for) : null,
    payment_method: normalizedPaymentMethod,
    checkout_payload: {
      address_id,
      coupon_code: normalizedCode,
      delivery_instructions: delivery_instructions || null,
      delivery_mode: delivery_mode === 'Schedule' ? 'Schedule' : 'Now',
      scheduled_for:
        delivery_mode === 'Schedule' && scheduled_for ? scheduled_for : null,
      payment_method: normalizedPaymentMethod,
    },
  };
};

/**
 * Creates Foodiq order + payment from a prepared checkout snapshot.
 */
const commitCheckoutOrder = async (userId, prepared, paymentMeta = {}, client = pool) => {
  const orderStatus = 'Pending';
  const paymentStatus =
    paymentMeta.status ||
    (prepared.payment_method === 'cod' ? 'pending' : 'completed');

  const orderQuery = `
    INSERT INTO orders (
      user_id, restaurant_id, delivery_address_id, coupon_id, offer_id, status,
      subtotal, discount_amount, delivery_fee, total_amount, delivery_instructions,
      delivery_mode, scheduled_for
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const orderValues = [
    userId,
    prepared.restaurantId,
    prepared.address_id,
    prepared.couponId,
    prepared.offerId,
    orderStatus,
    prepared.subtotal,
    prepared.discount,
    prepared.deliveryCharge,
    prepared.totalAmount,
    prepared.delivery_instructions,
    prepared.delivery_mode,
    prepared.scheduled_for,
  ];

  const { rows: orderRows } = await client.query(orderQuery, orderValues);
  const newOrder = orderRows[0];

  for (const item of prepared.items) {
    const priceAtTime = item.discount_price
      ? parseFloat(item.discount_price)
      : parseFloat(item.price);
    await client.query(
      'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
      [newOrder.id, item.menu_item_id, item.quantity, priceAtTime]
    );
  }

  if (prepared.couponId) {
    await recordCouponUsage(prepared.couponId, userId, newOrder.id, client);
    await recordCouponHistory(
      {
        userId,
        couponId: prepared.couponId,
        offerId: prepared.offerId,
        orderId: newOrder.id,
        couponCode: prepared.normalizedCode,
        discountAmount: prepared.discount,
        finalPrice: prepared.totalAmount,
      },
      client
    );
  }
  if (prepared.offerId) {
    await recordOfferUsage(
      prepared.offerId,
      userId,
      newOrder.id,
      prepared.discount,
      client
    );
  }

  const payment = await createPaymentRecord(
    {
      orderId: newOrder.id,
      userId,
      amount: prepared.totalAmount,
      method: prepared.payment_method,
      status: paymentStatus,
      provider_transaction_id: paymentMeta.provider_transaction_id || null,
      razorpay_order_id: paymentMeta.razorpay_order_id || null,
      razorpay_payment_id: paymentMeta.razorpay_payment_id || null,
      razorpay_signature: paymentMeta.razorpay_signature || null,
      currency: paymentMeta.currency || 'INR',
      transaction_time: paymentMeta.transaction_time || new Date(),
    },
    client
  );

  await client.query(
    `INSERT INTO order_tracking (order_id, current_status, estimated_delivery_time)
     VALUES ($1, 'Pending', CURRENT_TIMESTAMP + INTERVAL '30 minutes')
     ON CONFLICT (order_id) DO UPDATE SET
       current_status = 'Pending',
       estimated_delivery_time = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
       updated_at = CURRENT_TIMESTAMP`,
    [newOrder.id]
  );

  await client.query('DELETE FROM cart_items WHERE cart_id = $1', [prepared.cart.id]);

  return { order: newOrder, payment };
};

const notifyRestaurantOwner = async (restaurantId, orderId, totalAmount) => {
  let ownerId = null;
  try {
    const ownerRes = await pool.query(
      'SELECT owner_id, name FROM restaurants WHERE id = $1',
      [restaurantId]
    );
    ownerId = ownerRes.rows[0]?.owner_id;
    if (ownerId) {
      const { createNotification } = require('../models/notificationModel');
      await createNotification(
        ownerId,
        'new_order',
        'New Order',
        `New order #${String(orderId).slice(0, 8)} for ₹${Number(totalAmount).toFixed(0)}.`,
        {
          order_id: orderId,
          link: '/partner/orders',
          restaurant_name: ownerRes.rows[0]?.name,
          amount: totalAmount,
          total: totalAmount,
        }
      );
      // Customer order confirmation (email + SMS via notify pipeline)
      const orderUser = await pool.query('SELECT user_id FROM orders WHERE id = $1', [orderId]);
      if (orderUser.rows[0]?.user_id) {
        await createNotification(
          orderUser.rows[0].user_id,
          'order_placed',
          'Order Confirmed',
          `Your order #${String(orderId).slice(0, 8)} from ${ownerRes.rows[0]?.name || 'Foodiq'} is confirmed.`,
          {
            order_id: orderId,
            restaurant_name: ownerRes.rows[0]?.name,
            amount: totalAmount,
            total: totalAmount,
            link: `/track-order?id=${orderId}`,
          }
        );
      }
    }
  } catch (notifyErr) {
    console.warn('[checkout] partner notification skipped:', notifyErr.message);
  }

  try {
    const { emitOrderCreated, emitNotification } = require('../socket/emitters');
    const orderMeta = await pool.query(
      'SELECT id, user_id, restaurant_id, status, total_amount FROM orders WHERE id = $1',
      [orderId]
    );
    const order = orderMeta.rows[0] || {
      id: orderId,
      restaurant_id: restaurantId,
      total_amount: totalAmount,
      status: 'Pending',
    };
    emitOrderCreated(order, { source: 'checkout' });
    if (ownerId) {
      emitNotification(ownerId, {
        type: 'new_order',
        title: 'New Order',
        message: `New order #${String(orderId).slice(0, 8)} for ₹${Number(totalAmount).toFixed(0)}.`,
        order_id: orderId,
      });
    }
  } catch (socketErr) {
    console.warn('[checkout] socket emit skipped:', socketErr.message);
  }
};

const formatCheckoutResponse = (order, paymentMethod, prepared) => ({
  order_id: order.id,
  payment_method: paymentMethod,
  summary: {
    subtotal: parseFloat(prepared.subtotal.toFixed(2)),
    discount: parseFloat(prepared.discount.toFixed(2)),
    delivery_charge: parseFloat(prepared.deliveryCharge.toFixed(2)),
    tax: parseFloat(prepared.tax.toFixed(2)),
    grand_total: parseFloat(prepared.totalAmount.toFixed(2)),
    estimated_delivery_minutes: 30,
  },
});

module.exports = {
  ALLOWED_PAYMENT_METHODS,
  normalizePaymentMethod,
  isOnlineMethod,
  prepareCheckout,
  commitCheckoutOrder,
  notifyRestaurantOwner,
  formatCheckoutResponse,
};
