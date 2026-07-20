const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const c = require('../controllers/deliveryController');

router.post('/register', c.register);

router.use(protect);
router.use(authorize('delivery_partner', 'admin'));

router.get('/me', c.getMe);
router.get('/me/reviews', c.getMyReviews);
router.put('/profile', c.updateProfile);
router.get('/dashboard', c.getDashboard);
router.put('/availability', c.setAvailability);
router.put('/location', c.setLocation);
router.get('/orders/available', c.getAvailable);
router.get('/orders/assigned', c.getAssigned);
router.get('/orders/:id', c.getOrder);
router.post('/orders/:id/accept', c.accept);
router.post('/orders/:id/reject', c.reject);
router.put('/orders/:id/status', c.updateStatus);
router.post('/orders/:id/customer-call', c.notifyCustomerCalling);
router.get('/orders/:id/route', c.getRoute);
router.get('/earnings', c.getEarnings);
router.get('/wallet', c.getWallet);
router.post('/wallet/withdraw', c.requestWithdrawal);
router.get('/history', c.getHistory);
router.get('/notifications', c.getNotifications);

module.exports = router;
