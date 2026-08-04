const { pool } = require('../config/db');
const { SETTLEMENT_REVENUE_CTE, getCommissionRate } = require('./settlementModel');

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
      (SELECT COUNT(*)::int FROM orders WHERE LOWER(status) = 'cancelled') AS cancelled_orders,
      (SELECT COUNT(*)::int FROM menu_items) AS total_menu_items,
      (SELECT COUNT(*)::int FROM delivery_partners) AS total_delivery_partners,
      (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders
        WHERE created_at >= date_trunc('week', CURRENT_DATE)
          AND LOWER(status) NOT IN ('cancelled', 'pending', 'rejected')) AS weekly_revenue,
      (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
          AND LOWER(status) NOT IN ('cancelled', 'pending', 'rejected')) AS monthly_revenue,
      (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders
        WHERE created_at >= date_trunc('year', CURRENT_DATE)
          AND LOWER(status) NOT IN ('cancelled', 'pending', 'rejected')) AS yearly_revenue,
      (SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60), 0)::float
        FROM orders o
        WHERE LOWER(o.status) = 'delivered'
          AND o.created_at >= CURRENT_DATE - INTERVAL '30 days') AS avg_delivery_time_minutes,
      (SELECT COALESCE(AVG(r.rating), 0)::float FROM reviews r) AS customer_satisfaction
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

  // Today's live order-status pipeline (Preparing / Ready / Picked Up / On The Way / Delivered / Cancelled).
  const orderStatusToday = await pool.query(`
    SELECT LOWER(status) AS status, COUNT(*)::int AS count
    FROM orders
    WHERE created_at::date = CURRENT_DATE
    GROUP BY 1
  `);

  // New / returning / active / blocked customers.
  const customerInsights = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer'
        AND created_at::date = CURRENT_DATE) AS new_today,
      (SELECT COUNT(*)::int FROM users u WHERE u.role = 'customer'
        AND (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) > 1) AS returning,
      (SELECT COUNT(DISTINCT o.user_id)::int FROM orders o
        JOIN users u ON u.id = o.user_id
        WHERE u.role = 'customer' AND o.created_at >= CURRENT_DATE - INTERVAL '30 days') AS active_30d,
      (SELECT COUNT(*)::int FROM users WHERE role = 'customer'
        AND COALESCE(is_suspended, FALSE) = TRUE) AS blocked
  `);

  // Restaurant availability breakdown.
  const restaurantStatus = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = TRUE
        AND COALESCE(approval_status, 'approved') = 'approved')::int AS active,
      COUNT(*) FILTER (WHERE COALESCE(approval_status, 'approved') = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = FALSE
        OR COALESCE(approval_status, 'approved') = 'suspended')::int AS closed
    FROM restaurants
  `);

  // Top restaurants by trailing-30-day revenue, with rating and week-over-week growth.
  const topRestaurants = await pool.query(`
    SELECT r.id, r.name,
      COALESCE(cur.revenue, 0)::float AS revenue,
      COALESCE(cur.orders, 0)::int AS orders,
      COALESCE(rv.avg_rating, 0)::float AS rating,
      CASE WHEN COALESCE(prev.revenue, 0) > 0
        THEN ROUND((((COALESCE(cur.revenue, 0) - prev.revenue) / prev.revenue) * 100)::numeric, 1)::float
        ELSE 0 END AS growth_pct
    FROM restaurants r
    LEFT JOIN LATERAL (
      SELECT SUM(o.total_amount)::float AS revenue, COUNT(*)::int AS orders
      FROM orders o WHERE o.restaurant_id = r.id
        AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND LOWER(o.status) = 'delivered'
    ) cur ON TRUE
    LEFT JOIN LATERAL (
      SELECT SUM(o.total_amount)::float AS revenue
      FROM orders o WHERE o.restaurant_id = r.id
        AND o.created_at >= CURRENT_DATE - INTERVAL '60 days'
        AND o.created_at < CURRENT_DATE - INTERVAL '30 days'
        AND LOWER(o.status) = 'delivered'
    ) prev ON TRUE
    LEFT JOIN LATERAL (
      SELECT AVG(rating)::float AS avg_rating FROM reviews WHERE restaurant_id = r.id AND status = 'visible'
    ) rv ON TRUE
    ORDER BY revenue DESC NULLS LAST
    LIMIT 5
  `);

  // Live restaurants — open ones ranked by current active-order queue.
  const liveRestaurants = await pool.query(`
    SELECT r.id, r.name,
      COALESCE(r.is_active, TRUE) AS is_active,
      COALESCE(r.approval_status, 'approved') AS approval_status,
      COALESCE(r.estimated_delivery_time, 30)::int AS avg_prep_minutes,
      COALESCE(rv.avg_rating, 0)::float AS rating,
      COALESCE(q.queue, 0)::int AS queue
    FROM restaurants r
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS queue FROM orders o
      WHERE o.restaurant_id = r.id AND LOWER(o.status) NOT IN ('delivered', 'cancelled', 'rejected')
    ) q ON TRUE
    LEFT JOIN LATERAL (
      SELECT AVG(rating)::float AS avg_rating FROM reviews WHERE restaurant_id = r.id AND status = 'visible'
    ) rv ON TRUE
    WHERE COALESCE(r.approval_status, 'approved') = 'approved'
    ORDER BY queue DESC, r.name ASC
    LIMIT 10
  `);

  // Today's order volume by hour — peak-hours chart.
  const peakHours = await pool.query(`
    SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS orders
    FROM orders
    WHERE created_at::date = CURRENT_DATE
    GROUP BY 1 ORDER BY 1
  `);

  const supportTickets = await pool.query(`
    SELECT COUNT(*)::int AS open_count FROM support_tickets
    WHERE status IN ('Open', 'In Progress')
  `);

  // Today's refunds, active coupons, and platform-wide wallet balances.
  const financeToday = await pool.query(`
    SELECT
      (SELECT COALESCE(SUM(amount), 0)::float FROM refunds
        WHERE status = 'processed' AND created_at::date = CURRENT_DATE) AS refund_amount_today,
      (SELECT COUNT(*)::int FROM coupons
        WHERE is_active = TRUE AND (valid_until IS NULL OR valid_until > NOW())) AS active_coupons,
      (SELECT COALESCE(SUM(balance + cashback_balance + refund_balance), 0)::float
        FROM customer_wallets) AS customer_wallet_balance,
      (SELECT COALESCE(SUM(available_balance), 0)::float FROM delivery_wallets) AS delivery_wallet_balance,
      (SELECT COALESCE(SUM(de.amount), 0)::float FROM delivery_earnings de
        WHERE de.earned_at::date = CURRENT_DATE) AS delivery_earnings_today
  `);

  // Today's platform commission / restaurant payout split — reuses
  // settlementModel's single source of truth for commission-bearing revenue
  // (delivered + paid, net of processed refunds) rather than re-deriving a
  // third revenue predicate here.
  const commissionRate = await getCommissionRate();
  const revenueSplitToday = await pool.query(`
    WITH ${SETTLEMENT_REVENUE_CTE}
    SELECT COALESCE(SUM(net_amount), 0)::float AS net_revenue_today
    FROM orders_revenue
    WHERE created_at::date = CURRENT_DATE
  `);
  const netRevenueToday = revenueSplitToday.rows[0].net_revenue_today;
  const platformEarningsToday = Math.round(netRevenueToday * commissionRate * 100) / 100;
  const restaurantEarningsToday = Math.round((netRevenueToday - platformEarningsToday) * 100) / 100;

  const statusCounts = {};
  for (const row of orderStatusToday.rows) statusCounts[row.status] = row.count;

  return {
    ...rows[0],
    weekly: weekly.rows,
    monthly: monthly.rows,
    order_status_today: statusCounts,
    customer_insights: customerInsights.rows[0],
    restaurant_status: restaurantStatus.rows[0],
    top_restaurants: topRestaurants.rows,
    live_restaurants: liveRestaurants.rows,
    peak_hours: peakHours.rows,
    open_support_tickets: supportTickets.rows[0].open_count,
    refund_amount_today: financeToday.rows[0].refund_amount_today,
    active_coupons: financeToday.rows[0].active_coupons,
    wallet_balance: Math.round(
      (financeToday.rows[0].customer_wallet_balance + financeToday.rows[0].delivery_wallet_balance) * 100
    ) / 100,
    platform_earnings_today: platformEarningsToday,
    restaurant_earnings_today: restaurantEarningsToday,
    delivery_earnings_today: financeToday.rows[0].delivery_earnings_today,
    profit_today: platformEarningsToday,
  };
};

/** Whitelisted restaurant sort keys — no raw user input reaches the ORDER BY clause. */
const RESTAURANT_SORT_MAP = {
  latest: 'r.created_at DESC',
  oldest: 'r.created_at ASC',
  revenue_high: 'revenue DESC NULLS LAST',
  rating_high: 'r.rating DESC NULLS LAST',
  orders_high: 'order_count DESC NULLS LAST',
};

const listRestaurants = async ({
  search = '',
  status = '',
  verification = '',
  city = '',
  zone = '',
  cuisine = '',
  rating_min = '',
  date_from = '',
  date_to = '',
  sort = 'latest',
  page = 1,
  limit = 25,
  maxLimit = 100,
} = {}) => {
  const { parsePagination, paginatedMeta } = require('../utils/pagination');
  const pg = parsePagination({ page, limit }, { page: 1, limit: 25, maxLimit });

  const conditions = ['r.deleted_at IS NULL'];
  const values = [];
  const push = (v) => {
    values.push(v);
    return `$${values.length}`;
  };

  if (search.trim()) {
    const p = push(`%${search.trim()}%`);
    conditions.push(
      `(r.name ILIKE ${p} OR u.full_name ILIKE ${p} OR u.email ILIKE ${p} OR u.phone_number ILIKE ${p} OR CAST(r.id AS TEXT) ILIKE ${p})`
    );
  }
  if (status) conditions.push(`COALESCE(r.approval_status, 'approved') = ${push(status)}`);
  if (verification) conditions.push(`COALESCE(r.approval_status, 'approved') = ${push(verification)}`);
  if (city) conditions.push(`r.city ILIKE ${push(city)}`);
  if (zone) conditions.push(`r.zone ILIKE ${push(zone)}`);
  if (cuisine) conditions.push(`r.cuisine_types::text ILIKE ${push(`%${cuisine}%`)}`);
  if (rating_min) conditions.push(`r.rating >= ${push(Number(rating_min))}`);
  if (date_from) conditions.push(`r.created_at::date >= ${push(date_from)}::date`);
  if (date_to) conditions.push(`r.created_at::date <= ${push(date_to)}::date`);

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderSql = RESTAURANT_SORT_MAP[sort] || RESTAURANT_SORT_MAP.latest;
  const limitParam = push(pg.limit);
  const offsetParam = push(pg.offset);

  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, u.phone_number AS owner_phone,
       rc.name AS category_name,
       (SELECT COUNT(*)::int FROM orders o WHERE o.restaurant_id = r.id) AS order_count,
       (SELECT COUNT(*)::int FROM orders o
         WHERE o.restaurant_id = r.id AND o.created_at::date = CURRENT_DATE) AS orders_today,
       (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders o
         WHERE o.restaurant_id = r.id AND LOWER(o.status) = 'delivered') AS revenue,
       (SELECT COALESCE(SUM(total_amount), 0)::float FROM orders o
         WHERE o.restaurant_id = r.id AND LOWER(o.status) = 'delivered'
           AND o.created_at::date = CURRENT_DATE) AS revenue_today,
       (SELECT COUNT(*)::int FROM menu_items m WHERE m.restaurant_id = r.id) AS menu_count,
       (SELECT COUNT(*)::int FROM reviews rv WHERE rv.restaurant_id = r.id) AS review_count,
       COUNT(*) OVER()::int AS total_count
     FROM restaurants r
     LEFT JOIN users u ON u.id = r.owner_id
     LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
     ${whereSql}
     ORDER BY ${orderSql}
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  );

  const total = rows[0]?.total_count || 0;
  return {
    rows: rows.map(({ total_count, ...r }) => r),
    pagination: paginatedMeta(total, pg.page, pg.limit),
  };
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
  const { rows } = await pool.query(
    `UPDATE restaurants SET deleted_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [id]
  );
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

/** Restaurant management KPI strip. */
const getRestaurantStats = async () => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = TRUE
        AND COALESCE(approval_status, 'approved') = 'approved')::int AS active,
      COUNT(*) FILTER (WHERE COALESCE(approval_status, 'approved') = 'pending')::int AS pending_approval,
      COUNT(*) FILTER (WHERE COALESCE(approval_status, 'approved') = 'rejected')::int AS rejected,
      COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = FALSE)::int AS suspended,
      COUNT(*) FILTER (WHERE COALESCE(is_open, TRUE) = FALSE)::int AS temporarily_closed,
      COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = TRUE AND COALESCE(is_open, TRUE) = TRUE
        AND COALESCE(approval_status, 'approved') = 'approved')::int AS open_now,
      COALESCE(AVG(rating) FILTER (WHERE rating > 0), 0)::float AS avg_rating
    FROM restaurants
    WHERE deleted_at IS NULL
  `);

  const busyRes = await pool.query(`
    SELECT COUNT(DISTINCT restaurant_id)::int AS busy
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 minutes'
      AND LOWER(status) NOT IN ('cancelled', 'delivered', 'rejected')
    GROUP BY restaurant_id
    HAVING COUNT(*) >= 5
  `);

  const todayRes = await pool.query(`
    SELECT
      COUNT(*)::int AS today_orders,
      COALESCE(SUM(total_amount) FILTER (WHERE LOWER(status) = 'delivered'), 0)::float AS today_revenue
    FROM orders
    WHERE created_at::date = CURRENT_DATE
  `);

  return {
    ...rows[0],
    busy: busyRes.rowCount,
    today_orders: todayRes.rows[0].today_orders,
    today_revenue: todayRes.rows[0].today_revenue,
  };
};

/** Full drawer payload for a single restaurant. */
const getRestaurantDetail = async (id) => {
  const { rows } = await pool.query(
    `SELECT r.*, u.full_name AS owner_name, u.email AS owner_email, u.phone_number AS owner_phone,
       rc.name AS category_name,
       (SELECT COUNT(*)::int FROM menu_items m WHERE m.restaurant_id = r.id) AS menu_count,
       (SELECT COUNT(*)::int FROM reviews rv WHERE rv.restaurant_id = r.id) AS review_count
     FROM restaurants r
     LEFT JOIN users u ON u.id = r.owner_id
     LEFT JOIN restaurant_categories rc ON rc.id = r.category_id
     WHERE r.id = $1 AND r.deleted_at IS NULL`,
    [id]
  );
  const restaurant = rows[0];
  if (!restaurant) return null;

  const restaurantDocumentModel = require('./restaurantDocumentModel');
  const restaurantBankAccountModel = require('./restaurantBankAccountModel');
  const [documents, bankAccount] = await Promise.all([
    restaurantDocumentModel.listDocumentsByRestaurant(id),
    restaurantBankAccountModel.getPrimaryForRestaurant(id),
  ]);

  return {
    ...restaurant,
    documents,
    bank_account: restaurantBankAccountModel.mapAccount(bankAccount),
  };
};

/** Approve / reject / suspend / activate a restaurant. */
const verifyRestaurant = async (id, { action, reason } = {}) => {
  const patch = {
    approve: { approval_status: 'approved', is_active: true },
    reject: { approval_status: 'rejected', is_active: false },
    suspend: { is_active: false },
    activate: { is_active: true },
  }[action];
  if (!patch) {
    throw Object.assign(new Error('action must be one of approve, reject, suspend, activate'), { status: 400 });
  }

  const sets = [];
  const values = [];
  const push = (v) => {
    values.push(v);
    return `$${values.length}`;
  };
  if ('approval_status' in patch) sets.push(`approval_status = ${push(patch.approval_status)}`);
  if ('is_active' in patch) sets.push(`is_active = ${push(patch.is_active)}`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE restaurants SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0] || null;
};

/** Restaurant-scoped verification/reason timeline — thin wrapper over audit_logs. */
const getRestaurantVerificationTimeline = async (id, { limit = 50 } = {}) => {
  const { rows } = await pool.query(
    `SELECT al.*, u.full_name AS actor_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.resource_type = 'restaurant' AND al.resource_id = $1
     ORDER BY al.created_at DESC
     LIMIT $2`,
    [String(id), limit]
  );
  return rows;
};

/** Daily revenue/order series for a restaurant, for the Analytics tab's revenue chart. */
const getRestaurantRevenueTrend = async (id, { from = '', to = '' } = {}) => {
  const conditions = ['restaurant_id = $1'];
  const values = [id];
  if (from) {
    values.push(from);
    conditions.push(`created_at::date >= $${values.length}::date`);
  }
  if (to) {
    values.push(to);
    conditions.push(`created_at::date <= $${values.length}::date`);
  }
  if (!from && !to) conditions.push(`created_at >= NOW() - INTERVAL '30 days'`);

  const { rows } = await pool.query(
    `SELECT created_at::date AS date,
       COUNT(*)::int AS orders,
       COALESCE(SUM(total_amount) FILTER (WHERE LOWER(status) = 'delivered'), 0)::float AS revenue,
       COUNT(*) FILTER (WHERE LOWER(status) = 'cancelled')::int AS cancelled
     FROM orders
     WHERE ${conditions.join(' AND ')}
     GROUP BY 1 ORDER BY 1 ASC`,
    values
  );
  return rows;
};

/** Peak hours, best-sellers, and customer growth for a restaurant's Analytics tab. */
const getRestaurantAnalytics = async (id, { from = '', to = '' } = {}) => {
  const dateFilter = from && to ? `AND o.created_at::date BETWEEN $2::date AND $3::date` : '';
  const values = from && to ? [id, from, to] : [id];

  const [peakHours, bestSellers, customerGrowth] = await Promise.all([
    pool.query(
      `SELECT EXTRACT(HOUR FROM o.created_at)::int AS hour, COUNT(*)::int AS orders
       FROM orders o WHERE o.restaurant_id = $1 ${dateFilter}
       GROUP BY 1 ORDER BY 1 ASC`,
      values
    ),
    pool.query(
      `SELECT m.id, m.name, m.image_url, SUM(oi.quantity)::int AS qty,
         COALESCE(SUM(oi.quantity * oi.price_at_time), 0)::float AS revenue
       FROM order_items oi
       JOIN menu_items m ON m.id = oi.menu_item_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.restaurant_id = $1 ${dateFilter}
       GROUP BY m.id ORDER BY qty DESC LIMIT 10`,
      values
    ),
    pool.query(
      `SELECT o.created_at::date AS date, COUNT(DISTINCT o.user_id)::int AS customers
       FROM orders o WHERE o.restaurant_id = $1 ${dateFilter}
       GROUP BY 1 ORDER BY 1 ASC`,
      values
    ),
  ]);

  return {
    peak_hours: peakHours.rows,
    best_sellers: bestSellers.rows,
    customer_growth: customerGrowth.rows,
  };
};

/** Admin-scoped review list for a restaurant (unlike public reviewRoutes, admin can view/moderate any status). */
const listRestaurantReviews = async (restaurantId, { status = '', page = 1, limit = 20 } = {}) => {
  const { parsePagination, paginatedMeta } = require('../utils/pagination');
  const pg = parsePagination({ page, limit }, { page: 1, limit: 20, maxLimit: 100 });

  const conditions = ['rv.restaurant_id = $1'];
  const values = [restaurantId];
  if (status) {
    values.push(status);
    conditions.push(`rv.status = $${values.length}`);
  }
  values.push(pg.limit, pg.offset);

  const { rows } = await pool.query(
    `SELECT rv.*, u.full_name AS customer_name, COUNT(*) OVER()::int AS total_count
     FROM reviews rv
     LEFT JOIN users u ON u.id = rv.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY rv.created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );
  const avgRes = await pool.query(
    `SELECT COALESCE(AVG(rating), 0)::float AS avg_rating, COUNT(*)::int AS total
     FROM reviews WHERE restaurant_id = $1`,
    [restaurantId]
  );

  const total = rows[0]?.total_count || 0;
  return {
    rows: rows.map(({ total_count, ...r }) => r),
    pagination: paginatedMeta(total, pg.page, pg.limit),
    avg_rating: avgRes.rows[0].avg_rating,
    review_count: avgRes.rows[0].total,
  };
};

const replyToReview = async (reviewId, reply) => {
  const { rows } = await pool.query(
    `UPDATE reviews SET admin_reply = $1, replied_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 RETURNING *`,
    [reply, reviewId]
  );
  return rows[0] || null;
};

/** status: 'visible' | 'hidden' */
const setReviewStatus = async (reviewId, status) => {
  if (!['visible', 'hidden'].includes(status)) {
    throw Object.assign(new Error('status must be one of visible, hidden'), { status: 400 });
  }
  const { rows } = await pool.query(
    `UPDATE reviews SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [status, reviewId]
  );
  return rows[0] || null;
};

/** Flags/unflags a review as reported for abuse, independent of visible/hidden status. */
const setReviewReported = async (reviewId, reported) => {
  const { rows } = await pool.query(
    `UPDATE reviews SET is_reported = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
    [!!reported, reviewId]
  );
  return rows[0] || null;
};

/** Bulk approve/reject/suspend/delete, mirroring bulkUpdateOrders' best-effort per-item style. */
const bulkUpdateRestaurants = async (ids, action) => {
  const succeeded = [];
  const failed = [];
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean))).slice(0, 200);

  for (const restaurantId of uniqueIds) {
    try {
      let result;
      if (action === 'delete') {
        result = await deleteRestaurant(restaurantId);
      } else {
        result = await verifyRestaurant(restaurantId, { action });
      }
      if (!result) {
        failed.push({ id: restaurantId, error: 'Restaurant not found' });
      } else {
        succeeded.push({ id: restaurantId });
      }
    } catch (err) {
      failed.push({ id: restaurantId, error: err.message });
    }
  }
  return { succeeded, failed, partial: failed.length > 0 && succeeded.length > 0 };
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
       (SELECT COUNT(*)::int FROM delivery_assignments da WHERE da.delivery_partner_id = dp.id AND da.status = 'delivered') AS delivery_count,
       (SELECT COALESCE(SUM(amount), 0)::float FROM delivery_earnings e WHERE e.delivery_partner_id = dp.id) AS total_earnings,
       (SELECT COALESCE(available_balance, 0)::float FROM delivery_wallets w WHERE w.partner_id = dp.id) AS wallet_balance,
       (SELECT da.order_id FROM delivery_assignments da
         WHERE da.delivery_partner_id = dp.id
           AND da.status NOT IN ('delivered', 'cancelled', 'rejected', 'expired')
         ORDER BY da.created_at DESC LIMIT 1) AS current_order_id
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
  let nextStatus = approval_status;
  if (data.suspended === true || data.is_suspended === true) {
    nextStatus = 'suspended';
  }
  const { rows } = await pool.query(
    `UPDATE delivery_partners SET
       is_available = COALESCE($1, is_available),
       approval_status = COALESCE($2, approval_status),
       vehicle_details = COALESCE($3, vehicle_details),
       vehicle_type = COALESCE($4, vehicle_type),
       license_number = COALESCE($5, license_number),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $6 RETURNING *`,
    [
      nextStatus === 'suspended' ? false : is_available,
      nextStatus,
      vehicle_details,
      vehicle_type,
      license_number,
      id,
    ]
  );
  if (rows[0] && nextStatus === 'suspended') {
    await pool.query(
      `UPDATE users SET is_suspended = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT user_id FROM delivery_partners WHERE id = $1)`,
      [id]
    );
  } else if (rows[0] && nextStatus === 'approved') {
    await pool.query(
      `UPDATE users SET is_suspended = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = (SELECT user_id FROM delivery_partners WHERE id = $1)`,
      [id]
    );
  }
  return rows[0] || null;
};

const ORDER_SORT_MAP = {
  latest: 'o.created_at DESC',
  oldest: 'o.created_at ASC',
  amount_high: 'o.total_amount DESC',
  amount_low: 'o.total_amount ASC',
  delivery_time: 'ot.estimated_delivery_time ASC NULLS LAST',
};

const listOrders = async ({
  search = '',
  status = '',
  restaurant_id = '',
  delivery_partner_id = '',
  payment_method = '',
  payment_status = '',
  city = '',
  from = '',
  to = '',
  sort = 'latest',
  page = 1,
  limit = 20,
  maxLimit = 100,
} = {}) => {
  const { parsePagination, paginatedMeta } = require('../utils/pagination');
  const pg = parsePagination({ page, limit }, { page: 1, limit: 20, maxLimit });

  const conditions = [];
  const values = [];
  const push = (v) => {
    values.push(v);
    return `$${values.length}`;
  };

  if (search.trim()) {
    const p = push(`%${search.trim()}%`);
    conditions.push(
      `(CAST(o.id AS TEXT) ILIKE ${p} OR u.full_name ILIKE ${p} OR u.phone_number ILIKE ${p} OR r.name ILIKE ${p} OR dp_user.full_name ILIKE ${p})`
    );
  }
  if (status) conditions.push(`LOWER(o.status) = LOWER(${push(status)})`);
  if (restaurant_id) conditions.push(`o.restaurant_id = ${push(restaurant_id)}::uuid`);
  if (delivery_partner_id) conditions.push(`ot.delivery_partner_id = ${push(delivery_partner_id)}::uuid`);
  if (payment_method) conditions.push(`p.method = ${push(payment_method)}`);
  if (payment_status) conditions.push(`p.status = ${push(payment_status)}`);
  if (city) conditions.push(`a.city ILIKE ${push(city)}`);
  if (from) conditions.push(`o.created_at::date >= ${push(from)}::date`);
  if (to) conditions.push(`o.created_at::date <= ${push(to)}::date`);

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderSql = ORDER_SORT_MAP[sort] || ORDER_SORT_MAP.latest;
  const limitParam = push(pg.limit);
  const offsetParam = push(pg.offset);

  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.total_amount, o.subtotal, o.discount_amount, o.delivery_fee,
            o.platform_fee, o.tax_amount, o.delivery_mode, o.scheduled_for,
            o.created_at, o.updated_at,
            u.full_name AS customer_name, u.phone_number AS customer_phone,
            r.id AS restaurant_id, r.name AS restaurant_name,
            p.method AS payment_method, p.status AS payment_status, p.id AS payment_id,
            ot.delivery_partner_id, ot.estimated_delivery_time, ot.current_status AS tracking_status,
            dp_user.full_name AS delivery_partner_name,
            a.city, a.street, a.house_no,
            (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count,
            COUNT(*) OVER()::int AS total_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN restaurants r ON r.id = o.restaurant_id
     LEFT JOIN payments p ON p.order_id = o.id
     LEFT JOIN order_tracking ot ON ot.order_id = o.id
     LEFT JOIN delivery_partners dp ON dp.id = ot.delivery_partner_id
     LEFT JOIN users dp_user ON dp_user.id = dp.user_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     ${whereSql}
     ORDER BY ${orderSql}
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  );

  const total = rows[0]?.total_count || 0;
  return {
    rows: rows.map(({ total_count, ...r }) => r),
    pagination: paginatedMeta(total, pg.page, pg.limit),
  };
};

const getOrderStats = async () => {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE o.created_at::date = CURRENT_DATE)::int AS today_orders,
      COUNT(*) FILTER (WHERE LOWER(o.status) = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE LOWER(o.status) = 'accepted')::int AS accepted,
      COUNT(*) FILTER (WHERE LOWER(o.status) = 'preparing')::int AS preparing,
      COUNT(*) FILTER (WHERE LOWER(o.status) = 'ready for pickup')::int AS ready,
      COUNT(*) FILTER (WHERE LOWER(o.status) = 'picked up')::int AS picked_up,
      COUNT(*) FILTER (WHERE LOWER(o.status) IN ('on the way', 'out for delivery'))::int AS out_for_delivery,
      COUNT(*) FILTER (WHERE LOWER(o.status) = 'delivered')::int AS delivered,
      COUNT(*) FILTER (WHERE LOWER(o.status) = 'cancelled')::int AS cancelled,
      COUNT(*) FILTER (WHERE p.status IN ('refunded', 'partially_refunded'))::int AS refunded,
      COUNT(*) FILTER (WHERE p.status = 'failed')::int AS failed_payments,
      COUNT(*) FILTER (WHERE o.delivery_mode = 'Schedule' OR o.scheduled_for IS NOT NULL)::int AS scheduled_orders
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.id
  `);
  return rows[0];
};

const getOrderDetails = async (id) => {
  const { rows } = await pool.query(
    `SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone_number AS customer_phone,
            r.name AS restaurant_name, r.phone AS restaurant_phone,
            a.street, a.house_no, a.city, a.state, a.zip_code,
            p.method AS payment_method, p.status AS payment_status, p.id AS payment_id, p.amount AS payment_amount,
            p.provider_transaction_id, p.razorpay_payment_id, p.transaction_time,
            ot.delivery_partner_id, ot.current_status AS tracking_status, ot.estimated_delivery_time,
            dp_user.full_name AS delivery_partner_name, dp_user.phone_number AS delivery_partner_phone,
            c.code AS coupon_code, c.discount_type AS coupon_discount_type,
            rf.id AS refund_id, rf.amount AS refund_amount, rf.status AS refund_status, rf.reason AS refund_reason
     FROM orders o
     JOIN users u ON u.id = o.user_id
     JOIN restaurants r ON r.id = o.restaurant_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     LEFT JOIN payments p ON p.order_id = o.id
     LEFT JOIN order_tracking ot ON ot.order_id = o.id
     LEFT JOIN delivery_partners dp ON dp.id = ot.delivery_partner_id
     LEFT JOIN users dp_user ON dp_user.id = dp.user_id
     LEFT JOIN coupons c ON c.id = o.coupon_id
     LEFT JOIN LATERAL (
       SELECT * FROM refunds WHERE order_id = o.id ORDER BY created_at DESC LIMIT 1
     ) rf ON TRUE
     WHERE o.id = $1`,
    [id]
  );
  if (!rows[0]) return null;
  const items = await pool.query(
    `SELECT oi.*, m.name, m.image_url FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id WHERE oi.order_id = $1`,
    [id]
  );
  const { listForOrder } = require('./orderStatusHistoryModel');
  const timeline = await listForOrder(id, rows[0]);
  return { ...rows[0], items: items.rows, timeline };
};

/**
 * Runs the orders.status UPDATE inside a transaction with actor GUCs set so
 * the trg_order_status_history trigger attributes the change to this admin.
 */
const applyOrderStatus = async (id, status, actor = {}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SELECT set_config('app.order_actor_id', $1, true)`, [actor.id || '']);
    await client.query(`SELECT set_config('app.order_actor_source', $1, true)`, [actor.source || 'admin']);
    await client.query(`SELECT set_config('app.order_actor_reason', $1, true)`, [actor.reason || '']);
    const { rows } = await client.query(
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    await client.query('COMMIT');
    return rows[0] || null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const updateOrderAdmin = async (id, { status, delivery_partner_id, estimated_delivery_time, scheduled_for, reason } = {}, actor = {}) => {
  const { rows: existingRows } = await pool.query(
    `SELECT o.*, ot.delivery_partner_id AS current_delivery_partner_id
     FROM orders o LEFT JOIN order_tracking ot ON ot.order_id = o.id
     WHERE o.id = $1`,
    [id]
  );
  const existing = existingRows[0];
  if (!existing) return null;

  const { recordStatusChange } = require('./orderStatusHistoryModel');
  let order = existing;

  if (status) {
    order = await applyOrderStatus(id, status, { id: actor.id, source: 'admin', reason });
    if (!order) return null;
  }

  if (status && String(status).toLowerCase() === 'cancelled' && existing.current_delivery_partner_id) {
    try {
      const dn = require('./deliveryNotificationModel');
      await dn.createNotification({
        partnerId: existing.current_delivery_partner_id,
        type: 'order_cancelled',
        title: 'Order Cancelled',
        message: `Order #${String(id).slice(0, 8)} has been cancelled by the admin.`,
        relatedOrderId: id,
        actionUrl: '/delivery/orders',
      });
    } catch {
      /* non-blocking */
    }
  }

  if (scheduled_for) {
    await pool.query(
      `UPDATE orders SET scheduled_for = $1, delivery_mode = 'Schedule', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [scheduled_for, id]
    );
    await recordStatusChange({
      orderId: id,
      toStatus: 'Rescheduled',
      changedBy: actor.id || null,
      source: 'admin',
      reason: reason || `Rescheduled to ${new Date(scheduled_for).toISOString()}`,
    }).catch(() => {});
  }

  if (delivery_partner_id) {
    const isReassignment = Boolean(existing.current_delivery_partner_id) && existing.current_delivery_partner_id !== delivery_partner_id;
    if (isReassignment) {
      // Close out the previous partner's assignment first — otherwise they'd
      // keep a "committed" delivery_assignments row (accepted/picked_up/...)
      // for an order that's no longer theirs, alongside the new partner's row.
      await pool.query(
        `UPDATE delivery_assignments
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $1 AND delivery_partner_id = $2
           AND status IN ('offered', 'accepted', 'assigned', 'reached_restaurant', 'picked_up', 'on_the_way')`,
        [id, existing.current_delivery_partner_id]
      ).catch(() => {});
    }
    // Claim the order on `orders.delivery_partner_id` at offer time (not just
    // order_tracking) so it drops out of the partner-pull "available orders"
    // board immediately — otherwise another partner can self-accept this same
    // order out from under the admin's assignment during the 2-minute offer
    // window. Released back to NULL by deliveryModel.releaseAssignment() if
    // the partner rejects or the offer expires without a response.
    await pool.query(
      `UPDATE orders
       SET delivery_partner_id = $1, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [delivery_partner_id, id]
    );
    const { syncAssignmentState } = require('./deliveryModel');
    await syncAssignmentState({
      orderId: id,
      partnerId: delivery_partner_id,
      assignmentStatus: 'offered',
      trackingStatus: status || 'Assigned',
      note: isReassignment ? 'Reassigned by admin' : 'Assigned by admin — pending partner acceptance',
      estimatedDeliveryAt: estimated_delivery_time || null,
    });
    await recordStatusChange({
      orderId: id,
      toStatus: isReassignment ? 'Partner Reassigned' : 'Partner Assigned',
      changedBy: actor.id || null,
      source: 'admin',
      reason,
      meta: { delivery_partner_id },
    }).catch(() => {});
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
    try {
      const dn = require('./deliveryNotificationModel');
      await dn.createNotification({
        partnerId: delivery_partner_id,
        type: 'order_assigned',
        title: 'Order Assigned',
        message: `Admin assigned you order #${String(id).slice(0, 8)}. Accept within 2 minutes.`,
        relatedOrderId: id,
        actionUrl: '/delivery/orders/assigned',
      });
    } catch {
      /* non-blocking */
    }
  } else if (status || estimated_delivery_time) {
    await pool.query(
      `INSERT INTO order_tracking (order_id, current_status, estimated_delivery_time)
       VALUES ($1, COALESCE($2, 'Pending'), COALESCE($3, CURRENT_TIMESTAMP + INTERVAL '30 minutes'))
       ON CONFLICT (order_id) DO UPDATE SET
         current_status = COALESCE($2, order_tracking.current_status),
         estimated_delivery_time = COALESCE($3, order_tracking.estimated_delivery_time),
         updated_at = CURRENT_TIMESTAMP`,
      [id, status || null, estimated_delivery_time || null]
    ).catch(() => {});
    if (!status && estimated_delivery_time) {
      await recordStatusChange({
        orderId: id,
        toStatus: 'Rescheduled',
        changedBy: actor.id || null,
        source: 'admin',
        reason: reason || `Expected delivery updated to ${new Date(estimated_delivery_time).toISOString()}`,
      }).catch(() => {});
    }
  }
  return getOrderDetails(id);
};

/**
 * Applies the same per-order update path to a batch of order ids, collecting
 * per-item results instead of transacting the whole batch together (matches
 * the existing non-transactional, best-effort style of updateOrderAdmin).
 */
const bulkUpdateOrders = async (ids, patch, actor = {}) => {
  const succeeded = [];
  const failed = [];
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean))).slice(0, 200);
  for (const orderId of uniqueIds) {
    try {
      const result = await updateOrderAdmin(orderId, patch, actor);
      if (!result) {
        failed.push({ id: orderId, error: 'Order not found' });
      } else {
        succeeded.push({ id: orderId, status: result.status });
      }
    } catch (err) {
      failed.push({ id: orderId, error: err.message });
    }
  }
  return { succeeded, failed, partial: failed.length > 0 && succeeded.length > 0 };
};

const bulkUpdateOrderStatus = async (ids, status, reason, actor = {}) =>
  bulkUpdateOrders(ids, { status, reason }, actor);

const bulkAssignDeliveryPartner = async (ids, delivery_partner_id, actor = {}) =>
  bulkUpdateOrders(ids, { delivery_partner_id }, actor);

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

// Coupon writes live in couponModel.js (single source of truth for
// validation + SQL, also reused by system-generated coupons e.g. loyalty
// point redemption) — these are thin re-exports for the admin surface.
const createCoupon = async (data) => require('./couponModel').createCoupon(data);
const updateCoupon = async (id, data) => require('./couponModel').updateCoupon(id, data);

const deleteCoupon = async (id) => {
  const { rows } = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);
  return rows[0];
};

const getCouponAnalytics = async () => {
  const { getCouponAnalytics } = require('./couponModel');
  return getCouponAnalytics();
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

const broadcastNotification = async ({
  audience,
  title,
  message,
  user_ids,
  city,
  restaurant_id,
  type,
  link,
  schedule_at,
  created_by,
}) => {
  const { sendPushCampaign } = require('../services/pushNotificationService');
  return sendPushCampaign({
    audience: audience || 'all',
    user_ids,
    city,
    restaurant_id,
    title,
    message,
    type: type || 'coupon_alert',
    link: link || '/notifications',
    schedule_at,
    created_by,
  });
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
    logo_url, website_url, office_address, whatsapp_number, google_maps_embed_url,
    business_hours, facebook_url, instagram_url, twitter_url, linkedin_url,
    youtube_url, theme_color, footer_content, privacy_policy_text,
    terms_of_service_text, company_name,
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
       logo_url = COALESCE($12, logo_url),
       website_url = COALESCE($13, website_url),
       office_address = COALESCE($14, office_address),
       whatsapp_number = COALESCE($15, whatsapp_number),
       google_maps_embed_url = COALESCE($16, google_maps_embed_url),
       business_hours = COALESCE($17, business_hours),
       facebook_url = COALESCE($18, facebook_url),
       instagram_url = COALESCE($19, instagram_url),
       twitter_url = COALESCE($20, twitter_url),
       linkedin_url = COALESCE($21, linkedin_url),
       youtube_url = COALESCE($22, youtube_url),
       theme_color = COALESCE($23, theme_color),
       footer_content = COALESCE($24, footer_content),
       privacy_policy_text = COALESCE($25, privacy_policy_text),
       terms_of_service_text = COALESCE($26, terms_of_service_text),
       company_name = COALESCE($27, company_name),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = 1 RETURNING *`,
    [
      delivery_charge, free_delivery_min, tax_percent, commission_percent,
      app_name, support_email, support_phone, payment_cod_enabled,
      payment_upi_enabled, payment_card_enabled, payment_razorpay_enabled,
      logo_url, website_url, office_address, whatsapp_number, google_maps_embed_url,
      business_hours, facebook_url, instagram_url, twitter_url, linkedin_url,
      youtube_url, theme_color, footer_content, privacy_policy_text,
      terms_of_service_text, company_name,
    ]
  );
  return rows[0];
};

const listAdminStaff = async () => {
  const { rows } = await pool.query(
    `SELECT id, email, full_name, phone_number, admin_role, created_at, updated_at
     FROM users WHERE role = 'admin' ORDER BY created_at ASC`
  );
  return rows;
};

const createAdminStaff = async ({ email, password_hash, full_name, phone_number, admin_role }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name, phone_number, role, admin_role)
     VALUES ($1, $2, $3, $4, 'admin', $5)
     RETURNING id, email, full_name, phone_number, admin_role, created_at`,
    [email, password_hash, full_name, phone_number || null, admin_role || 'admin']
  );
  return rows[0];
};

const updateAdminStaff = async (id, data) => {
  const { full_name, phone_number, admin_role, password_hash } = data;
  const { rows } = await pool.query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       phone_number = COALESCE($2, phone_number),
       admin_role = COALESCE($3, admin_role),
       password_hash = COALESCE($4, password_hash),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND role = 'admin'
     RETURNING id, email, full_name, phone_number, admin_role, created_at, updated_at`,
    [full_name, phone_number, admin_role, password_hash, id]
  );
  return rows[0] || null;
};

const deleteAdminStaff = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM users WHERE id = $1 AND role = 'admin' RETURNING id`,
    [id]
  );
  return rows[0];
};

const getUserWallet = async (userId) => {
  const { rows } = await pool.query(
    `SELECT points_balance, total_earned, total_redeemed FROM rewards WHERE user_id = $1`,
    [userId]
  );
  const reward = rows[0] || { points_balance: 0, total_earned: 0, total_redeemed: 0 };
  const referrals = await pool.query(
    `SELECT COUNT(*)::int AS referral_count,
            COALESCE(SUM(points_awarded), 0)::int AS referral_points
     FROM referral_redemptions WHERE referrer_id = $1`,
    [userId]
  );
  const payments = await pool.query(
    `SELECT COALESCE(SUM(total_amount), 0)::float AS total_spent,
            COUNT(*)::int AS order_count
     FROM orders WHERE user_id = $1 AND LOWER(status) = 'delivered'`,
    [userId]
  );
  return {
    reward_points: reward.points_balance || 0,
    lifetime_points: reward.total_earned || 0,
    redeemed_points: reward.total_redeemed || 0,
    referral_count: referrals.rows[0]?.referral_count || 0,
    referral_points: referrals.rows[0]?.referral_points || 0,
    total_spent: payments.rows[0]?.total_spent || 0,
    order_count: payments.rows[0]?.order_count || 0,
  };
};

const getUserReferrals = async (userId) => {
  const { rows } = await pool.query(
    `SELECT rr.*, u.full_name AS referee_name, u.email AS referee_email, rc.code
     FROM referral_redemptions rr
     JOIN referral_codes rc ON rc.id = rr.referral_code_id
     LEFT JOIN users u ON u.id = rr.referee_id
     WHERE rr.referrer_id = $1
     ORDER BY rr.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return rows;
};

const listCmsContent = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM cms_content ORDER BY sort_order ASC, content_key ASC`
  );
  return rows;
};

const upsertCmsContent = async (data) => {
  const { content_key, content_type, title, body, is_active, sort_order } = data;
  const { rows } = await pool.query(
    `INSERT INTO cms_content (content_key, content_type, title, body, is_active, sort_order)
     VALUES ($1, $2, $3, $4, COALESCE($5, TRUE), COALESCE($6, 0))
     ON CONFLICT (content_key) DO UPDATE SET
       content_type = COALESCE(EXCLUDED.content_type, cms_content.content_type),
       title = COALESCE(EXCLUDED.title, cms_content.title),
       body = COALESCE(EXCLUDED.body, cms_content.body),
       is_active = COALESCE(EXCLUDED.is_active, cms_content.is_active),
       sort_order = COALESCE(EXCLUDED.sort_order, cms_content.sort_order),
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [content_key, content_type || 'block', title, JSON.stringify(body || {}), is_active, sort_order]
  );
  return rows[0];
};

const deleteCmsContent = async (key) => {
  const { rows } = await pool.query(
    `DELETE FROM cms_content WHERE content_key = $1 RETURNING content_key`,
    [key]
  );
  return rows[0];
};

const listMarketingCampaigns = async ({ channel = '', status = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT mc.*, u.full_name AS created_by_name
     FROM marketing_campaigns mc
     LEFT JOIN users u ON u.id = mc.created_by
     WHERE ($1 = '' OR mc.channel = $1)
       AND ($2 = '' OR mc.status = $2)
     ORDER BY mc.created_at DESC
     LIMIT 200`,
    [channel, status]
  );
  return rows;
};

const createMarketingCampaign = async (data) => {
  const { name, channel, audience, subject, message, status, scheduled_at, meta, created_by } = data;
  const { rows } = await pool.query(
    `INSERT INTO marketing_campaigns
       (name, channel, audience, subject, message, status, scheduled_at, meta, created_by)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'draft'), $7, $8, $9)
     RETURNING *`,
    [name, channel, audience || 'all', subject, message, status, scheduled_at, JSON.stringify(meta || {}), created_by]
  );
  return rows[0];
};

const updateMarketingCampaign = async (id, data) => {
  const { name, channel, audience, subject, message, status, scheduled_at, sent_count, meta } = data;
  const { rows } = await pool.query(
    `UPDATE marketing_campaigns SET
       name = COALESCE($1, name),
       channel = COALESCE($2, channel),
       audience = COALESCE($3, audience),
       subject = COALESCE($4, subject),
       message = COALESCE($5, message),
       status = COALESCE($6, status),
       scheduled_at = COALESCE($7, scheduled_at),
       sent_count = COALESCE($8, sent_count),
       meta = COALESCE($9, meta),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $10 RETURNING *`,
    [name, channel, audience, subject, message, status, scheduled_at, sent_count,
     meta ? JSON.stringify(meta) : null, id]
  );
  return rows[0] || null;
};

const listSeasonalCampaigns = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM seasonal_campaigns ORDER BY starts_at DESC LIMIT 100`
  );
  return rows;
};

const upsertSeasonalCampaign = async (data) => {
  const { id, slug, title, subtitle, banner_url, offer_code, starts_at, ends_at, is_active, meta } = data;
  if (id) {
    const { rows } = await pool.query(
      `UPDATE seasonal_campaigns SET
         slug = COALESCE($1, slug), title = COALESCE($2, title),
         subtitle = COALESCE($3, subtitle), banner_url = COALESCE($4, banner_url),
         offer_code = COALESCE($5, offer_code), starts_at = COALESCE($6, starts_at),
         ends_at = COALESCE($7, ends_at), is_active = COALESCE($8, is_active),
         meta = COALESCE($9, meta)
       WHERE id = $10 RETURNING *`,
      [slug, title, subtitle, banner_url, offer_code, starts_at, ends_at, is_active,
       meta ? JSON.stringify(meta) : null, id]
    );
    return rows[0] || null;
  }
  const { rows } = await pool.query(
    `INSERT INTO seasonal_campaigns (slug, title, subtitle, banner_url, offer_code, starts_at, ends_at, is_active, meta)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, TRUE), $9) RETURNING *`,
    [slug, title, subtitle, banner_url, offer_code, starts_at, ends_at, is_active, JSON.stringify(meta || {})]
  );
  return rows[0];
};

const getAdminLoginLogs = async ({ limit = 100 } = {}) => {
  const { rows } = await pool.query(
    `SELECT lh.*, u.email, u.full_name, u.admin_role
     FROM login_history lh
     JOIN users u ON u.id = lh.user_id
     WHERE u.role = 'admin'
     ORDER BY lh.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

const getAuditLogs = async ({ limit = 100, category = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT al.*, u.email, u.full_name
     FROM audit_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE ($1 = '' OR al.category = $1)
     ORDER BY al.created_at DESC
     LIMIT $2`,
    [category, limit]
  );
  return rows;
};

const getPaymentReport = async ({ start_date, end_date, group_by = 'day' } = {}) => {
  const trunc = group_by === 'month' ? 'month' : group_by === 'week' ? 'week' : 'day';
  const conditions = ["LOWER(o.status) NOT IN ('cancelled', 'pending', 'rejected')"];
  const values = [trunc];
  if (start_date && end_date) {
    conditions.push('CAST(o.created_at AS DATE) >= $2');
    conditions.push('CAST(o.created_at AS DATE) <= $3');
    values.push(start_date, end_date);
  }
  const { rows } = await pool.query(
    `SELECT date_trunc($1, o.created_at)::date AS period,
            COUNT(*)::int AS orders,
            COALESCE(SUM(o.total_amount), 0)::float AS revenue,
            COALESCE(SUM(o.delivery_fee), 0)::float AS delivery_fees,
            COALESCE(SUM(o.discount_amount), 0)::float AS discounts
     FROM orders o
     WHERE ${conditions.join(' AND ')}
     GROUP BY 1 ORDER BY 1 DESC LIMIT 90`,
    values
  );
  return rows;
};

const getDeliveryReport = async () => {
  const { rows } = await pool.query(
    `SELECT dp.id, u.full_name, dp.rating,
            COUNT(da.id)::int AS total_deliveries,
            COUNT(da.id) FILTER (WHERE da.status = 'delivered')::int AS completed,
            COALESCE(SUM(e.amount), 0)::float AS earnings
     FROM delivery_partners dp
     JOIN users u ON u.id = dp.user_id
     LEFT JOIN delivery_assignments da ON da.delivery_partner_id = dp.id
     LEFT JOIN delivery_earnings e ON e.delivery_partner_id = dp.id
     GROUP BY dp.id, u.full_name, dp.rating
     ORDER BY completed DESC
     LIMIT 100`
  );
  return rows;
};

// Delegates to settlementModel's shared revenue calculation so admin and
// partner settlement reads can never diverge again (they previously used
// two different, inconsistent predicates and neither excluded refunds).
const getRestaurantSettlements = (params) => require('./settlementModel').getRestaurantSettlements(params);

module.exports = {
  getDashboardStats,
  RESTAURANT_SORT_MAP,
  listRestaurants,
  getRestaurantStats,
  getRestaurantDetail,
  verifyRestaurant,
  getRestaurantVerificationTimeline,
  getRestaurantRevenueTrend,
  getRestaurantAnalytics,
  listRestaurantReviews,
  replyToReview,
  setReviewStatus,
  setReviewReported,
  bulkUpdateRestaurants,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantPerformance,
  listUsers,
  updateUser,
  deleteUser,
  getUserOrders,
  listDeliveryPartners,
  updateDeliveryPartner,
  ORDER_SORT_MAP,
  listOrders,
  getOrderStats,
  getOrderDetails,
  updateOrderAdmin,
  bulkUpdateOrderStatus,
  bulkAssignDeliveryPartner,
  refundOrder,
  listMenuItems,
  deleteMenuItem,
  listCategories,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponAnalytics,
  getAnalytics,
  broadcastNotification,
  getSettings,
  updateSettings,
  listAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
  getUserWallet,
  getUserReferrals,
  listCmsContent,
  upsertCmsContent,
  deleteCmsContent,
  listMarketingCampaigns,
  createMarketingCampaign,
  updateMarketingCampaign,
  listSeasonalCampaigns,
  upsertSeasonalCampaign,
  getAdminLoginLogs,
  getAuditLogs,
  getPaymentReport,
  getDeliveryReport,
  getRestaurantSettlements,
};
