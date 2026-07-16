const express = require('express');
const router = express.Router();
const { getRewards, claimReward } = require('../controllers/rewardController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getRewards);
router.route('/claim').post(claimReward);

module.exports = router;
