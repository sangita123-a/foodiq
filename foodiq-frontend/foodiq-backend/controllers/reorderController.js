const { ok, fail } = require('../utils/respond');
const { pool } = require('../config/db');
const {
  getCartByUserId,
  getCartItems,
  addCartItem,
  clearCart,
} = require('../models/cartModel');

/**
 * Repeat previous order — rebuild cart from order line items.
 * POST /api/orders/:id/reorder
 */
const reorderOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { rows } = await pool.query(
      `SELECT o.id, o.restaurant_id,
              COALESCE(
                json_agg(
                  json_build_object(
                    'menu_item_id', oi.menu_item_id,
                    'quantity', oi.quantity,
                    'name', m.name
                  )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id`,
      [orderId, req.user.id]
    );
    const order = rows[0];
    if (!order) return fail(res, 404, 'Order not found');

    let items = order.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }

    const available = [];
    const skipped = [];

    for (const item of items || []) {
      if (!item.menu_item_id) {
        skipped.push({ reason: 'missing_item', item });
        continue;
      }
      const check = await pool.query(
        `SELECT m.id, m.name, m.is_available, r.is_active
         FROM menu_items m
         JOIN restaurants r ON r.id = m.restaurant_id
         WHERE m.id = $1`,
        [item.menu_item_id]
      );
      const row = check.rows[0];
      if (!row || row.is_available === false || row.is_active === false) {
        skipped.push({
          reason: 'unavailable',
          menu_item_id: item.menu_item_id,
          name: item.name,
        });
        continue;
      }
      available.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity || 1,
      });
    }

    if (!available.length) {
      return fail(res, 400, 'No available items to reorder');
    }

    const cart = await getCartByUserId(req.user.id);
    await clearCart(cart.id);
    for (const line of available) {
      await addCartItem(cart.id, line.menu_item_id, line.quantity);
    }
    const cartItems = await getCartItems(cart.id);

    return ok(res, 'Order added to cart', {
      cart: { ...cart, items: cartItems },
      added: available.length,
      skipped,
      restaurant_id: order.restaurant_id,
    });
  } catch (err) {
    return fail(res, 500, 'Server Error', err);
  }
};

module.exports = { reorderOrder };
