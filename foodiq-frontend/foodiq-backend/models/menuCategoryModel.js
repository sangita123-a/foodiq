const { pool } = require('../config/db');

const getMenuCategories = async () => {
  const { rows } = await pool.query('SELECT * FROM menu_categories ORDER BY name ASC');
  return rows;
};

const getMenuCategoryById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM menu_categories WHERE id = $1', [id]);
  return rows[0];
};

const createMenuCategory = async (categoryData) => {
  const { restaurant_id, name, description } = categoryData;
  const query = `
    INSERT INTO menu_categories (restaurant_id, name, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [restaurant_id, name, description]);
  return rows[0];
};

const updateMenuCategory = async (id, categoryData) => {
  const { name, description } = categoryData;
  const query = `
    UPDATE menu_categories
    SET name = COALESCE($1, name),
        description = COALESCE($2, description)
    WHERE id = $3
    RETURNING *
  `;
  const { rows } = await pool.query(query, [name, description, id]);
  return rows[0];
};

const deleteMenuCategory = async (id) => {
  const { rows } = await pool.query('DELETE FROM menu_categories WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

module.exports = {
  getMenuCategories,
  getMenuCategoryById,
  createMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
};
