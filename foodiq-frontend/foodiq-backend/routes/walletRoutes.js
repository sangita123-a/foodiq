const express = require('express');
const router = express.Router();
const {
  getMyWallet,
  getMyTransactions,
  adminListTransactions,
  adminCreditWallet,
  adminDebitWallet,
  adminListRefundRequests,
  adminApproveRefund,
  adminRejectRefund,
  adminCreateRefundRequest,
} = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyWallet);
router.get('/transactions', getMyTransactions);

router.get('/admin/transactions', authorize('admin'), adminListTransactions);
router.post('/admin/credit', authorize('admin'), adminCreditWallet);
router.post('/admin/debit', authorize('admin'), adminDebitWallet);
router.get('/admin/refund-requests', authorize('admin'), adminListRefundRequests);
router.post('/admin/refund-requests', authorize('admin'), adminCreateRefundRequest);
router.put('/admin/refund-requests/:id/approve', authorize('admin'), adminApproveRefund);
router.put('/admin/refund-requests/:id/reject', authorize('admin'), adminRejectRefund);

module.exports = router;
