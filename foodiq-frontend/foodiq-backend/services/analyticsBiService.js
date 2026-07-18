/**
 * CPI Task 4 — Analytics & Business Intelligence service.
 * Optimized parallel SQL aggregates; admin/partner/delivery scoped.
 */
const { pool } = require('../config/db');

const clampDays = (d, max = 90) =>
  Math.min(Math.max(Number(d) || 30, 1), max);

const deliveredFilter = `LOWER(o.status) IN ('delivered', 'completed')`;

/** Shared date window helper */
const sinceClause = (alias = 'o') =>
  `${alias}.created_at >= NOW() - ($1::int * INTERVAL '1 day')`;

const getRevenueAnalytics = async ({ days = 30, restaurantId = null } = {}) => {
  const d = clampDays(days);
  const params = [d];
  let filter = '';
  if (restaurantId) {
    params.push(restaurantId);
    filter = ` AND o.restaurant_id = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS revenue,
       COALESCE(SUM(o.total_amount), 0)::float AS gmv,
       COUNT(*)::int AS orders,
       COUNT(*) FILTER (WHERE ${deliveredFilter})::int AS delivered_orders,
       COUNT(*) FILTER (WHERE LOWER(o.status) = 'cancelled')::int AS cancelled_orders,
       COALESCE(AVG(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS aov
     FROM orders o
     WHERE ${sinceClause('o')} ${filter}`,
    params
  );
  const daily = await pool.query(
    `SELECT o.created_at::date AS day,
            COUNT(*)::int AS orders,
            COALESCE(SUM(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS revenue
     FROM orders o
     WHERE ${sinceClause('o')} ${filter}
     GROUP BY 1 ORDER BY 1`,
    params
  );
  return { days: d, summary: rows[0], daily: daily.rows };
};

const getOrderAnalytics = async ({ days = 30, restaurantId = null } = {}) => {
  const d = clampDays(days);
  const params = [d];
  let filter = '';
  if (restaurantId) {
    params.push(restaurantId);
    filter = ` AND restaurant_id = $${params.length}`;
  }
  const { rows: byStatus } = await pool.query(
    `SELECT COALESCE(status, 'Unknown') AS status, COUNT(*)::int AS count
     FROM orders
     WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day') ${filter}
     GROUP BY 1 ORDER BY count DESC`,
    params
  );
  let realtime;
  if (restaurantId) {
    realtime = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour')::int AS last_hour,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS last_24h,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour'), 0)::float AS gmv_last_hour,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'), 0)::float AS gmv_last_24h
       FROM orders WHERE restaurant_id = $1`,
      [restaurantId]
    );
  } else {
    realtime = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour')::int AS last_hour,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS last_24h,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour'), 0)::float AS gmv_last_hour,
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours'), 0)::float AS gmv_last_24h
       FROM orders`
    );
  }
  return { days: d, by_status: byStatus, realtime: realtime.rows[0] };
};

const getCustomerGrowth = async ({ days = 90 } = {}) => {
  const d = clampDays(days, 180);
  const { rows: weekly } = await pool.query(
    `SELECT date_trunc('week', created_at)::date AS week, COUNT(*)::int AS users
     FROM users WHERE role = 'customer'
       AND created_at >= NOW() - ($1::int * INTERVAL '1 day')
     GROUP BY 1 ORDER BY 1`,
    [d]
  );
  const { rows: summary } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day'))::int AS new_customers,
       COUNT(*)::int AS total_customers,
       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS new_7d
     FROM users WHERE role = 'customer'`,
    [d]
  );
  return { days: d, weekly, summary: summary[0] };
};

const getRestaurantGrowth = async ({ days = 90 } = {}) => {
  const d = clampDays(days, 180);
  const { rows: weekly } = await pool.query(
    `SELECT date_trunc('week', created_at)::date AS week, COUNT(*)::int AS restaurants
     FROM restaurants
     WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
     GROUP BY 1 ORDER BY 1`,
    [d]
  );
  const { rows: summary } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active,
       COUNT(*) FILTER (WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day'))::int AS new_in_period
     FROM restaurants`,
    [d]
  );
  return { days: d, weekly, summary: summary[0] };
};

const getDeliveryPerformance = async ({ days = 30, partnerId = null } = {}) => {
  const d = clampDays(days);
  const params = [d];
  let filter = '';
  if (partnerId) {
    params.push(partnerId);
    filter = ` AND o.delivery_partner_id = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE ${deliveredFilter})::int AS delivered,
       COUNT(*) FILTER (WHERE LOWER(o.status) = 'cancelled')::int AS cancelled,
       COALESCE(AVG(
         EXTRACT(EPOCH FROM (o.updated_at - o.created_at)) / 60.0
       ) FILTER (WHERE ${deliveredFilter}), 0)::float AS avg_delivery_minutes,
       COUNT(DISTINCT o.delivery_partner_id)::int AS active_riders
     FROM orders o
     WHERE ${sinceClause('o')}
       AND o.delivery_partner_id IS NOT NULL
       ${filter}`,
    params
  );
  const top = await pool.query(
    `SELECT dp.id, u.full_name, u.email,
            COUNT(o.id) FILTER (WHERE ${deliveredFilter})::int AS delivered,
            COALESCE(AVG(dp.rating), 0)::float AS rating
     FROM delivery_partners dp
     JOIN users u ON u.id = dp.user_id
     LEFT JOIN orders o ON o.delivery_partner_id = dp.id
       AND o.created_at >= NOW() - ($1::int * INTERVAL '1 day')
     GROUP BY dp.id, u.full_name, u.email
     ORDER BY delivered DESC
     LIMIT 10`,
    [d]
  ).catch(() => ({ rows: [] }));
  return { days: d, summary: rows[0], top_partners: top.rows };
};

/**
 * Funnel: registered → cart activity → placed order → delivered
 */
const getConversionFunnel = async ({ days = 30 } = {}) => {
  const d = clampDays(days);
  const [users, carts, orders, delivered] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS c FROM users
       WHERE role = 'customer' AND created_at >= NOW() - ($1::int * INTERVAL '1 day')`,
      [d]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT c.user_id)::int AS c
       FROM cart c
       JOIN cart_items ci ON ci.cart_id = c.id
       WHERE ci.created_at >= NOW() - ($1::int * INTERVAL '1 day')
          OR c.created_at >= NOW() - ($1::int * INTERVAL '1 day')`,
      [d]
    ).catch(() => ({ rows: [{ c: 0 }] })),
    pool.query(
      `SELECT COUNT(DISTINCT user_id)::int AS c FROM orders
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')`,
      [d]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT user_id)::int AS c FROM orders o
       WHERE ${sinceClause('o')} AND ${deliveredFilter}`,
      [d]
    ),
  ]);
  const stages = [
    { stage: 'new_customers', count: users.rows[0]?.c || 0 },
    { stage: 'cart_users', count: carts.rows[0]?.c || 0 },
    { stage: 'ordered', count: orders.rows[0]?.c || 0 },
    { stage: 'delivered', count: delivered.rows[0]?.c || 0 },
  ];
  for (let i = 0; i < stages.length; i++) {
    const prev = i === 0 ? stages[0].count : stages[i - 1].count;
    stages[i].conversion_from_prev =
      prev > 0 ? Math.round((stages[i].count / prev) * 10000) / 100 : 0;
  }
  return { days: d, stages };
};

/** 7/30-day repeat order retention among first-time orderers in window */
const getRetentionAnalysis = async ({ days = 30 } = {}) => {
  const d = clampDays(days);
  const { rows } = await pool.query(
    `WITH first_orders AS (
       SELECT user_id, MIN(created_at) AS first_at
       FROM orders
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
       GROUP BY user_id
     ),
     repeats AS (
       SELECT f.user_id,
              EXISTS (
                SELECT 1 FROM orders o
                WHERE o.user_id = f.user_id
                  AND o.created_at > f.first_at
                  AND o.created_at <= f.first_at + INTERVAL '7 days'
              ) AS retained_7d,
              EXISTS (
                SELECT 1 FROM orders o
                WHERE o.user_id = f.user_id
                  AND o.created_at > f.first_at
                  AND o.created_at <= f.first_at + INTERVAL '30 days'
              ) AS retained_30d
       FROM first_orders f
     )
     SELECT
       COUNT(*)::int AS cohort_size,
       COUNT(*) FILTER (WHERE retained_7d)::int AS retained_7d,
       COUNT(*) FILTER (WHERE retained_30d)::int AS retained_30d
     FROM repeats`,
    [d]
  );
  const r = rows[0] || {};
  const size = r.cohort_size || 0;
  return {
    days: d,
    cohort_size: size,
    retained_7d: r.retained_7d || 0,
    retained_30d: r.retained_30d || 0,
    rate_7d: size ? Math.round((r.retained_7d / size) * 10000) / 100 : 0,
    rate_30d: size ? Math.round((r.retained_30d / size) * 10000) / 100 : 0,
  };
};

const getCustomerLifetimeValue = async ({ limit = 20 } = {}) => {
  const lim = Math.min(Number(limit) || 20, 100);
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.email,
            COUNT(o.id)::int AS orders,
            COALESCE(SUM(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS clv,
            COALESCE(AVG(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS aov,
            MAX(o.created_at) AS last_order_at
     FROM users u
     JOIN orders o ON o.user_id = u.id
     WHERE u.role = 'customer'
     GROUP BY u.id
     HAVING COUNT(o.id) > 0
     ORDER BY clv DESC
     LIMIT $1`,
    [lim]
  );
  const { rows: avg } = await pool.query(
    `SELECT COALESCE(AVG(clv), 0)::float AS avg_clv,
            COALESCE(AVG(aov), 0)::float AS avg_aov
     FROM (
       SELECT COALESCE(SUM(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS clv,
              COALESCE(AVG(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS aov
       FROM users u
       JOIN orders o ON o.user_id = u.id
       WHERE u.role = 'customer'
       GROUP BY u.id
       HAVING COUNT(o.id) > 0
     ) t`
  );
  return { top_customers: rows, averages: avg[0] };
};

const getCartAbandonment = async ({ days = 7 } = {}) => {
  const d = clampDays(days, 30);
  const { rows } = await pool.query(
    `WITH active_carts AS (
       SELECT c.user_id, c.id AS cart_id,
              COALESCE(MAX(ci.created_at), c.created_at) AS touched_at
       FROM cart c
       JOIN cart_items ci ON ci.cart_id = c.id
       GROUP BY c.user_id, c.id, c.created_at
       HAVING COALESCE(MAX(ci.created_at), c.created_at) >= NOW() - ($1::int * INTERVAL '1 day')
     ),
     ordered AS (
       SELECT DISTINCT user_id FROM orders
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
     )
     SELECT
       (SELECT COUNT(*)::int FROM active_carts) AS carts_with_items,
       (SELECT COUNT(*)::int FROM active_carts ac
         WHERE NOT EXISTS (SELECT 1 FROM ordered o WHERE o.user_id = ac.user_id)
       ) AS abandoned,
       (SELECT COUNT(*)::int FROM ordered) AS converted_users`,
    [d]
  ).catch(() => ({ rows: [{ carts_with_items: 0, abandoned: 0, converted_users: 0 }] }));
  const r = rows[0] || {};
  const total = Number(r.carts_with_items) || 0;
  const abandoned = Number(r.abandoned) || 0;
  return {
    days: d,
    carts_with_items: total,
    abandoned,
    converted_users: Number(r.converted_users) || 0,
    abandonment_rate: total ? Math.round((abandoned / total) * 10000) / 100 : 0,
  };
};

const getPopularRestaurants = async ({ days = 30, limit = 10 } = {}) => {
  const d = clampDays(days);
  const lim = Math.min(Number(limit) || 10, 50);
  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.rating, r.image_url,
            COUNT(o.id)::int AS orders,
            COALESCE(SUM(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS revenue
     FROM restaurants r
     JOIN orders o ON o.restaurant_id = r.id AND ${sinceClause('o')}
     WHERE r.is_active = TRUE
     GROUP BY r.id
     ORDER BY orders DESC, revenue DESC
     LIMIT $2`,
    [d, lim]
  );
  return { days: d, restaurants: rows };
};

const getPopularDishes = async ({ days = 30, limit = 10, restaurantId = null } = {}) => {
  const d = clampDays(days);
  const lim = Math.min(Number(limit) || 10, 50);
  const params = [d, lim];
  let filter = '';
  if (restaurantId) {
    params.push(restaurantId);
    filter = ` AND m.restaurant_id = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT m.id, m.name, m.image_url, r.name AS restaurant_name,
            SUM(oi.quantity)::int AS orders_count,
            SUM(oi.quantity * oi.price_at_time)::float AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id AND ${sinceClause('o')}
     JOIN menu_items m ON m.id = oi.menu_item_id
     JOIN restaurants r ON r.id = m.restaurant_id
     WHERE 1=1 ${filter}
     GROUP BY m.id, r.name
     ORDER BY orders_count DESC
     LIMIT $2`,
    params
  );
  return { days: d, dishes: rows };
};

const getPeakHours = async ({ days = 30, restaurantId = null } = {}) => {
  const d = clampDays(days);
  const params = [d];
  let filter = '';
  if (restaurantId) {
    params.push(restaurantId);
    filter = ` AND restaurant_id = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS orders
     FROM orders
     WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day') ${filter}
     GROUP BY 1 ORDER BY 1`,
    params
  );
  const peak = [...rows].sort((a, b) => b.orders - a.orders)[0] || null;
  return { days: d, hours: rows, peak_hour: peak?.hour ?? null };
};

const getCityWiseSales = async ({ days = 30 } = {}) => {
  const d = clampDays(days);
  // Prefer markets.city; fall back to address city parse
  const markets = await pool.query(
    `SELECT COALESCE(m.city, m.name, 'Unknown') AS city,
            m.country_code,
            COUNT(o.id)::int AS orders,
            COALESCE(SUM(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS revenue
     FROM orders o
     LEFT JOIN markets m ON m.id = o.market_id
     WHERE ${sinceClause('o')}
     GROUP BY 1, 2
     ORDER BY revenue DESC
     LIMIT 30`,
    [d]
  );
  if (markets.rows.length && markets.rows.some((r) => r.orders > 0)) {
    return { days: d, cities: markets.rows, source: 'markets' };
  }
  const fallback = await pool.query(
    `SELECT COALESCE(a.city, 'Unknown') AS city,
            COUNT(o.id)::int AS orders,
            COALESCE(SUM(o.total_amount) FILTER (WHERE ${deliveredFilter}), 0)::float AS revenue
     FROM orders o
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     WHERE ${sinceClause('o')}
     GROUP BY 1
     ORDER BY revenue DESC
     LIMIT 30`,
    [d]
  ).catch(() => ({ rows: [] }));
  return { days: d, cities: fallback.rows, source: 'addresses' };
};

const getCouponPerformance = async ({ days = 30 } = {}) => {
  const d = clampDays(days);
  const { rows } = await pool.query(
    `SELECT c.id, c.code, c.discount_type, c.discount_amount,
            COUNT(cu.id)::int AS redemptions,
            COALESCE(SUM(o.total_amount), 0)::float AS order_gmv
     FROM coupons c
     LEFT JOIN coupon_usage cu ON cu.coupon_id = c.id
       AND cu.created_at >= NOW() - ($1::int * INTERVAL '1 day')
     LEFT JOIN orders o ON o.id = cu.order_id
     GROUP BY c.id
     ORDER BY redemptions DESC
     LIMIT 30`,
    [d]
  ).catch(async () => {
    // offers table fallback
    const r = await pool.query(
      `SELECT id, code, discount_type, discount_value AS discount_amount,
              0::int AS redemptions, 0::float AS order_gmv
       FROM offers WHERE is_active = TRUE
       ORDER BY created_at DESC LIMIT 20`
    ).catch(() => ({ rows: [] }));
    return r;
  });
  return { days: d, coupons: rows };
};

const getCampaignAnalytics = async ({ days = 30 } = {}) => {
  const d = clampDays(days);
  const campaigns = await pool.query(
    `SELECT sc.id, sc.slug, sc.title, sc.offer_code, sc.starts_at, sc.ends_at, sc.is_active,
            COUNT(DISTINCT o.id)::int AS attributed_orders,
            COALESCE(SUM(o.total_amount), 0)::float AS attributed_gmv
     FROM seasonal_campaigns sc
     LEFT JOIN coupons c ON UPPER(c.code) = UPPER(sc.offer_code)
     LEFT JOIN coupon_usage cu ON cu.coupon_id = c.id
       AND cu.used_at >= GREATEST(sc.starts_at, NOW() - ($1::int * INTERVAL '1 day'))
       AND cu.used_at <= sc.ends_at
     LEFT JOIN orders o ON o.id = cu.order_id
     GROUP BY sc.id
     ORDER BY attributed_gmv DESC
     LIMIT 20`,
    [d]
  ).catch(() => ({ rows: [] }));
  return { days: d, campaigns: campaigns.rows };
};

/** Z-score anomaly on daily GMV / orders vs lookback */
const detectAnomalies = async ({ lookback = 14 } = {}) => {
  const lb = clampDays(lookback, 60);
  const { rows } = await pool.query(
    `SELECT created_at::date AS day,
            COUNT(*)::float AS orders,
            COALESCE(SUM(total_amount), 0)::float AS gmv
     FROM orders
     WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
     GROUP BY 1 ORDER BY 1`,
    [lb]
  );
  if (rows.length < 3) {
    return { anomalies: [], message: 'Insufficient history', lookback: lb };
  }
  const mean = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const std = (arr, m) =>
    Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) || 1;

  const gmvVals = rows.map((r) => Number(r.gmv));
  const orderVals = rows.map((r) => Number(r.orders));
  const gmvMean = mean(gmvVals);
  const gmvStd = std(gmvVals, gmvMean);
  const ordMean = mean(orderVals);
  const ordStd = std(orderVals, ordMean);

  const anomalies = [];
  for (const r of rows) {
    const gz = (Number(r.gmv) - gmvMean) / gmvStd;
    const oz = (Number(r.orders) - ordMean) / ordStd;
    if (Math.abs(gz) >= 2 || Math.abs(oz) >= 2) {
      anomalies.push({
        day: r.day,
        gmv: Number(r.gmv),
        orders: Number(r.orders),
        gmv_z: Math.round(gz * 100) / 100,
        orders_z: Math.round(oz * 100) / 100,
        severity: Math.abs(gz) >= 3 || Math.abs(oz) >= 3 ? 'high' : 'medium',
        direction: gz > 0 || oz > 0 ? 'spike' : 'drop',
      });
    }
  }
  return {
    lookback: lb,
    baseline: { gmv_mean: gmvMean, orders_mean: ordMean },
    anomalies,
  };
};

const getAiInsights = async ({ days = 30 } = {}) => {
  const d = clampDays(days);
  const [revenue, peak, retention, abandon, anomalies, popular] = await Promise.all([
    getRevenueAnalytics({ days: d }),
    getPeakHours({ days: d }),
    getRetentionAnalysis({ days: d }),
    getCartAbandonment({ days: Math.min(d, 7) }),
    detectAnomalies({ lookback: Math.min(d, 14) }),
    getPopularRestaurants({ days: d, limit: 3 }),
  ]);
  const insights = [];
  const aov = revenue.summary?.aov || 0;
  insights.push({
    type: 'aov',
    severity: 'info',
    message: `Average order value is ₹${Math.round(aov)} over the last ${d} days.`,
  });
  if (peak.peak_hour != null) {
    insights.push({
      type: 'peak',
      severity: 'info',
      message: `Peak ordering hour is ${peak.peak_hour}:00 — staff kitchens and riders accordingly.`,
    });
  }
  if (retention.rate_30d < 20 && retention.cohort_size > 5) {
    insights.push({
      type: 'retention',
      severity: 'warning',
      message: `30-day repeat rate is only ${retention.rate_30d}%. Consider loyalty offers for first-time buyers.`,
    });
  } else if (retention.rate_30d >= 20) {
    insights.push({
      type: 'retention',
      severity: 'positive',
      message: `30-day retention is ${retention.rate_30d}% — keep nurturing repeat cohorts.`,
    });
  }
  if (abandon.abandonment_rate > 40) {
    insights.push({
      type: 'cart',
      severity: 'warning',
      message: `Cart abandonment is ${abandon.abandonment_rate}%. Try reminder coupons or faster checkout.`,
    });
  }
  for (const a of (anomalies.anomalies || []).slice(-3)) {
    insights.push({
      type: 'anomaly',
      severity: a.severity,
      message: `${a.direction === 'spike' ? 'Spike' : 'Drop'} on ${a.day}: ${a.orders} orders, ₹${Math.round(a.gmv)} GMV (z=${a.gmv_z}).`,
    });
  }
  if (popular.restaurants?.[0]) {
    insights.push({
      type: 'popular',
      severity: 'info',
      message: `Top restaurant: ${popular.restaurants[0].name} (${popular.restaurants[0].orders} orders).`,
    });
  }
  return { days: d, insights, generated_at: new Date().toISOString() };
};

/**
 * Full admin BI bundle — parallel fan-out.
 */
const getAdminBiDashboard = async ({ days = 30 } = {}) => {
  const d = clampDays(days);
  const [
    revenue,
    orders,
    customerGrowth,
    restaurantGrowth,
    delivery,
    funnel,
    retention,
    clv,
    aovBundle,
    abandon,
    popularR,
    popularD,
    peak,
    city,
    coupons,
    campaigns,
    anomalies,
    insights,
  ] = await Promise.all([
    getRevenueAnalytics({ days: d }),
    getOrderAnalytics({ days: d }),
    getCustomerGrowth({ days: d }),
    getRestaurantGrowth({ days: d }),
    getDeliveryPerformance({ days: d }),
    getConversionFunnel({ days: d }),
    getRetentionAnalysis({ days: d }),
    getCustomerLifetimeValue({ limit: 10 }),
    getRevenueAnalytics({ days: d }), // aov in summary
    getCartAbandonment({ days: Math.min(d, 7) }),
    getPopularRestaurants({ days: d }),
    getPopularDishes({ days: d }),
    getPeakHours({ days: d }),
    getCityWiseSales({ days: d }),
    getCouponPerformance({ days: d }),
    getCampaignAnalytics({ days: d }),
    detectAnomalies({ lookback: Math.min(d, 14) }),
    getAiInsights({ days: d }),
  ]);

  return {
    days: d,
    generated_at: new Date().toISOString(),
    revenue: revenue.summary,
    revenue_daily: revenue.daily,
    orders,
    aov: aovBundle.summary?.aov || 0,
    customer_growth: customerGrowth,
    restaurant_growth: restaurantGrowth,
    delivery_performance: delivery,
    conversion_funnel: funnel,
    retention,
    clv,
    cart_abandonment: abandon,
    popular_restaurants: popularR.restaurants,
    popular_dishes: popularD.dishes,
    peak_hours: peak,
    city_sales: city,
    coupon_performance: coupons,
    campaign_analytics: campaigns,
    anomalies,
    ai_insights: insights,
  };
};

const getRestaurantBiDashboard = async ({ restaurantId, days = 30 } = {}) => {
  if (!restaurantId) throw Object.assign(new Error('restaurant_id required'), { status: 400 });
  const d = clampDays(days);
  const [revenue, orders, dishes, peak] = await Promise.all([
    getRevenueAnalytics({ days: d, restaurantId }),
    getOrderAnalytics({ days: d, restaurantId }),
    getPopularDishes({ days: d, restaurantId, limit: 15 }),
    getPeakHours({ days: d, restaurantId }),
  ]);
  return {
    days: d,
    restaurant_id: restaurantId,
    revenue: revenue.summary,
    revenue_daily: revenue.daily,
    orders,
    aov: revenue.summary?.aov || 0,
    top_dishes: dishes.dishes,
    peak_hours: peak,
  };
};

const getDeliveryBiDashboard = async ({ partnerId = null, days = 30 } = {}) => {
  const d = clampDays(days);
  const perf = await getDeliveryPerformance({ days: d, partnerId });
  return { days: d, partner_id: partnerId, ...perf };
};

const getCustomerBiDashboard = async ({ userId, days = 90 } = {}) => {
  if (!userId) throw Object.assign(new Error('user_id required'), { status: 400 });
  const d = clampDays(days, 180);
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS orders,
            COALESCE(SUM(total_amount) FILTER (WHERE LOWER(status) IN ('delivered','completed')), 0)::float AS clv,
            COALESCE(AVG(total_amount) FILTER (WHERE LOWER(status) IN ('delivered','completed')), 0)::float AS aov,
            MAX(created_at) AS last_order_at
     FROM orders WHERE user_id = $1
       AND created_at >= NOW() - ($2::int * INTERVAL '1 day')`,
    [userId, d]
  );
  const monthly = await pool.query(
    `SELECT date_trunc('month', created_at)::date AS month,
            COUNT(*)::int AS orders,
            COALESCE(SUM(total_amount), 0)::float AS spend
     FROM orders WHERE user_id = $1
       AND created_at >= NOW() - ($2::int * INTERVAL '1 day')
     GROUP BY 1 ORDER BY 1`,
    [userId, d]
  );
  return { days: d, summary: rows[0], monthly: monthly.rows };
};

module.exports = {
  getRevenueAnalytics,
  getOrderAnalytics,
  getCustomerGrowth,
  getRestaurantGrowth,
  getDeliveryPerformance,
  getConversionFunnel,
  getRetentionAnalysis,
  getCustomerLifetimeValue,
  getCartAbandonment,
  getPopularRestaurants,
  getPopularDishes,
  getPeakHours,
  getCityWiseSales,
  getCouponPerformance,
  getCampaignAnalytics,
  detectAnomalies,
  getAiInsights,
  getAdminBiDashboard,
  getRestaurantBiDashboard,
  getDeliveryBiDashboard,
  getCustomerBiDashboard,
};
