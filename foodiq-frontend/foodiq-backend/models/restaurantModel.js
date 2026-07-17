const { pool } = require('../config/db');

const buildGetRestaurantsQuery = (filters) => {
  const { search, category, rating, deliveryTime, priceRange, sort, page, limit } = filters;
  
  let query = `
    SELECT
      r.*,
      rc.name AS category_name,
      rc.slug AS category_slug,
      (SELECT COUNT(*)::int FROM reviews rv WHERE rv.restaurant_id = r.id) AS review_count
    FROM restaurants r
    LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
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
      query += ` AND (rc.slug = $${valueIndex} OR rc.id::text = $${valueIndex})`;
      values.push(categories[0]);
      valueIndex++;
    } else if (categories.length > 1) {
      query += ` AND rc.slug = ANY($${valueIndex}::text[])`;
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
    values.push(parseInt(deliveryTime));
    valueIndex++;
  }

  if (priceRange) {
    query += ` AND r.price_range = $${valueIndex}`;
    values.push(parseInt(priceRange));
    valueIndex++;
  }

  switch (sort) {
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
    default:
      query += ' ORDER BY r.created_at DESC';
  }

  const limitVal = parseInt(limit) || 10;
  const pageVal = parseInt(page) || 1;
  const offset = (pageVal - 1) * limitVal;

  query += ` LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
  values.push(limitVal, offset);

  return { query, values, limit: limitVal, page: pageVal };
};

const getRestaurants = async (filters) => {
  const { query, values, limit, page } = buildGetRestaurantsQuery(filters);
  const { rows } = await pool.query(query, values);
  
  // Get total count for pagination
  const countQuery = `SELECT COUNT(*) FROM (${query.split('ORDER BY')[0]}) filtered`;
  const countValues = values.slice(0, values.length - 2); // Remove limit and offset
  const { rows: countRows } = await pool.query(countQuery, countValues);
  
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
       (SELECT COUNT(*)::int FROM reviews rv WHERE rv.restaurant_id = r.id) AS review_count
     FROM restaurants r
     LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
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
