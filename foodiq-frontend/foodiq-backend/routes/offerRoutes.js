const express = require('express');
const router = express.Router();
const { listOffers, getOffer, getItems, validateOffer } = require('../controllers/offerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', listOffers);
router.get('/:id/items', getItems);
router.get('/:id/validate', protect, validateOffer);
router.get('/:id', getOffer);

module.exports = router;
