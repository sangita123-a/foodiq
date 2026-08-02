const express = require('express');
const router = express.Router();
const c = require('../controllers/deliveryNotificationController');
const { protectDelivery } = require('../middleware/deliveryAuth');
const { notificationLimiter } = require('../middleware/rateLimiters');

// Mounted at /api/delivery/notifications (see routes/deliveryRoutes.js).
// JWT-protected: a partner can only ever see/act on their own notifications
// (resolvePartnerId in the controller is derived from the verified token).
router.use(notificationLimiter);
router.use(protectDelivery);

router.get('/', c.getNotifications);
router.patch('/read-all', c.markAllReadHandler);
router.patch('/:id/read', c.markOneRead);
router.delete('/:id', c.deleteOne);

module.exports = router;
