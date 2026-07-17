const { pool } = require('../config/db');

const getMenuItems = async ({ trending = false, limit = 100, search = '' } = {}) => {
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 250);
  const { rows } = await pool.query(
    `SELECT
       m.*,
       c.name AS category_name,
       r.name AS restaurant_name,
       r.rating AS restaurant_rating,
       r.estimated_delivery_time
     FROM menu_items m
     LEFT JOIN menu_categories c ON m.category_id = c.id
     JOIN restaurants r ON r.id = m.restaurant_id AND r.is_active = TRUE
     WHERE (m.is_available IS NULL OR m.is_available = TRUE)
       AND ($1::boolean = FALSE OR m.is_trending = TRUE)
       AND ($2 = '' OR m.name ILIKE '%' || $2 || '%' OR m.description ILIKE '%' || $2 || '%')
     ORDER BY
       CASE WHEN m.is_trending THEN 0 ELSE 1 END,
       m.trending_score DESC,
       m.rating DESC,
       m.name ASC
     LIMIT $3`,
    [trending === true || trending === 'true', search.trim(), safeLimit]
  );
  return rows;
};

const getMenuItemById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       m.*,
       c.name AS category_name,
       r.name AS restaurant_name,
       r.rating AS restaurant_rating,
       r.estimated_delivery_time,
       r.image_url AS restaurant_image,
       r.logo_url AS restaurant_logo
     FROM menu_items m
     LEFT JOIN menu_categories c ON m.category_id = c.id
     JOIN restaurants r ON r.id = m.restaurant_id
     WHERE m.id = $1`,
    [id]
  );
  return rows[0];
};

const getMenuItemDetailsById = async (id) => {
  const item = await getMenuItemById(id);
  if (!item) return null;

  const [related, reviews, cuisines] = await Promise.all([
    pool.query(
      `SELECT DISTINCT
         other.id, other.name, other.description, other.price, other.discount_price,
         other.image_url, other.rating, other.is_vegetarian, r.name AS restaurant_name
       FROM cuisine_items mine
       JOIN cuisine_items linked ON linked.cuisine_id = mine.cuisine_id
       JOIN menu_items other ON other.id = linked.menu_item_id
       JOIN restaurants r ON r.id = other.restaurant_id
       WHERE mine.menu_item_id = $1
         AND other.id <> $1
         AND (other.is_available IS NULL OR other.is_available = TRUE)
       ORDER BY other.rating DESC, other.name
       LIMIT 8`,
      [id]
    ),
    pool.query(
      `SELECT rv.id, rv.rating, rv.comment, rv.created_at, u.full_name, u.profile_image_url
       FROM reviews rv
       JOIN users u ON u.id = rv.user_id
       WHERE rv.restaurant_id = $1
       ORDER BY rv.created_at DESC
       LIMIT 6`,
      [item.restaurant_id]
    ),
    pool.query(
      `SELECT rc.name, rc.slug
       FROM cuisine_items ci
       JOIN restaurant_categories rc ON rc.id = ci.cuisine_id
       WHERE ci.menu_item_id = $1
       ORDER BY rc.sort_order`,
      [id]
    ),
  ]);

  return {
    ...item,
    gallery_urls: Array.isArray(item.gallery_urls) && item.gallery_urls.length
      ? item.gallery_urls
      : [item.image_url],
    ingredients: item.ingredients
      ? item.ingredients.split(',').map((value) => value.trim()).filter(Boolean)
      : [],
    cuisines: cuisines.rows,
    reviews: reviews.rows,
    related_items: related.rows,
  };
};

const getMenuItemsByRestaurant = async (restaurantId) => {
  const query = `
    SELECT m.*, c.name as category_name
    FROM menu_items m
    LEFT JOIN menu_categories c ON m.category_id = c.id
    WHERE m.restaurant_id = $1
      AND (m.is_available IS NULL OR m.is_available = TRUE)
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
  getMenuItemDetailsById,
  getMenuItemsByRestaurant,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
