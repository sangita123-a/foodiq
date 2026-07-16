const express = require('express');
const router = express.Router();
const {
  getAll,
  add,
  remove,
  addRestaurant,
  removeRestaurant,
} = require('../controllers/favoriteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getAll);
router.route('/restaurants/:restaurantId').post(addRestaurant).delete(removeRestaurant);
router.route('/:menuItemId').post(add).delete(remove);

module.exports = router;
