const { pool } = require('../config/db');

const getCategories = async () => {
  const { rows } = await pool.query('SELECT * FROM restaurant_categories ORDER BY name ASC');
  return rows;
};

const getCategoryById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM restaurant_categories WHERE id = $1', [id]);
  return rows[0];
};

const createCategory = async (categoryData) => {
  const { name, description, image_url } = categoryData;
  const query = `
    INSERT INTO restaurant_categories (name, description, image_url)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [name, description, image_url]);
  return rows[0];
};

const updateCategory = async (id, categoryData) => {
  const { name, description, image_url } = categoryData;
  const query = `
    UPDATE restaurant_categories
    SET name = COALESCE($1, name),
        description = COALESCE($2, description),
        image_url = COALESCE($3, image_url)
    WHERE id = $4
    RETURNING *
  `;
  const { rows } = await pool.query(query, [name, description, image_url, id]);
  return rows[0];
};

const deleteCategory = async (id) => {
  const { rows } = await pool.query('DELETE FROM restaurant_categories WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
