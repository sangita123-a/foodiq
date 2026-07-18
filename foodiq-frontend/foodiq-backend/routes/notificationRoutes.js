const express = require('express');
const router = express.Router();
const {
  getAll,
  getUnread,
  create,
  markRead,
  markAllRead,
  clearAll,
  remove,
  registerDevice,
  unregisterDevice,
  getPushConfig,
  adminSend,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/push-config', protect, getPushConfig);
router.post('/device-token', protect, registerDevice);
router.delete('/device-token', protect, unregisterDevice);
router.get('/unread-count', protect, getUnread);

router.use(protect);

router.route('/').get(getAll).post(create).delete(clearAll);
router.put('/read-all', markAllRead);
router.post('/admin/send', authorize('admin'), adminSend);
router.route('/:id/read').put(markRead);
router.route('/:id').delete(remove);

module.exports = router;
