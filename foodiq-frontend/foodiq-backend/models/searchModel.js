const { pool } = require('../config/db');

const globalSearch = async (searchTerm) => {
  const query = `
    SELECT 'restaurant' as type, r.id, r.name, r.description, r.image_url,
           r.rating::text as rating, NULL::numeric as price, NULL::boolean as is_vegetarian,
           NULL::text as restaurant_name, r.estimated_delivery_time as preparation_time,
           NULL::text as slug, rc.name as category_name, r.price_range, r.offer_text,
           r.distance_km
    FROM restaurants r
    LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
    WHERE (r.name ILIKE $1 OR r.description ILIKE $1 OR rc.name ILIKE $1) AND r.is_active = true

    UNION ALL

    SELECT 'menu_item' as type, m.id, m.name, m.description, m.image_url,
           m.rating::text as rating, COALESCE(m.discount_price, m.price) as price, m.is_vegetarian,
           r.name as restaurant_name, m.preparation_time,
           NULL::text as slug, NULL::text as category_name, NULL::integer as price_range,
           NULL::text as offer_text, NULL::numeric as distance_km
    FROM menu_items m
    JOIN restaurants r ON m.restaurant_id = r.id
    WHERE (m.name ILIKE $1 OR m.description ILIKE $1)
      AND (m.is_available IS NULL OR m.is_available = true)
      AND r.is_active = true

    UNION ALL

    SELECT 'cuisine' as type, c.id, c.name, c.description, c.image_url,
           NULL::text as rating, NULL::numeric as price, NULL::boolean as is_vegetarian,
           NULL::text as restaurant_name, NULL::integer as preparation_time,
           c.slug, c.name as category_name, NULL::integer as price_range,
           NULL::text as offer_text, NULL::numeric as distance_km
    FROM restaurant_categories c
    WHERE c.name ILIKE $1 OR c.slug ILIKE $1 OR c.description ILIKE $1

    LIMIT 40
  `;
  const { rows } = await pool.query(query, [`%${searchTerm}%`]);
  return rows;
};

/**
 * Lightweight autosuggest — prefix-biased, capped.
 */
const suggestSearch = async (searchTerm, limit = 8) => {
  const q = String(searchTerm || '').trim();
  if (!q || q.length < 2) return [];
  const lim = Math.min(Number(limit) || 8, 15);
  const prefix = `${q}%`;
  const contains = `%${q}%`;

  const { rows } = await pool.query(
    `
    (
      SELECT 'restaurant' AS type, r.id, r.name, r.image_url,
             r.rating::text AS subtitle, 1 AS rank_group
      FROM restaurants r
      WHERE r.is_active = TRUE AND (r.name ILIKE $1 OR r.name ILIKE $2)
      ORDER BY CASE WHEN r.name ILIKE $1 THEN 0 ELSE 1 END, r.rating DESC NULLS LAST
      LIMIT $3
    )
    UNION ALL
    (
      SELECT 'menu_item' AS type, m.id, m.name, m.image_url,
             r.name AS subtitle, 2 AS rank_group
      FROM menu_items m
      JOIN restaurants r ON r.id = m.restaurant_id
      WHERE r.is_active = TRUE
        AND (m.is_available IS NULL OR m.is_available = TRUE)
        AND (m.name ILIKE $1 OR m.name ILIKE $2)
      ORDER BY CASE WHEN m.name ILIKE $1 THEN 0 ELSE 1 END, m.rating DESC NULLS LAST
      LIMIT $3
    )
    UNION ALL
    (
      SELECT 'cuisine' AS type, c.id, c.name, c.image_url,
             c.slug AS subtitle, 3 AS rank_group
      FROM restaurant_categories c
      WHERE c.name ILIKE $1 OR c.name ILIKE $2 OR c.slug ILIKE $1
      ORDER BY CASE WHEN c.name ILIKE $1 THEN 0 ELSE 1 END
      LIMIT $3
    )
    ORDER BY rank_group, name
    LIMIT $3
    `,
    [prefix, contains, lim]
  );
  return rows;
};

module.exports = { globalSearch, suggestSearch };
