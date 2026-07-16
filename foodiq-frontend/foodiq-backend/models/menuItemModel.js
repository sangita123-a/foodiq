const { pool } = require('../config/db');

const getMenuItems = async () => {
  const { rows } = await pool.query('SELECT * FROM menu_items ORDER BY name ASC');
  return rows;
};

const getMenuItemById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM menu_items WHERE id = $1', [id]);
  return rows[0];
};

const getMenuItemsByRestaurant = async (restaurantId) => {
  const query = `
    SELECT m.*, c.name as category_name
    FROM menu_items m
    LEFT JOIN menu_categories c ON m.category_id = c.id
    WHERE m.restaurant_id = $1 
    ORDER BY c.name, m.name ASC
  `;
  const { rows } = await pool.query(query, [restaurantId]);
  return rows;
};

const createMenuItem = async (itemData) => {
  const { restaurant_id, category_id, name, description, price, discount_price, preparation_time, calories, is_vegetarian, is_available, image_url } = itemData;
  const query = `
    INSERT INTO menu_items (restaurant_id, category_id, name, description, price, discount_price, preparation_time, calories, is_vegetarian, is_available, image_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;
  const values = [restaurant_id, category_id, name, description, price, discount_price, preparation_time, calories, is_vegetarian, is_available, image_url];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const updateMenuItem = async (id, itemData) => {
  const { category_id, name, description, price, discount_price, preparation_time, calories, is_vegetarian, is_available, image_url } = itemData;
  const query = `
    UPDATE menu_items
    SET category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        discount_price = COALESCE($5, discount_price),
        preparation_time = COALESCE($6, preparation_time),
        calories = COALESCE($7, calories),
        is_vegetarian = COALESCE($8, is_vegetarian),
        is_available = COALESCE($9, is_available),
        image_url = COALESCE($10, image_url)
    WHERE id = $11
    RETURNING *
  `;
  const values = [category_id, name, description, price, discount_price, preparation_time, calories, is_vegetarian, is_available, image_url, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteMenuItem = async (id) => {
  const { rows } = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

module.exports = {
  getMenuItems,
  getMenuItemById,
  getMenuItemsByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
