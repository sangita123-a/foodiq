const { pool } = require('../config/db');

const getRestaurantByOwnerId = async (ownerId) => {
  const { rows } = await pool.query(
    `SELECT r.*, rc.name AS category_name, rc.slug AS category_slug
     FROM restaurants r
     LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
     WHERE r.owner_id = $1
     ORDER BY r.created_at ASC
     LIMIT 1`,
    [ownerId]
  );
  return rows[0] || null;
};

const getDashboardStats = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total_orders,
       COUNT(*) FILTER (
         WHERE created_at::date = CURRENT_DATE
       )::int AS todays_orders,
       COALESCE(SUM(total_amount) FILTER (
         WHERE created_at::date = CURRENT_DATE
           AND LOWER(status) NOT IN ('cancelled', 'rejected', 'pending')
       ), 0)::float AS todays_revenue,
       COALESCE(SUM(total_amount) FILTER (
         WHERE LOWER(status) NOT IN ('cancelled', 'rejected', 'pending')
       ), 0)::float AS total_revenue,
       COUNT(*) FILTER (
         WHERE LOWER(status) IN ('pending', 'accepted', 'preparing', 'ready for pickup')
       )::int AS pending_orders,
       COUNT(*) FILTER (
         WHERE LOWER(status) = 'delivered'
       )::int AS completed_orders
     FROM orders
     WHERE restaurant_id = $1`,
    [restaurantId]
  );

  const menu = await pool.query(
    `SELECT COUNT(*)::int AS active_menu_items
     FROM menu_items
     WHERE restaurant_id = $1
       AND (is_available IS NULL OR is_available = TRUE)`,
    [restaurantId]
  );

  const restaurant = await pool.query(
    `SELECT rating FROM restaurants WHERE id = $1`,
    [restaurantId]
  );

  return {
    ...rows[0],
    active_menu_items: menu.rows[0]?.active_menu_items || 0,
    average_rating: Number(restaurant.rows[0]?.rating || 0),
  };
};

const getTopDishes = async (restaurantId, limit = 5) => {
  const { rows } = await pool.query(
    `SELECT
       m.id,
       m.name,
       m.image_url,
       m.price,
       m.rating,
       COALESCE(SUM(oi.quantity), 0)::int AS orders_count,
       COALESCE(SUM(oi.quantity * oi.price_at_time), 0)::float AS revenue
     FROM menu_items m
     LEFT JOIN order_items oi ON oi.menu_item_id = m.id
     LEFT JOIN orders o ON o.id = oi.order_id AND o.restaurant_id = m.restaurant_id
     WHERE m.restaurant_id = $1
     GROUP BY m.id
     ORDER BY orders_count DESC, m.rating DESC NULLS LAST
     LIMIT $2`,
    [restaurantId, limit]
  );
  return rows;
};

const getRecentOrders = async (restaurantId, limit = 10) => {
  const { rows } = await pool.query(
    `SELECT
       o.id,
       o.status,
       o.subtotal,
       o.discount_amount,
       o.delivery_fee,
       o.total_amount,
       o.delivery_instructions,
       o.created_at,
       u.full_name AS customer_name,
       u.phone_number AS customer_phone,
       a.street,
       a.house_no,
       a.city,
       a.state,
       a.zip_code,
       p.method AS payment_method,
       p.status AS payment_status
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.restaurant_id = $1
     ORDER BY o.created_at DESC
     LIMIT $2`,
    [restaurantId, limit]
  );

  for (const order of rows) {
    const items = await pool.query(
      `SELECT oi.id, oi.quantity, oi.price_at_time, m.name
       FROM order_items oi
       JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE oi.order_id = $1`,
      [order.id]
    );
    order.items = items.rows;
  }

  return rows;
};

const getPartnerOrders = async (restaurantId) => {
  return getRecentOrders(restaurantId, 200);
};

const getPartnerOrderById = async (orderId, restaurantId) => {
  const { rows } = await pool.query(
    `SELECT
       o.*,
       u.full_name AS customer_name,
       u.phone_number AS customer_phone,
       a.street,
       a.house_no,
       a.city,
       a.state,
       a.zip_code,
       p.method AS payment_method,
       p.status AS payment_status
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.id = $1 AND o.restaurant_id = $2`,
    [orderId, restaurantId]
  );
  if (!rows[0]) return null;
  const order = rows[0];
  const items = await pool.query(
    `SELECT oi.id, oi.quantity, oi.price_at_time, m.name
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  order.items = items.rows;
  return order;
};

const getMenuItemsForRestaurant = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT
       m.*,
       c.name AS category_name,
       COALESCE((
         SELECT SUM(oi.quantity)::int
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.menu_item_id = m.id AND o.restaurant_id = m.restaurant_id
       ), 0) AS orders_count
     FROM menu_items m
     LEFT JOIN menu_categories c ON c.id = m.category_id
     WHERE m.restaurant_id = $1
     ORDER BY m.updated_at DESC NULLS LAST, m.name ASC`,
    [restaurantId]
  );
  return rows;
};

const getAnalytics = async (restaurantId) => {
  const daily = await pool.query(
    `SELECT
       created_at::date AS day,
       COUNT(*)::int AS orders,
       COALESCE(SUM(total_amount) FILTER (
         WHERE LOWER(status) NOT IN ('cancelled', 'rejected', 'pending')
       ), 0)::float AS revenue
     FROM orders
     WHERE restaurant_id = $1
       AND created_at >= CURRENT_DATE - INTERVAL '13 days'
     GROUP BY created_at::date
     ORDER BY day ASC`,
    [restaurantId]
  );

  const weekly = await pool.query(
    `SELECT
       date_trunc('week', created_at)::date AS week_start,
       COUNT(*)::int AS orders,
       COALESCE(SUM(total_amount) FILTER (
         WHERE LOWER(status) NOT IN ('cancelled', 'rejected', 'pending')
       ), 0)::float AS revenue
     FROM orders
     WHERE restaurant_id = $1
       AND created_at >= CURRENT_DATE - INTERVAL '56 days'
     GROUP BY 1
     ORDER BY 1 ASC`,
    [restaurantId]
  );

  const monthly = await pool.query(
    `SELECT
       date_trunc('month', created_at)::date AS month_start,
       COUNT(*)::int AS orders,
       COALESCE(SUM(total_amount) FILTER (
         WHERE LOWER(status) NOT IN ('cancelled', 'rejected', 'pending')
       ), 0)::float AS revenue
     FROM orders
     WHERE restaurant_id = $1
       AND created_at >= CURRENT_DATE - INTERVAL '365 days'
     GROUP BY 1
     ORDER BY 1 ASC`,
    [restaurantId]
  );

  const topDishes = await getTopDishes(restaurantId, 8);

  return {
    daily: daily.rows,
    weekly: weekly.rows,
    monthly: monthly.rows,
    top_dishes: topDishes,
  };
};

const updateRestaurantProfile = async (restaurantId, ownerId, data) => {
  const {
    name,
    description,
    address,
    phone,
    image_url,
    logo_url,
    banner_url,
    estimated_delivery_time,
    delivery_radius_km,
    opening_hours,
    cuisine_types,
    is_active,
    category_id,
    min_order_amount,
  } = data;

  const { rows } = await pool.query(
    `UPDATE restaurants SET
       name = COALESCE($1, name),
       description = COALESCE($2, description),
       address = COALESCE($3, address),
       phone = COALESCE($4, phone),
       image_url = COALESCE($5, image_url),
       logo_url = COALESCE($6, logo_url),
       banner_url = COALESCE($7, banner_url),
       estimated_delivery_time = COALESCE($8, estimated_delivery_time),
       delivery_radius_km = COALESCE($9, delivery_radius_km),
       opening_hours = COALESCE($10, opening_hours),
       cuisine_types = COALESCE($11, cuisine_types),
       is_active = COALESCE($12, is_active),
       category_id = COALESCE($13, category_id),
       min_order_amount = COALESCE($14, min_order_amount),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $15 AND owner_id = $16
     RETURNING *`,
    [
      name,
      description,
      address,
      phone,
      image_url,
      logo_url,
      banner_url,
      estimated_delivery_time,
      delivery_radius_km,
      opening_hours ? JSON.stringify(opening_hours) : null,
      cuisine_types ? JSON.stringify(cuisine_types) : null,
      is_active,
      category_id,
      min_order_amount,
      restaurantId,
      ownerId,
    ]
  );
  return rows[0] || null;
};

const getMenuCategoriesForRestaurant = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT id, name, description
     FROM menu_categories
     WHERE restaurant_id = $1
     ORDER BY name ASC`,
    [restaurantId]
  );
  return rows;
};

const ensureMenuCategory = async (restaurantId, name) => {
  const { rows } = await pool.query(
    `INSERT INTO menu_categories (restaurant_id, name, description)
     VALUES ($1, $2, $3)
     ON CONFLICT (restaurant_id, name)
     DO UPDATE SET description = COALESCE(EXCLUDED.description, menu_categories.description)
     RETURNING id, name`,
    [restaurantId, name, `${name} items`]
  );
  return rows[0];
};

module.exports = {
  getRestaurantByOwnerId,
  getDashboardStats,
  getTopDishes,
  getRecentOrders,
  getPartnerOrders,
  getPartnerOrderById,
  getMenuItemsForRestaurant,
  getAnalytics,
  updateRestaurantProfile,
  getMenuCategoriesForRestaurant,
  ensureMenuCategory,
};
