const crypto = require('crypto');

let razorpayInstance = null;

const isMockMode = () => {
  const explicit = String(process.env.RAZORPAY_MOCK || '').toLowerCase();
  if (explicit === 'true') {
    // Production requires explicit ALLOW_PAYMENT_MOCK=true to use mock payments
    if (process.env.NODE_ENV === 'production') {
      return String(process.env.ALLOW_PAYMENT_MOCK || '').toLowerCase() === 'true';
    }
    return true;
  }
  if (explicit === 'false') return false;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    if (process.env.NODE_ENV === 'production') return false;
    return true;
  }
  return false;
};

const getKeyId = () => {
  if (isMockMode()) {
    return process.env.RAZORPAY_KEY_ID || 'rzp_test_foodiq_mock';
  }
  return process.env.RAZORPAY_KEY_ID;
};

const getSecret = () => {
  if (isMockMode()) {
    // Never fall back to a hardcoded secret — use JWT_SECRET only if explicitly mock
    const secret = process.env.RAZORPAY_KEY_SECRET || process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('RAZORPAY_KEY_SECRET required (or disable mock payments)');
    }
    return secret || 'dev_mock_only_not_for_production';
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('RAZORPAY_KEY_SECRET is required when Razorpay mock is disabled');
  }
  return process.env.RAZORPAY_KEY_SECRET;
};

const getWebhookSecret = () =>
  process.env.RAZORPAY_WEBHOOK_SECRET || (isMockMode() ? getSecret() : null);

const getRazorpay = () => {
  if (isMockMode()) return null;
  if (!razorpayInstance) {
    // Lazy-load so mock mode works without the package failing boot.
    // eslint-disable-next-line global-require
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

/** Map Foodiq payment_method → Razorpay Checkout prefill.method */
const toRazorpayPrefillMethod = (method) => {
  switch (method) {
    case 'upi':
      return 'upi';
    case 'credit_card':
    case 'debit_card':
      return 'card';
    case 'net_banking':
      return 'netbanking';
    case 'wallet':
      return 'wallet';
    default:
      return undefined;
  }
};

const createRazorpayOrder = async ({ amountInPaise, currency = 'INR', receipt, notes = {} }) => {
  if (isMockMode()) {
    const id = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    console.log('[razorpay:mock] created order', id, amountInPaise);
    return {
      id,
      amount: amountInPaise,
      currency,
      receipt,
      status: 'created',
      notes,
      mock: true,
    };
  }

  const instance = getRazorpay();
  const order = await instance.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
    payment_capture: 1,
  });
  console.log('[razorpay] created order', order.id);
  return order;
};

const verifyPaymentSignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(body)
    .digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(String(razorpay_signature || ''), 'utf8');
  if (expectedBuf.length !== signatureBuf.length) {
    console.warn('[razorpay] signature mismatch', { razorpay_order_id, razorpay_payment_id });
    return false;
  }
  const valid = crypto.timingSafeEqual(expectedBuf, signatureBuf);
  if (!valid) {
    console.warn('[razorpay] signature mismatch', { razorpay_order_id, razorpay_payment_id });
  }
  return valid;
};

/** Verify Razorpay webhook HMAC (X-Razorpay-Signature). */
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = getWebhookSecret();
  if (!secret) {
    console.error('[razorpay] RAZORPAY_WEBHOOK_SECRET is not configured');
    return false;
  }
  if (!signature || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(String(signature), 'utf8');
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
};

/** Used only in mock checkout UI to produce a valid signature for local testing. */
const signMockPayment = (razorpay_order_id, razorpay_payment_id) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  return crypto.createHmac('sha256', getSecret()).update(body).digest('hex');
};

/**
 * Fetch payment from Razorpay and ensure it is captured/authorized
 * for the expected order + amount (server-side source of truth).
 */
const fetchAndValidatePayment = async ({
  razorpay_payment_id,
  razorpay_order_id,
  expectedAmountInPaise,
}) => {
  if (isMockMode()) {
    return {
      id: razorpay_payment_id,
      order_id: razorpay_order_id,
      status: 'captured',
      amount: expectedAmountInPaise,
      currency: 'INR',
      method: 'mock',
      mock: true,
    };
  }

  const instance = getRazorpay();
  const payment = await instance.payments.fetch(razorpay_payment_id);

  if (!payment) {
    const err = new Error('Payment not found at Razorpay');
    err.status = 400;
    throw err;
  }

  if (payment.order_id && payment.order_id !== razorpay_order_id) {
    const err = new Error('Payment order mismatch');
    err.status = 400;
    throw err;
  }

  const status = String(payment.status || '').toLowerCase();
  if (!['captured', 'authorized'].includes(status)) {
    const err = new Error(`Payment not successful (status: ${payment.status})`);
    err.status = 400;
    throw err;
  }

  if (
    expectedAmountInPaise != null &&
    Math.abs(Number(payment.amount) - Number(expectedAmountInPaise)) > 1
  ) {
    const err = new Error('Payment amount mismatch with Razorpay');
    err.status = 409;
    throw err;
  }

  return payment;
};

const createRefund = async ({ paymentId, amountInPaise, notes = {} }) => {
  if (isMockMode()) {
    const id = `rfnd_mock_${crypto.randomBytes(6).toString('hex')}`;
    console.log('[razorpay:mock] refund', id, paymentId, amountInPaise);
    return {
      id,
      payment_id: paymentId,
      amount: amountInPaise,
      currency: 'INR',
      status: 'processed',
      notes,
      mock: true,
    };
  }
  const instance = getRazorpay();
  return instance.payments.refund(paymentId, {
    amount: amountInPaise,
    notes,
  });
};

module.exports = {
  isMockMode,
  getKeyId,
  getSecret,
  getWebhookSecret,
  getRazorpay,
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  signMockPayment,
  fetchAndValidatePayment,
  createRefund,
  toRazorpayPrefillMethod,
};
