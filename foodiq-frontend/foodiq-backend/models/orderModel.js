const { pool } = require('../config/db');

const getOrders = async (userId, role) => {
  let query = `
    SELECT o.*, r.name as restaurant_name, a.street, a.city
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    LEFT JOIN addresses a ON o.delivery_address_id = a.id
  `;
  const values = [];
  
  if (role === 'customer') {
    query += ' WHERE o.user_id = $1';
    values.push(userId);
  } else if (role === 'restaurant_owner') {
    query += ' WHERE r.owner_id = $1';
    values.push(userId);
  }
  
  query += ' ORDER BY o.created_at DESC';
  
  const { rows } = await pool.query(query, values);
  
  // Fetch items for each order
  for (const order of rows) {
    const itemsQuery = `
      SELECT oi.*, m.name
      FROM order_items oi
      JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = $1
    `;
    const items = await pool.query(itemsQuery, [order.id]);
    order.items = items.rows;
  }

  return rows;
};

const getOrderById = async (orderId) => {
  const query = `
    SELECT o.*, r.name as restaurant_name, a.street, a.city, a.full_name, a.phone_number
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    LEFT JOIN addresses a ON o.delivery_address_id = a.id
    WHERE o.id = $1
  `;
  const { rows } = await pool.query(query, [orderId]);
  
  if (rows.length === 0) return null;
  
  const order = rows[0];
  
  const itemsQuery = `
    SELECT oi.*, m.name
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.order_id = $1
  `;
  const items = await pool.query(itemsQuery, [orderId]);
  order.items = items.rows;

  const paymentRes = await pool.query(
    'SELECT method FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1',
    [orderId]
  );
  if (paymentRes.rows[0]) {
    order.payment_method = paymentRes.rows[0].method;
  }
  
  return order;
};

const updateOrderStatus = async (orderId, status) => {
  const { rows } = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, orderId]);
  return rows[0];
};

module.exports = { getOrders, getOrderById, updateOrderStatus };
