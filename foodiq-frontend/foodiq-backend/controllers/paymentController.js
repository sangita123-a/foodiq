const { pool } = require('../config/db');
const { createPaymentRecord, updatePaymentStatus, getPaymentHistory } = require('../models/paymentModel');

const ALLOWED_METHODS = ['credit_card', 'debit_card', 'upi', 'wallet', 'cod', 'net_banking'];

const normalizePaymentMethod = (method) => {
  if (!method) return null;
  const map = {
    upi: 'upi',
    UPI: 'upi',
    card: 'credit_card',
    Card: 'credit_card',
    credit_card: 'credit_card',
    'Credit Card': 'credit_card',
    creditcard: 'credit_card',
    debit_card: 'debit_card',
    'Debit Card': 'debit_card',
    debitcard: 'debit_card',
    wallet: 'wallet',
    Wallet: 'wallet',
    cod: 'cod',
    cash: 'cod',
    'Cash on Delivery': 'cod',
    net_banking: 'net_banking',
    netbanking: 'net_banking',
    'Net Banking': 'net_banking',
  };
  const normalized = map[method] || String(method).toLowerCase().replace(/\s+/g, '_');
  return ALLOWED_METHODS.includes(normalized) ? normalized : null;
};

const createPayment = async (req, res) => {
  try {
    const { order_id, amount, method } = req.body;

    if (!order_id || !amount || !method) {
      return res.status(400).json({ success: false, message: 'Order ID, amount, and method are required', error: {} });
    }

    const normalizedMethod = normalizePaymentMethod(method);
    if (!normalizedMethod) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment method. Supported: ${ALLOWED_METHODS.join(', ')}`,
        error: {},
      });
    }

    const order = await pool.query(
      'SELECT id, total_amount, status FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, req.user.id]
    );
    if (!order.rows[0]) {
      return res.status(404).json({ success: false, message: 'Order not found', error: {} });
    }
    if (order.rows[0].status === 'Cancelled' || order.rows[0].status === 'cancelled') {
      return res.status(409).json({ success: false, message: 'Cancelled orders cannot be paid', error: {} });
    }
    if (Math.abs(Number(order.rows[0].total_amount) - Number(amount)) > 0.01) {
      return res.status(400).json({ success: false, message: 'Payment amount does not match the order total', error: {} });
    }

    const payment = await createPaymentRecord(order_id, req.user.id, amount, normalizedMethod);

    res.status(201).json({ 
      success: true, 
      message: 'Payment initialized', 
      data: { 
        payment_id: payment.id,
        client_secret: `mock_secret_${payment.id}` 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error during payment initialization', error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const client = await pool.connect();
  try {
    const { payment_id, transaction_id, status } = req.body;
    
    if (!payment_id || !transaction_id || !status) {
      return res.status(400).json({ success: false, message: 'Payment ID, transaction ID, and status required', error: {} });
    }
    if (!['completed', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status', error: {} });
    }

    await client.query('BEGIN');

    const updatedPayment = await updatePaymentStatus(payment_id, req.user.id, status, transaction_id, client);
    if (!updatedPayment) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Payment not found', error: {} });
    }
    
    if (status === 'completed') {
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['Accepted', updatedPayment.order_id]);
      await client.query(
        `INSERT INTO order_tracking (order_id, current_status, estimated_delivery_time)
         VALUES ($1, 'Accepted', CURRENT_TIMESTAMP + INTERVAL '30 minutes')
         ON CONFLICT (order_id) DO UPDATE SET
           current_status = 'Accepted',
           estimated_delivery_time = CURRENT_TIMESTAMP + INTERVAL '30 minutes',
           updated_at = CURRENT_TIMESTAMP`,
        [updatedPayment.order_id]
      );
    } else if (status === 'failed') {
      // Keep the order pending so the customer can retry with another method.
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['pending', updatedPayment.order_id]);
    }

    await client.query('COMMIT');
    
    res.json({ success: true, message: 'Payment verified successfully', data: updatedPayment });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Server Error verifying payment', error: error.message });
  } finally {
    client.release();
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await getPaymentHistory(req.user.id);
    res.json({ success: true, message: 'Payment history retrieved', data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error retrieving history', error: error.message });
  }
};

module.exports = { createPayment, verifyPayment, getHistory };
