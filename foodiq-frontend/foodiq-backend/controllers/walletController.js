const {
  getWalletSummary,
  creditWallet,
  debitWallet,
  listAllTransactions,
} = require('../models/customerWalletModel');
const {
  createRefundRequest,
  approveRefundRequest,
  rejectRefundRequest,
  listRefundRequests,
} = require('../services/refundService');

const ok = (res, message, data, status = 200) =>
  res.status(status).json({ success: true, message, data });
const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const getMyWallet = async (req, res) => {
  try {
    ok(res, 'Wallet retrieved', await getWalletSummary(req.user.id));
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const getMyTransactions = async (req, res) => {
  try {
    const { listTransactions } = require('../models/customerWalletModel');
    ok(res, 'Transactions retrieved', {
      transactions: await listTransactions(req.user.id, {
        limit: req.query.limit,
        type: req.query.type || '',
      }),
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const adminListTransactions = async (req, res) => {
  try {
    ok(res, 'Wallet transactions retrieved', {
      transactions: await listAllTransactions({
        limit: req.query.limit,
        user_id: req.query.user_id || '',
      }),
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const adminCreditWallet = async (req, res) => {
  try {
    const { user_id, amount, category = 'admin', note } = req.body;
    if (!user_id || amount == null) return fail(res, 400, 'user_id and amount required');
    const result = await creditWallet(user_id, Number(amount), {
      type: 'credit',
      category,
      cashbackPortion: category === 'cashback' ? Number(amount) : 0,
      referenceType: 'admin',
      referenceId: req.user.id,
      dedupeKey: req.body.dedupe_key || null,
      note: note || `Manual credit by admin`,
      meta: { admin_id: req.user.id },
    });
    ok(res, 'Wallet credited', result, 201);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const adminDebitWallet = async (req, res) => {
  try {
    const { user_id, amount, note } = req.body;
    if (!user_id || amount == null) return fail(res, 400, 'user_id and amount required');
    const result = await debitWallet(user_id, Number(amount), {
      type: 'debit',
      category: 'admin',
      referenceType: 'admin',
      referenceId: req.user.id,
      note: note || 'Manual debit by admin',
      meta: { admin_id: req.user.id },
    });
    ok(res, 'Wallet debited', result);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const adminListRefundRequests = async (req, res) => {
  try {
    ok(res, 'Refund requests retrieved', {
      requests: await listRefundRequests({ status: req.query.status || '' }),
    });
  } catch (error) {
    fail(res, 500, 'Server Error', error.message);
  }
};

const adminApproveRefund = async (req, res) => {
  try {
    const data = await approveRefundRequest(req.params.id, req.user.id);
    ok(res, 'Refund approved and processed', data);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const adminRejectRefund = async (req, res) => {
  try {
    const data = await rejectRefundRequest(req.params.id, req.user.id, req.body.reason || '');
    ok(res, 'Refund request rejected', data);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

const adminCreateRefundRequest = async (req, res) => {
  try {
    const { order_id, amount, refund_type, refund_method, reason, auto_approve } = req.body;
    if (!order_id) return fail(res, 400, 'order_id required');
    const payment = await require('../models/paymentModel').getPaymentByOrderId(order_id);
    const data = await createRefundRequest({
      orderId: order_id,
      userId: payment?.user_id,
      amount,
      refundType: refund_type || 'full',
      refundMethod: refund_method || 'wallet',
      reason: reason || 'Admin refund',
      initiatedBy: req.user.id,
      autoApprove: auto_approve !== false,
    });
    ok(res, 'Refund request created', data, 201);
  } catch (error) {
    fail(res, error.status || 500, error.message);
  }
};

module.exports = {
  getMyWallet,
  getMyTransactions,
  adminListTransactions,
  adminCreditWallet,
  adminDebitWallet,
  adminListRefundRequests,
  adminApproveRefund,
  adminRejectRefund,
  adminCreateRefundRequest,
};
