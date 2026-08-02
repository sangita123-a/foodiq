const express = require('express');
const router = express.Router();
const ReferralController = require('../controllers/referralController');
const { protectDelivery } = require('../middleware/deliveryAuth');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * Hybrid middleware for delivery referral routes: accepts delivery_partner session token
 * or standard user/admin JWT session.
 */
const authDeliveryReferral = (req, res, next) => {
  protectDelivery(req, res, (err) => {
    if (!err && req.deliveryPartner) return next();
    protect(req, res, (err2) => {
      if (err2) return;
      if (req.user && ['delivery_partner', 'driver', 'admin', 'super_admin'].includes(req.user.role)) {
        return next();
      }
      return res.status(403).json({ success: false, message: 'Not authorized for delivery referrals' });
    });
  });
};

const adminRoles = ['admin', 'super_admin'];

// ── Delivery Partner APIs ──────────────────────────────────────────────────
router.get('/delivery/referral', authDeliveryReferral, ReferralController.getDeliveryReferral);
router.get('/delivery/referral/history', authDeliveryReferral, ReferralController.getDeliveryReferralHistory);
router.get('/delivery/referral/rewards', authDeliveryReferral, ReferralController.getDeliveryReferralRewards);
router.post('/delivery/referral/share', authDeliveryReferral, ReferralController.shareDeliveryReferral);

// ── Admin APIs ─────────────────────────────────────────────────────────────
router.get('/admin/referrals', protect, authorize(...adminRoles), ReferralController.getAdminReferrals);
router.patch('/admin/referrals/:id', protect, authorize(...adminRoles), ReferralController.updateAdminReferral);
router.get('/admin/referral-settings', protect, authorize(...adminRoles), ReferralController.getAdminReferralSettings);
router.patch('/admin/referral-settings', protect, authorize(...adminRoles), ReferralController.updateAdminReferralSettings);

module.exports = router;
