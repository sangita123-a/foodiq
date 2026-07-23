const { getCartByUserId, getCartItems } = require('../models/cartModel');
const { getAddressById } = require('../models/addressModel');
const { getCouponByCode, validateCoupon, recordCouponUsage, resolveCouponType } = require('../models/couponModel');
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
    points_to_redeem,
    redemption_type,
    wallet_amount,
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
  let pointsRedeemed = 0;
  let pointsDiscount = 0;

  const usePoints = redemption_type === 'points' && Number(points_to_redeem) > 0;
  const useCoupon = !usePoints && coupon_code;

  let freeDeliveryCoupon = false;

  if (useCoupon) {
    normalizedCode = String(coupon_code).trim().toUpperCase();
    const coupon = await getCouponByCode(normalizedCode);

    const validation = await validateCoupon(coupon, userId, subtotal);
    if (!validation.valid) {
      const err = new Error(validation.message);
      err.status = 400;
      throw err;
    }

    discount = validation.discount;
    freeDeliveryCoupon = validation.freeDelivery;
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

  if (usePoints) {
    const loyaltyEngine = require('./loyaltyEngine');
    const loyaltyModel = require('../models/loyaltyModel');
    const pts = Number(points_to_redeem);
    const preview = loyaltyEngine.previewRedemption(pts, subtotal);
    if (!preview.valid) {
      const err = new Error(preview.message || 'Invalid points redemption');
      err.status = 400;
      throw err;
    }
    pointsRedeemed = preview.points_required || pts;
    pointsDiscount = preview.discount_amount;
    discount = pointsDiscount;

    const wallet = await loyaltyModel.getWallet(userId);
    if (wallet.points_balance < pointsRedeemed) {
      const err = new Error('Insufficient loyalty points');
      err.status = 400;
      throw err;
    }
  }

  let deliveryCharge = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
  if (freeDeliveryCoupon && couponId) {
    deliveryCharge = 0;
  }
  if (usePoints) {
    const loyaltyModel = require('../models/loyaltyModel');
    const wallet = await loyaltyModel.getWallet(userId);
    const benefits = wallet.tier?.current?.benefits || {};
    if (benefits.free_delivery) {
      deliveryCharge = 0;
    }
  }
  const platformFee = subtotal > 0 ? 5 : 0;
  const taxResult = await require('./taxEngine')
    .calculateTax(subtotal, { countryCode: 'IN' })
    .catch(() => ({ tax: subtotal * 0.05, rate: 0.05, enabled: false }));
  const tax = taxResult.tax;
  let totalAmount = subtotal + deliveryCharge + platformFee + tax - discount;

  // V3 pricing engine (off by default — identical to V2 when disabled)
  let marketId = null;
  let currency = 'INR';
  let pricingMultiplier = 1;
  try {
    const { resolveMultiplier, applyToAmount } = require('./pricingEngine');
    const { getCheckoutCurrency } = require('./currencyService');
    const restRow = await pool.query(
      `SELECT market_id, organization_id FROM restaurants WHERE id = $1 LIMIT 1`,
      [restaurantId]
    );
    marketId = restRow.rows[0]?.market_id || null;
    const organizationId = restRow.rows[0]?.organization_id || null;
    const pricing = await resolveMultiplier({ marketId, organizationId });
    pricingMultiplier = pricing.multiplier || 1;
    if (pricing.enabled && pricingMultiplier > 1) {
      totalAmount = applyToAmount(totalAmount, pricingMultiplier);
    }
    currency = await getCheckoutCurrency(marketId);
  } catch {
    /* keep V2 totals */
  }

  const originalTotalAmount = totalAmount;
  let walletAmountUsed = 0;
  const requestedWallet = Number(wallet_amount) || 0;
  if (requestedWallet > 0) {
    const { getWalletByUserId } = require('../models/customerWalletModel');
    const wallet = await getWalletByUserId(userId);
    walletAmountUsed = Math.min(requestedWallet, Number(wallet.balance || 0), totalAmount);
    walletAmountUsed = Math.round(walletAmountUsed * 100) / 100;
    totalAmount = Math.max(0, totalAmount - walletAmountUsed);
  }

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
    platformFee,
    tax,
    totalAmount,
    originalTotalAmount,
    wallet_amount_used: walletAmountUsed,
    market_id: marketId,
    currency,
    pricing_multiplier: pricingMultiplier,
    delivery_instructions: delivery_instructions || null,
    delivery_mode: delivery_mode === 'Schedule' ? 'Schedule' : 'Now',
    scheduled_for:
      delivery_mode === 'Schedule' && scheduled_for ? new Date(scheduled_for) : null,
    payment_method: normalizedPaymentMethod,
    points_redeemed: pointsRedeemed,
    points_discount: pointsDiscount,
    redemption_type: usePoints ? 'points' : useCoupon ? 'coupon' : null,
    checkout_payload: {
      address_id,
      coupon_code: normalizedCode,
      points_to_redeem: pointsRedeemed || undefined,
      redemption_type: usePoints ? 'points' : undefined,
      delivery_instructions: delivery_instructions || null,
      delivery_mode: delivery_mode === 'Schedule' ? 'Schedule' : 'Now',
      scheduled_for:
        delivery_mode === 'Schedule' && scheduled_for ? scheduled_for : null,
      payment_method: normalizedPaymentMethod,
      wallet_amount: walletAmountUsed || undefined,
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
      subtotal, discount_amount, delivery_fee, platform_fee, tax_amount, total_amount, delivery_instructions,
      delivery_mode, scheduled_for, market_id, currency, wallet_amount_used
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
    prepared.platformFee || 0,
    prepared.tax || 0,
    prepared.originalTotalAmount ?? prepared.totalAmount,
    prepared.delivery_instructions,
    prepared.delivery_mode,
    prepared.scheduled_for,
    prepared.market_id || null,
    prepared.currency || 'INR',
    prepared.wallet_amount_used || 0,
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

  if (prepared.points_redeemed > 0) {
    const loyaltyEngine = require('./loyaltyEngine');
    await loyaltyEngine.redeemAtCheckout(
      userId,
      prepared.points_redeemed,
      newOrder.id,
      client
    );
  }

  if (prepared.wallet_amount_used > 0) {
    const { debitWallet } = require('../models/customerWalletModel');
    await debitWallet(
      userId,
      prepared.wallet_amount_used,
      {
        type: 'wallet_payment',
        category: 'payment',
        referenceType: 'order',
        referenceId: newOrder.id,
        orderId: newOrder.id,
        dedupeKey: `wallet_pay:${newOrder.id}`,
        note: `Wallet payment for order #${String(newOrder.id).slice(0, 8)}`,
      },
      client
    );
  }

  const payableAmount = prepared.totalAmount;
  const effectiveMethod =
    payableAmount <= 0 && prepared.wallet_amount_used > 0 ? 'wallet' : prepared.payment_method;

  const payment = await createPaymentRecord(
    {
      orderId: newOrder.id,
      userId,
      amount: payableAmount > 0 ? payableAmount : prepared.originalTotalAmount ?? payableAmount,
      method: effectiveMethod,
      status: paymentStatus,
      provider_transaction_id: paymentMeta.provider_transaction_id || null,
      razorpay_order_id: paymentMeta.razorpay_order_id || null,
      razorpay_payment_id: paymentMeta.razorpay_payment_id || null,
      razorpay_signature: paymentMeta.razorpay_signature || null,
      currency: prepared.currency || paymentMeta.currency || 'INR',
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
    platform_fee: parseFloat(Number(prepared.platformFee || 0).toFixed(2)),
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
