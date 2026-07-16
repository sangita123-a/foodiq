const express = require('express');
const router = express.Router();
const { getAll, create, markRead, markAllRead, clearAll, remove } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getAll).post(create).delete(clearAll);
router.put('/read-all', markAllRead);
router.route('/:id/read').put(markRead);
router.route('/:id').delete(remove);

module.exports = router;
