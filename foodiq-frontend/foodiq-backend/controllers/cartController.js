const {
  getCartByUserId,
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} = require('../models/cartModel');

const calculateCartTotals = (items) => {
  let subtotal = 0;
  items.forEach(item => {
    const price = item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price);
    subtotal += price * item.quantity;
  });

  const deliveryCharge = subtotal > 0 ? (subtotal > 500 ? 0 : 50) : 0; // Free delivery above 500
  const tax = subtotal * 0.05; // 5% GST
  const discount = 0; // Applied later via coupon if necessary
  const grandTotal = subtotal + deliveryCharge + tax - discount;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    deliveryCharge: parseFloat(deliveryCharge.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2))
  };
};

const getCart = async (req, res) => {
  try {
    const cart = await getCartByUserId(req.user.id);
    const items = await getCartItems(cart.id);
    const totals = calculateCartTotals(items);

    res.json({
      success: true,
      message: 'Cart retrieved',
      data: { cart_id: cart.id, items, totals }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const { menu_item_id, quantity = 1 } = req.body;
    if (!menu_item_id) return res.status(400).json({ success: false, message: 'Menu item ID required', error: {} });

    const cart = await getCartByUserId(req.user.id);
    await addCartItem(cart.id, menu_item_id, quantity);
    
    const items = await getCartItems(cart.id);
    const totals = calculateCartTotals(items);

    res.status(201).json({ success: true, message: 'Item added to cart', data: { cart_id: cart.id, items, totals } });
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
    const totals = calculateCartTotals(items);

    res.json({ success: true, message: 'Cart updated', data: { cart_id: cart.id, items, totals } });
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
    const totals = calculateCartTotals(items);

    res.json({ success: true, message: 'Item removed', data: { cart_id: cart.id, items, totals } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const emptyCart = async (req, res) => {
  try {
    const cart = await getCartByUserId(req.user.id);
    await clearCart(cart.id);

    res.json({ success: true, message: 'Cart cleared', data: { cart_id: cart.id, items: [], totals: calculateCartTotals([]) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, emptyCart };
