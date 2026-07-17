const { pool } = require('../config/db');

const getAllCuisines = async () => {
  const { rows } = await pool.query(`
    SELECT
      rc.id,
      rc.name,
      rc.slug,
      rc.description,
      rc.image_url,
      rc.sort_order,
      ARRAY(
        SELECT m2.image_url
        FROM cuisine_items ci2
        JOIN menu_items m2 ON m2.id = ci2.menu_item_id
        WHERE ci2.cuisine_id = rc.id
          AND (m2.is_available IS NULL OR m2.is_available = TRUE)
        ORDER BY ci2.display_order ASC
        LIMIT 4
      ) AS preview_images,
      COUNT(DISTINCT rest.id) FILTER (WHERE rest.is_active = TRUE) AS restaurant_count,
      COUNT(DISTINCT ci.menu_item_id) AS item_count
    FROM restaurant_categories rc
    LEFT JOIN cuisine_items ci ON ci.cuisine_id = rc.id
    LEFT JOIN (
      SELECT rc2.id AS cuisine_id, r.id AS restaurant_id
      FROM restaurant_categories rc2
      INNER JOIN restaurants r ON r.category_id = rc2.id
      UNION
      SELECT ci2.cuisine_id, m.restaurant_id
      FROM cuisine_items ci2
      INNER JOIN menu_items m ON ci2.menu_item_id = m.id
    ) cuisine_rests ON cuisine_rests.cuisine_id = rc.id
    LEFT JOIN restaurants rest ON rest.id = cuisine_rests.restaurant_id
    WHERE rc.slug IS NOT NULL
    GROUP BY rc.id
    ORDER BY rc.sort_order ASC, rc.name ASC
  `);
  return rows.map((row) => ({
    ...row,
    restaurant_count: parseInt(row.restaurant_count, 10) || 0,
    item_count: parseInt(row.item_count, 10) || 0,
  }));
};

const getCuisineBySlug = async (slug) => {
  const { rows } = await pool.query(
    `
    SELECT
      rc.id,
      rc.name,
      rc.slug,
      rc.description,
      rc.image_url,
      ARRAY(
        SELECT m2.image_url
        FROM cuisine_items ci2
        JOIN menu_items m2 ON m2.id = ci2.menu_item_id
        WHERE ci2.cuisine_id = rc.id
          AND (m2.is_available IS NULL OR m2.is_available = TRUE)
        ORDER BY ci2.display_order ASC
        LIMIT 4
      ) AS preview_images,
      COUNT(DISTINCT rest.id) FILTER (WHERE rest.is_active = TRUE) AS restaurant_count,
      COUNT(DISTINCT ci.menu_item_id) AS item_count
    FROM restaurant_categories rc
    LEFT JOIN cuisine_items ci ON ci.cuisine_id = rc.id
    LEFT JOIN (
      SELECT rc2.id AS cuisine_id, r.id AS restaurant_id
      FROM restaurant_categories rc2
      INNER JOIN restaurants r ON r.category_id = rc2.id
      UNION
      SELECT ci2.cuisine_id, m.restaurant_id
      FROM cuisine_items ci2
      INNER JOIN menu_items m ON ci2.menu_item_id = m.id
    ) cuisine_rests ON cuisine_rests.cuisine_id = rc.id
    LEFT JOIN restaurants rest ON rest.id = cuisine_rests.restaurant_id
    WHERE rc.slug = $1
    GROUP BY rc.id
    `,
    [slug]
  );
  if (!rows[0]) return null;
  return {
    ...rows[0],
    restaurant_count: parseInt(rows[0].restaurant_count, 10) || 0,
    item_count: parseInt(rows[0].item_count, 10) || 0,
  };
};

const getCuisineItems = async (slug) => {
  const { rows } = await pool.query(
    `
    SELECT
      m.id AS menu_item_id,
      m.name,
      m.description,
      m.price,
      m.discount_price,
      m.image_url,
      m.is_vegetarian,
      ci.display_order,
      r.id AS restaurant_id,
      r.name AS restaurant_name,
      r.rating AS restaurant_rating,
      r.estimated_delivery_time
    FROM cuisine_items ci
    JOIN restaurant_categories rc ON ci.cuisine_id = rc.id
    JOIN menu_items m ON ci.menu_item_id = m.id
    JOIN restaurants r ON m.restaurant_id = r.id
    WHERE rc.slug = $1 AND (m.is_available IS NULL OR m.is_available = TRUE)
    ORDER BY ci.display_order ASC, m.name ASC
    `,
    [slug]
  );

  return rows.map((item) => {
    const originalPrice = parseFloat(item.price);
    const discountedPrice = item.discount_price
      ? parseFloat(item.discount_price)
      : originalPrice;
    return {
      ...item,
      original_price: originalPrice,
      discounted_price: discountedPrice,
      rating: item.restaurant_rating || 4.5,
      delivery_time: `${item.estimated_delivery_time || 30} min`,
    };
  });
};

module.exports = {
  getAllCuisines,
  getCuisineBySlug,
  getCuisineItems,
};
