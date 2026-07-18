const { pool } = require('../config/db');

/**
 * Returns true if the user may view the order.
 */
const canManageOrder = async (user, order) => {
  if (!user || !order) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'customer' && order.user_id === user.id) return true;

  if (user.role === 'restaurant_owner') {
    if (order.restaurant_owner_id && order.restaurant_owner_id === user.id) {
      return true;
    }
    const { rows } = await pool.query(
      `SELECT 1 FROM restaurants WHERE id = $1 AND owner_id = $2 LIMIT 1`,
      [order.restaurant_id, user.id]
    );
    return Boolean(rows[0]);
  }

  if (user.role === 'delivery_partner' && order.delivery_partner_id) {
    const { rows } = await pool.query(
      `SELECT 1 FROM delivery_partners dp
       WHERE dp.user_id = $1 AND dp.id = $2
       LIMIT 1`,
      [user.id, order.delivery_partner_id]
    );
    return Boolean(rows[0]);
  }

  return false;
};

/** Status updates: admin, restaurant owner, or assigned delivery partner — never customers. */
const canUpdateOrderStatus = async (user, order) => {
  if (!user || !order) return false;
  if (user.role === 'customer') return false;
  if (user.role === 'admin') return true;
  return canManageOrder(user, order);
};

module.exports = { canManageOrder, canUpdateOrderStatus };
