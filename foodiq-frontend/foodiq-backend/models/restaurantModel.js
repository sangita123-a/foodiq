const { pool } = require('../config/db');

const buildGetRestaurantsQuery = (filters) => {
  // Accept both camelCase and snake_case query params from UI
  const search = filters.search;
  const category = filters.category || filters.cuisine;
  const rating = filters.rating;
  const deliveryTime =
    filters.deliveryTime || filters.delivery_time || filters.max_delivery_time;
  const priceRange = filters.priceRange || filters.price_range;
  const sort = filters.sort;
  const page = filters.page;
  const limit = filters.limit;
  const isVeg =
    filters.is_veg === true ||
    filters.is_veg === 'true' ||
    filters.is_veg === '1' ||
    filters.pure_veg === 'true';
  const offersOnly =
    filters.offers_only === true ||
    filters.offers_only === 'true' ||
    filters.offersOnly === true;
  const openNow =
    filters.open_now === true ||
    filters.open_now === 'true' ||
    filters.openNow === true;

  let query = `
    SELECT
      r.*,
      rc.name AS category_name,
      rc.slug AS category_slug,
      COALESCE(rv.review_count, 0)::int AS review_count,
      NOT EXISTS (
        SELECT 1
        FROM menu_items m
        WHERE m.restaurant_id = r.id
          AND COALESCE(m.is_vegetarian, FALSE) = FALSE
          AND (m.is_available IS NULL OR m.is_available = TRUE)
      ) AS is_veg
    FROM restaurants r
    LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
    LEFT JOIN (
      SELECT restaurant_id, COUNT(*)::int AS review_count
      FROM reviews
      GROUP BY restaurant_id
    ) rv ON rv.restaurant_id = r.id
    WHERE r.is_active = true`;
  const values = [];
  let valueIndex = 1;

  if (search) {
    query += ` AND (r.name ILIKE $${valueIndex} OR r.description ILIKE $${valueIndex})`;
    values.push(`%${search}%`);
    valueIndex++;
  }

  if (category) {
    const categories = String(category)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (categories.length === 1) {
      query += ` AND (rc.slug = $${valueIndex} OR rc.id::text = $${valueIndex} OR rc.name ILIKE $${valueIndex})`;
      values.push(categories[0]);
      valueIndex++;
    } else if (categories.length > 1) {
      query += ` AND (rc.slug = ANY($${valueIndex}::text[]) OR rc.name ILIKE ANY($${valueIndex}::text[]))`;
      values.push(categories);
      valueIndex++;
    }
  }

  if (rating) {
    query += ` AND r.rating >= $${valueIndex}`;
    values.push(parseFloat(rating));
    valueIndex++;
  }

  if (deliveryTime) {
    query += ` AND r.estimated_delivery_time <= $${valueIndex}`;
    values.push(parseInt(deliveryTime, 10));
    valueIndex++;
  }

  if (priceRange) {
    query += ` AND r.price_range = $${valueIndex}`;
    values.push(parseInt(priceRange, 10));
    valueIndex++;
  }

  if (isVeg) {
    query += ` AND NOT EXISTS (
      SELECT 1 FROM menu_items m
      WHERE m.restaurant_id = r.id
        AND COALESCE(m.is_vegetarian, FALSE) = FALSE
        AND (m.is_available IS NULL OR m.is_available = TRUE)
    )`;
  }

  if (offersOnly) {
    query += ` AND (r.offer_text IS NOT NULL AND TRIM(r.offer_text) <> '')`;
  }

  // open_now reserved for future hours table — keep backward compatible (no hard filter)

  const normalizedSort =
    sort === 'price_low' || sort === 'price'
      ? 'price'
      : sort === 'delivery_time' || sort === 'deliveryTime'
        ? 'deliveryTime'
        : sort === 'newest'
          ? 'newest'
          : sort;

  switch (normalizedSort) {
    case 'popular':
      query += ' ORDER BY r.rating DESC, review_count DESC';
      break;
    case 'rating':
      query += ' ORDER BY r.rating DESC';
      break;
    case 'deliveryTime':
      query += ' ORDER BY r.estimated_delivery_time ASC';
      break;
    case 'price':
      query += ' ORDER BY r.price_range ASC';
      break;
    case 'newest':
      query += ' ORDER BY r.created_at DESC';
      break;
    default:
      query += ' ORDER BY r.created_at DESC';
  }

  const limitVal = parseInt(limit, 10) || 10;
  const pageVal = parseInt(page, 10) || 1;
  const offset = (pageVal - 1) * limitVal;

  query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
  values.push(limitVal, offset);

  return { query, values, limit: limitVal, page: pageVal };
};

const getRestaurants = async (filters) => {
  const { query, values, limit, page } = buildGetRestaurantsQuery(filters);
  const countQuery = `SELECT COUNT(*) FROM (${query.split('ORDER BY')[0]}) filtered`;
  const countValues = values.slice(0, values.length - 2); // Remove limit and offset

  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(query, values),
    pool.query(countQuery, countValues),
  ]);

  return {
    restaurants: rows,
    pagination: {
      total: parseInt(countRows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countRows[0].count) / limit)
    }
  };
};

const getRestaurantById = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       r.*,
       rc.name AS category_name,
       rc.slug AS category_slug,
       COALESCE(rv.review_count, 0)::int AS review_count
     FROM restaurants r
     LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
     LEFT JOIN (
       SELECT restaurant_id, COUNT(*)::int AS review_count
       FROM reviews
       GROUP BY restaurant_id
     ) rv ON rv.restaurant_id = r.id
     WHERE r.id = $1 AND r.is_active = TRUE`,
    [id]
  );
  return rows[0];
};

const createRestaurant = async (data) => {
  const { name, owner_id, category_id, description, address, phone, estimated_delivery_time, price_range, image_url } = data;
  const query = `
    INSERT INTO restaurants (name, owner_id, category_id, description, address, phone, estimated_delivery_time, price_range, image_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const values = [name, owner_id, category_id, description, address, phone, estimated_delivery_time, price_range, image_url];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const updateRestaurant = async (id, data) => {
  const { name, category_id, description, address, phone, estimated_delivery_time, price_range, is_active, image_url } = data;
  const query = `
    UPDATE restaurants
    SET name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        description = COALESCE($3, description),
        address = COALESCE($4, address),
        phone = COALESCE($5, phone),
        estimated_delivery_time = COALESCE($6, estimated_delivery_time),
        price_range = COALESCE($7, price_range),
        is_active = COALESCE($8, is_active),
        image_url = COALESCE($9, image_url)
    WHERE id = $10
    RETURNING *
  `;
  const values = [name, category_id, description, address, phone, estimated_delivery_time, price_range, is_active, image_url, id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteRestaurant = async (id) => {
  const { rows } = await pool.query('DELETE FROM restaurants WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

const updateRestaurantRating = async (id) => {
  const query = `
    UPDATE restaurants r
    SET rating = COALESCE((SELECT ROUND(AVG(rating), 1) FROM reviews WHERE restaurant_id = r.id), 0.0)
    WHERE id = $1
    RETURNING rating
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantRating
};
