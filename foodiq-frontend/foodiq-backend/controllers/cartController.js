const {
  getCartByUserId,
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require('../models/cartModel');
const { pool } = require('../config/db');
const { calculateTax } = require('../services/taxEngine');

const calculateCartTotals = async (items) => {
  let subtotal = 0;
  items.forEach((item) => {
    const price = item.discount_price
      ? parseFloat(item.discount_price)
      : parseFloat(item.price);
    subtotal += price * item.quantity;
  });

  const deliveryCharge = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0;
  const taxResult = await calculateTax(subtotal, { countryCode: 'IN' }).catch(
    () => ({ tax: subtotal * 0.05 })
  );
  const tax = taxResult.tax;
  const discount = 0;
  const grandTotal = subtotal + deliveryCharge + tax - discount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
  };
};

const getCart = async (req, res) => {
  try {
    const cart = await getCartByUserId(req.user.id);
    const items = await getCartItems(cart.id);
    const totals = await calculateCartTotals(items);

    res.json({
      success: true,
      message: 'Cart retrieved',
      data: { cart_id: cart.id, items, totals },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { menu_item_id, quantity = 1 } = req.body;
    if (!menu_item_id) {
      return res.status(400).json({ success: false, message: 'Menu item ID required', error: {} });
    }
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 20) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be between 1 and 20',
        error: {},
      });
    }

    const cart = await getCartByUserId(req.user.id);
    const [currentItems, target] = await Promise.all([
      getCartItems(cart.id),
      pool.query(
        `SELECT id, restaurant_id FROM menu_items
         WHERE id = $1 AND is_available = TRUE`,
        [menu_item_id]
      ),
    ]);
    if (!target.rows[0]) {
      return res.status(404).json({ success: false, message: 'Menu item is unavailable', error: {} });
    }
    if (
      currentItems.length > 0 &&
      currentItems[0].restaurant_id !== target.rows[0].restaurant_id
    ) {
      return res.status(409).json({
        success: false,
        message:
          'Your cart contains items from another restaurant. Clear it before starting a new order.',
        error: { code: 'DIFFERENT_RESTAURANT' },
      });
    }

    await addCartItem(cart.id, menu_item_id, parsedQuantity);

    const items = await getCartItems(cart.id);
    const totals = await calculateCartTotals(items);

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: { cart_id: cart.id, items, totals },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid quantity', error: {} });
    }

    const cart = await getCartByUserId(req.user.id);
    const updated = await updateCartItemQuantity(cartItemId, cart.id, quantity);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Cart item not found', error: {} });
    }

    const items = await getCartItems(cart.id);
    const totals = await calculateCartTotals(items);

    res.json({
      success: true,
      message: 'Cart updated',
      data: { cart_id: cart.id, items, totals },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.params;
    const cart = await getCartByUserId(req.user.id);
    const removed = await removeCartItem(cartItemId, cart.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Cart item not found', error: {} });
    }

    const items = await getCartItems(cart.id);
    const totals = await calculateCartTotals(items);

    res.json({
      success: true,
      message: 'Item removed',
      data: { cart_id: cart.id, items, totals },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const emptyCart = async (req, res) => {
  try {
    const cart = await getCartByUserId(req.user.id);
    await clearCart(cart.id);
    const totals = await calculateCartTotals([]);

    res.json({
      success: true,
      message: 'Cart cleared',
      data: { cart_id: cart.id, items: [], totals },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, emptyCart };
