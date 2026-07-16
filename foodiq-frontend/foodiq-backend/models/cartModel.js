const { pool } = require('../config/db');

const getCartByUserId = async (userId) => {
  let { rows } = await pool.query('SELECT * FROM cart WHERE user_id = $1', [userId]);

  if (rows.length === 0) {
    const newCart = await pool.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING *', [userId]);
    rows = newCart.rows;
  }
  return rows[0];
};

const getCartItems = async (cartId) => {
  const query = `
    SELECT ci.id as cart_item_id, ci.quantity, m.id as menu_item_id, m.name, m.price, m.discount_price,
           m.image_url, m.restaurant_id, m.is_vegetarian, r.name as restaurant_name
    FROM cart_items ci
    JOIN menu_items m ON ci.menu_item_id = m.id
    JOIN restaurants r ON m.restaurant_id = r.id
    WHERE ci.cart_id = $1
    ORDER BY ci.created_at ASC
  `;
  const { rows } = await pool.query(query, [cartId]);
  return rows;
};

const addCartItem = async (cartId, menuItemId, quantity) => {
  const { rows: existing } = await pool.query(
    'SELECT * FROM cart_items WHERE cart_id = $1 AND menu_item_id = $2',
    [cartId, menuItemId]
  );

  if (existing.length > 0) {
    const newQty = existing[0].quantity + parseInt(quantity);
    const { rows } = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
      [newQty, existing[0].id]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    'INSERT INTO cart_items (cart_id, menu_item_id, quantity) VALUES ($1, $2, $3) RETURNING *',
    [cartId, menuItemId, quantity]
  );
  return rows[0];
};

const updateCartItemQuantity = async (cartItemId, cartId, quantity) => {
  const { rows } = await pool.query(
    'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND cart_id = $3 RETURNING *',
    [quantity, cartItemId, cartId]
  );
  return rows[0];
};

const removeCartItem = async (cartItemId, cartId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM cart_items WHERE id = $1 AND cart_id = $2',
    [cartItemId, cartId]
  );
  return rowCount > 0;
};

const clearCart = async (cartId) => {
  await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
};

module.exports = {
  getCartByUserId,
  getCartItems,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
