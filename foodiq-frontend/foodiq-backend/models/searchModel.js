const { pool } = require('../config/db');

const globalSearch = async (searchTerm) => {
  const query = `
    SELECT 'restaurant' as type, r.id, r.name, r.description, r.image_url,
           r.rating::text as rating, NULL::numeric as price, NULL::boolean as is_vegetarian,
           NULL::text as restaurant_name, r.estimated_delivery_time as preparation_time,
           NULL::text as slug, NULL::text as category_name
    FROM restaurants r
    WHERE (r.name ILIKE $1 OR r.description ILIKE $1) AND r.is_active = true

    UNION ALL

    SELECT 'menu_item' as type, m.id, m.name, m.description, m.image_url,
           m.rating::text as rating, COALESCE(m.discount_price, m.price) as price, m.is_vegetarian,
           r.name as restaurant_name, m.preparation_time,
           NULL::text as slug, NULL::text as category_name
    FROM menu_items m
    JOIN restaurants r ON m.restaurant_id = r.id
    WHERE (m.name ILIKE $1 OR m.description ILIKE $1)
      AND (m.is_available IS NULL OR m.is_available = true)
      AND r.is_active = true

    UNION ALL

    SELECT 'cuisine' as type, c.id, c.name, c.description, c.image_url,
           NULL::text as rating, NULL::numeric as price, NULL::boolean as is_vegetarian,
           NULL::text as restaurant_name, NULL::integer as preparation_time,
           c.slug, c.name as category_name
    FROM restaurant_categories c
    WHERE c.name ILIKE $1 OR c.slug ILIKE $1 OR c.description ILIKE $1

    LIMIT 40
  `;
  const { rows } = await pool.query(query, [`%${searchTerm}%`]);
  return rows;
};

module.exports = { globalSearch };
