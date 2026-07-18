const { pool } = require('../config/db');

const getDashboardStats = async () => {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer') AS total_users,
      (SELECT COUNT(*)::int FROM restaurants) AS total_restaurants,
      (SELECT COUNT(*)::int FROM orders) AS total_orders,
      (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders
        WHERE LOWER(status) NOT IN ('cancelled', 'pending', 'rejected')) AS total_revenue,
      (SELECT COUNT(*)::int FROM orders WHERE created_at::date = CURRENT_DATE) AS todays_orders,
      (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders
        WHERE created_at::date = CURRENT_DATE
          AND LOWER(status) NOT IN ('cancelled', 'pending', 'rejected')) AS todays_revenue,
      (SELECT COUNT(*)::int FROM delivery_partners WHERE is_available = TRUE
        AND COALESCE(approval_status, 'approved') = 'approved') AS active_delivery_partners,
      (SELECT COUNT(*)::int FROM restaurants
        WHERE COALESCE(approval_status, 'approved') = 'pending') AS pending_restaurant_approvals,
      (SELECT COUNT(*)::int FROM delivery_partners
        WHERE COALESCE(approval_status, 'approved') = 'pending') AS pending_partner_approvals,
      (SELECT COUNT(*)::int FROM orders
        WHERE LOWER(status) NOT IN ('delivered', 'cancelled')) AS active_orders,
      (SELECT COUNT(*)::int FROM orders WHERE LOWER(status) = 'delivered') AS delivered_orders,
      (SELECT COUNT(*)::int FROM orders WHERE LOWER(status) = 'cancelled') AS cancelled_orders
  `);

  const weekly = await pool.query(`
    SELECT created_at::date AS day,
           COUNT(*)::int AS orders,
           COALESCE(SUM(total_amount) FILTER (
             WHERE LOWER(status) NOT IN ('cancelled', 'pending', 'rejected')
           ), 0)::float AS revenue
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY 1 ORDER BY 1
  `);

  const monthly = await pool.query(`
    SELECT date_trunc('month', created_at)::date AS month,
           COUNT(*)::int AS orders,
           COALESCE(SUM(total_amount) FILTER (
             WHERE LOWER(status) NOT IN ('cancelled', 'pending', 'rejected')
           ), 0)::float AS revenue
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '11 months'
    GROUP BY 1 ORDER BY 1
  `);

  return { ...rows[0], weekly: weekly.rows, monthly: monthly.rows };
};

const listRestaurants = async ({ search = '', status = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, rc.name AS category_name,
       (SELECT COUNT(*)::int FROM orders o WHERE o.restaurant_id = r.id) AS order_count,
       (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders o
         WHERE o.restaurant_id = r.id AND LOWER(o.status) = 'delivered') AS revenue
     FROM restaurants r
     LEFT JOIN users u ON u.id = r.owner_id
     LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
     WHERE ($1 = '' OR r.name ILIKE '%' || $1 || '%' OR r.address ILIKE '%' || $1 || '%')
       AND ($2 = '' OR COALESCE(r.approval_status, 'approved') = $2)
     ORDER BY r.created_at DESC`,
    [search.trim(), status]
  );
  return rows;
};

const updateRestaurant = async (id, data) => {
  const {
    name, description, address, phone, image_url, logo_url, banner_url,
    is_active, approval_status, estimated_delivery_time, category_id,
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
       is_active = COALESCE($8, is_active),
       approval_status = COALESCE($9, approval_status),
       estimated_delivery_time = COALESCE($10, estimated_delivery_time),
       category_id = COALESCE($11, category_id),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $12 RETURNING *`,
    [
      name, description, address, phone, image_url, logo_url, banner_url,
      is_active, approval_status, estimated_delivery_time, category_id, id,
    ]
  );
  return rows[0] || null;
};

const deleteRestaurant = async (id) => {
  const { rows } = await pool.query('DELETE FROM restaurants WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

const getRestaurantPerformance = async (id) => {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total_orders,
       COUNT(*) FILTER (WHERE LOWER(status) = 'delivered')::int AS delivered,
       COUNT(*) FILTER (WHERE LOWER(status) = 'cancelled')::int AS cancelled,
       COALESCE(SUM(total_amount) FILTER (WHERE LOWER(status) = 'delivered'), 0)::float AS revenue,
       COALESCE(AVG(total_amount) FILTER (WHERE LOWER(status) = 'delivered'), 0)::float AS avg_order_value
     FROM orders WHERE restaurant_id = $1`,
    [id]
  );
  const top = await pool.query(
    `SELECT m.id, m.name, m.image_url, SUM(oi.quantity)::int AS qty
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.restaurant_id = $1
     GROUP BY m.id ORDER BY qty DESC LIMIT 5`,
    [id]
  );
  return { stats: rows[0], top_dishes: top.rows };
};

const listUsers = async ({ search = '', role = 'customer', suspended = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.full_name, u.phone_number, u.role, u.profile_image_url,
            u.is_suspended, u.created_at,
            (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders o
              WHERE o.user_id = u.id AND LOWER(o.status) = 'delivered') AS spent
     FROM users u
     WHERE ($1 = '' OR u.role = $1)
       AND ($2 = '' OR u.full_name ILIKE '%' || $2 || '%' OR u.email ILIKE '%' || $2 || '%' OR u.phone_number ILIKE '%' || $2 || '%')
       AND ($3 = '' OR ($3 = 'true' AND u.is_suspended = TRUE) OR ($3 = 'false' AND COALESCE(u.is_suspended, FALSE) = FALSE))
     ORDER BY u.created_at DESC
     LIMIT 500`,
    [role, search.trim(), suspended]
  );
  return rows;
};

const updateUser = async (id, data) => {
  const { is_suspended, full_name, phone_number, role } = data;
  const { rows } = await pool.query(
    `UPDATE users SET
       is_suspended = COALESCE($1, is_suspended),
       full_name = COALESCE($2, full_name),
       phone_number = COALESCE($3, phone_number),
       role = COALESCE($4, role),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND role <> 'admin'
     RETURNING id, email, full_name, phone_number, role, is_suspended, created_at`,
    [is_suspended, full_name, phone_number, role, id]
  );
  return rows[0] || null;
};

const deleteUser = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role <> 'admin' RETURNING id`,
    [id]
  );
  return rows[0];
};

const getUserOrders = async (userId) => {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_amount, o.created_at, r.name AS restaurant_name
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return rows;
};

const listDeliveryPartners = async ({ search = '', status = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT dp.*, u.full_name, u.email, u.phone_number, u.is_suspended,
       (SELECT COUNT(*)::int FROM order_tracking ot WHERE ot.delivery_partner_id = dp.id) AS delivery_count
     FROM delivery_partners dp
     JOIN users u ON u.id = dp.user_id
     WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
       AND ($2 = '' OR COALESCE(dp.approval_status, 'approved') = $2)
     ORDER BY dp.created_at DESC`,
    [search.trim(), status]
  );
  return rows;
};

const updateDeliveryPartner = async (id, data) => {
  const { is_available, approval_status, vehicle_details, vehicle_type, license_number } = data;
  const { rows } = await pool.query(
    `UPDATE delivery_partners SET
       is_available = COALESCE($1, is_available),
       approval_status = COALESCE($2, approval_status),
       vehicle_details = COALESCE($3, vehicle_details),
       vehicle_type = COALESCE($4, vehicle_type),
       license_number = COALESCE($5, license_number),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 RETURNING *`,
    [is_available, approval_status, vehicle_details, vehicle_type, license_number, id]
  );
  return rows[0] || null;
};

const listOrders = async ({ search = '', status = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT o.*, u.full_name AS customer_name, u.phone_number AS customer_phone,
            r.name AS restaurant_name,
            p.method AS payment_method, p.status AS payment_status, p.id AS payment_id,
            ot.delivery_partner_id,
            dp_user.full_name AS delivery_partner_name
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN restaurants r ON r.id = o.restaurant_id
     LEFT JOIN payments p ON p.order_id = o.id
     LEFT JOIN order_tracking ot ON ot.order_id = o.id
     LEFT JOIN delivery_partners dp ON dp.id = ot.delivery_partner_id
     LEFT JOIN users dp_user ON dp_user.id = dp.user_id
     WHERE ($1 = '' OR CAST(o.id AS TEXT) ILIKE '%' || $1 || '%' OR u.full_name ILIKE '%' || $1 || '%' OR r.name ILIKE '%' || $1 || '%')
       AND ($2 = '' OR LOWER(o.status) = LOWER($2))
     ORDER BY o.created_at DESC
     LIMIT 300`,
    [search.trim(), status]
  );
  return rows;
};

const getOrderDetails = async (id) => {
  const { rows } = await pool.query(
    `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone_number AS customer_phone,
            r.name AS restaurant_name, r.phone AS restaurant_phone,
            a.street, a.house_no, a.city, a.state, a.zip_code,
            p.method AS payment_method, p.status AS payment_status, p.id AS payment_id, p.amount AS payment_amount,
            ot.delivery_partner_id, ot.current_status AS tracking_status
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN restaurants r ON r.id = o.restaurant_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     LEFT JOIN payments p ON p.order_id = o.id
     LEFT JOIN order_tracking ot ON ot.order_id = o.id
     WHERE o.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const items = await pool.query(
    `SELECT oi.*, m.name, m.image_url FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id WHERE oi.order_id = $1`,
    [id]
  );
  return { ...rows[0], items: items.rows };
};

const updateOrderAdmin = async (id, { status, delivery_partner_id }) => {
  let order;
  if (status) {
    const { rows } = await pool.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    order = rows[0];
  } else {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    order = rows[0];
  }
  if (!order) return null;

  if (delivery_partner_id) {
    await pool.query(
      `INSERT INTO order_tracking (order_id, delivery_partner_id, current_status, estimated_delivery_time)
       VALUES ($1, $2, COALESCE($3, 'Assigned'), CURRENT_TIMESTAMP + INTERVAL '30 minutes')
       ON CONFLICT (order_id) DO UPDATE SET
         delivery_partner_id = EXCLUDED.delivery_partner_id,
         current_status = COALESCE($3, order_tracking.current_status),
         updated_at = CURRENT_TIMESTAMP`,
      [id, delivery_partner_id, status || null]
    );
    const expires = new Date(Date.now() + 120 * 1000);
    await pool.query(
      `INSERT INTO delivery_assignments (order_id, delivery_partner_id, status, offered_at, expires_at)
       VALUES ($1, $2, 'offered', CURRENT_TIMESTAMP, $3)`,
      [id, delivery_partner_id, expires]
    ).catch(() => {});
    try {
      const { createNotification } = require('./notificationModel');
      const partner = await pool.query('SELECT user_id FROM delivery_partners WHERE id = $1', [delivery_partner_id]);
      if (partner.rows[0]) {
        await createNotification(
          partner.rows[0].user_id,
          'delivery',
          'New Delivery Request',
          `Admin assigned you order #${String(id).slice(0, 8)}. Accept within 2 minutes.`,
          { order_id: id }
        );
      }
    } catch {
      /* ignore */
    }
  } else if (status) {
    await pool.query(
      `INSERT INTO order_tracking (order_id, current_status, estimated_delivery_time)
       VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
       ON CONFLICT (order_id) DO UPDATE SET
         current_status = EXCLUDED.current_status,
         updated_at = CURRENT_TIMESTAMP`,
      [id, status]
    ).catch(() => {});
  }
  return getOrderDetails(id);
};

const refundOrder = async (orderId) => {
  const { rows } = await pool.query(
    `UPDATE payments SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
     WHERE order_id = $1 RETURNING *`,
    [orderId]
  );
  if (rows[0]) {
    await pool.query(
      `UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [orderId]
    );
  }
  return rows[0] || null;
};

const listMenuItems = async ({ search = '', restaurant_id = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT m.*, r.name AS restaurant_name, c.name AS category_name
     FROM menu_items m
     JOIN restaurants r ON r.id = m.restaurant_id
     LEFT JOIN menu_categories c ON c.id = m.category_id
     WHERE ($1 = '' OR m.name ILIKE '%' || $1 || '%')
       AND ($2 = '' OR m.restaurant_id::text = $2)
     ORDER BY m.updated_at DESC NULLS LAST
     LIMIT 400`,
    [search.trim(), restaurant_id]
  );
  return rows;
};

const deleteMenuItem = async (id) => {
  const { rows } = await pool.query('DELETE FROM menu_items WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

const listCategories = async () => {
  const { rows } = await pool.query(
    `SELECT rc.*,
       (SELECT COUNT(*)::int FROM restaurants r WHERE r.category_id = rc.id) AS restaurant_count
     FROM restaurant_categories rc
     ORDER BY rc.sort_order NULLS LAST, rc.name`
  );
  return rows;
};

const listCoupons = async () => {
  const { rows } = await pool.query(
    `SELECT c.*,
       (SELECT COUNT(*)::int FROM coupon_usage cu WHERE cu.coupon_id = c.id) AS usage_count
     FROM coupons c ORDER BY c.created_at DESC`
  );
  return rows;
};

const createCoupon = async (data) => {
  const {
    code, discount_amount, discount_type, min_order_amount, max_discount_amount,
    usage_limit, valid_from, valid_until, is_active,
  } = data;
  const { rows } = await pool.query(
    `INSERT INTO coupons (
       code, discount_amount, discount_type, min_order_amount, max_discount_amount,
       usage_limit, valid_from, valid_until, is_active
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9, TRUE)) RETURNING *`,
    [
      String(code).toUpperCase().trim(),
      discount_amount,
      discount_type || 'percentage',
      min_order_amount || 0,
      max_discount_amount || null,
      usage_limit || null,
      valid_from || null,
      valid_until || null,
      is_active,
    ]
  );
  return rows[0];
};

const updateCoupon = async (id, data) => {
  const {
    code, discount_amount, discount_type, min_order_amount, max_discount_amount,
    usage_limit, valid_from, valid_until, is_active,
  } = data;
  const { rows } = await pool.query(
    `UPDATE coupons SET
       code = COALESCE($1, code),
       discount_amount = COALESCE($2, discount_amount),
       discount_type = COALESCE($3, discount_type),
       min_order_amount = COALESCE($4, min_order_amount),
       max_discount_amount = COALESCE($5, max_discount_amount),
       usage_limit = COALESCE($6, usage_limit),
       valid_from = COALESCE($7, valid_from),
       valid_until = COALESCE($8, valid_until),
       is_active = COALESCE($9, is_active),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $10 RETURNING *`,
    [
      code ? String(code).toUpperCase().trim() : null,
      discount_amount, discount_type, min_order_amount, max_discount_amount,
      usage_limit, valid_from, valid_until, is_active, id,
    ]
  );
  return rows[0] || null;
};

const deleteCoupon = async (id) => {
  const { rows } = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

const getAnalytics = async () => {
  const topDishes = await pool.query(
    `SELECT m.id, m.name, m.image_url, r.name AS restaurant_name,
            SUM(oi.quantity)::int AS orders_count,
            SUM(oi.quantity * oi.price_at_time)::float AS revenue
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     JOIN restaurants r ON r.id = m.restaurant_id
     GROUP BY m.id, r.name
     ORDER BY orders_count DESC LIMIT 10`
  );

  const restaurantPerf = await pool.query(
    `SELECT r.id, r.name, r.rating,
            COUNT(o.id)::int AS orders,
            COALESCE(SUM(o.total_amount) FILTER (WHERE LOWER(o.status) = 'delivered'), 0)::float AS revenue
     FROM restaurants r
     LEFT JOIN orders o ON o.restaurant_id = r.id
     GROUP BY r.id
     ORDER BY revenue DESC LIMIT 10`
  );

  const customerGrowth = await pool.query(
    `SELECT date_trunc('week', created_at)::date AS week, COUNT(*)::int AS users
     FROM users WHERE role = 'customer'
       AND created_at >= CURRENT_DATE - INTERVAL '12 weeks'
     GROUP BY 1 ORDER BY 1`
  );

  const peakHours = await pool.query(
    `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS orders
     FROM orders
     WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
     GROUP BY 1 ORDER BY 1`
  );

  const salesDaily = await pool.query(
    `SELECT created_at::date AS day, COUNT(*)::int AS orders,
            COALESCE(SUM(total_amount) FILTER (WHERE LOWER(status) = 'delivered'), 0)::float AS revenue
     FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '13 days'
     GROUP BY 1 ORDER BY 1`
  );

  return {
    top_dishes: topDishes.rows,
    restaurant_performance: restaurantPerf.rows,
    customer_growth: customerGrowth.rows,
    peak_hours: peakHours.rows,
    sales_daily: salesDaily.rows,
  };
};

const broadcastNotification = async ({ audience, title, message }) => {
  let userQuery = 'SELECT id, role FROM users';
  if (audience === 'customers') userQuery += ` WHERE role = 'customer'`;
  else if (audience === 'restaurants') userQuery += ` WHERE role = 'restaurant_owner'`;
  else if (audience === 'delivery') userQuery += ` WHERE role = 'delivery_partner'`;
  else userQuery += ` WHERE role IN ('customer', 'restaurant_owner', 'delivery_partner')`;

  const users = await pool.query(userQuery);
  const { notify } = require('../services/notificationService');
  let created = 0;
  for (const u of users.rows) {
    await notify({
      userId: u.id,
      type: 'coupon_alert',
      title,
      message,
      role: u.role,
      link: '/notifications',
      dedupeKey: `broadcast:${u.id}:${Date.now()}`,
    });
    created += 1;
  }
  return { sent: created };
};

const getSettings = async () => {
  const { rows } = await pool.query('SELECT * FROM admin_settings WHERE id = 1');
  if (rows[0]) return rows[0];
  const inserted = await pool.query(
    `INSERT INTO admin_settings (id) VALUES (1) RETURNING *`
  );
  return inserted.rows[0];
};

const updateSettings = async (data) => {
  const {
    delivery_charge, free_delivery_min, tax_percent, commission_percent,
    app_name, support_email, support_phone, payment_cod_enabled,
    payment_upi_enabled, payment_card_enabled, payment_razorpay_enabled,
  } = data;
  await getSettings();
  const { rows } = await pool.query(
    `UPDATE admin_settings SET
       delivery_charge = COALESCE($1, delivery_charge),
       free_delivery_min = COALESCE($2, free_delivery_min),
       tax_percent = COALESCE($3, tax_percent),
       commission_percent = COALESCE($4, commission_percent),
       app_name = COALESCE($5, app_name),
       support_email = COALESCE($6, support_email),
       support_phone = COALESCE($7, support_phone),
       payment_cod_enabled = COALESCE($8, payment_cod_enabled),
       payment_upi_enabled = COALESCE($9, payment_upi_enabled),
       payment_card_enabled = COALESCE($10, payment_card_enabled),
       payment_razorpay_enabled = COALESCE($11, payment_razorpay_enabled),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = 1 RETURNING *`,
    [
      delivery_charge, free_delivery_min, tax_percent, commission_percent,
      app_name, support_email, support_phone, payment_cod_enabled,
      payment_upi_enabled, payment_card_enabled, payment_razorpay_enabled,
    ]
  );
  return rows[0];
};

module.exports = {
  getDashboardStats,
  listRestaurants,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantPerformance,
  listUsers,
  updateUser,
  deleteUser,
  getUserOrders,
  listDeliveryPartners,
  updateDeliveryPartner,
  listOrders,
  getOrderDetails,
  updateOrderAdmin,
  refundOrder,
  listMenuItems,
  deleteMenuItem,
  listCategories,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getAnalytics,
  broadcastNotification,
  getSettings,
  updateSettings,
};
