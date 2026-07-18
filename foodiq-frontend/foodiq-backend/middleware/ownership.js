/**
 * Resource ownership helpers for RBAC (prevent IDOR).
 */
const { pool } = require('../config/db');

const isAdmin = (user) => user?.role === 'admin';

const assertRestaurantOwner = async (user, restaurantId) => {
  if (!user) {
    const err = new Error('Not authorized');
    err.status = 401;
    throw err;
  }
  if (isAdmin(user)) return true;
  const { rows } = await pool.query(
    `SELECT id, owner_id FROM restaurants WHERE id = $1`,
    [restaurantId]
  );
  const r = rows[0];
  if (!r) {
    const err = new Error('Restaurant not found');
    err.status = 404;
    throw err;
  }
  if (String(r.owner_id) !== String(user.id)) {
    const err = new Error('Not authorized for this restaurant');
    err.status = 403;
    throw err;
  }
  return true;
};

const assertMenuItemOwner = async (user, menuItemId) => {
  if (!user) {
    const err = new Error('Not authorized');
    err.status = 401;
    throw err;
  }
  if (isAdmin(user)) return true;
  const { rows } = await pool.query(
    `SELECT m.id, r.owner_id
     FROM menu_items m
     JOIN restaurants r ON r.id = m.restaurant_id
     WHERE m.id = $1`,
    [menuItemId]
  );
  const row = rows[0];
  if (!row) {
    const err = new Error('Menu item not found');
    err.status = 404;
    throw err;
  }
  if (String(row.owner_id) !== String(user.id)) {
    const err = new Error('Not authorized for this menu item');
    err.status = 403;
    throw err;
  }
  return true;
};

module.exports = {
  isAdmin,
  assertRestaurantOwner,
  assertMenuItemOwner,
};
