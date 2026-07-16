const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, emptyCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All cart routes require authentication

router.route('/').get(getCart);
router.route('/add').post(addToCart);
router.route('/update/:cartItemId').put(updateCartItem);
router.route('/remove/:cartItemId').delete(removeFromCart);
router.route('/clear').delete(emptyCart);

module.exports = router;
