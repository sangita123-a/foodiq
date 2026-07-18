const { pool } = require('../config/db');
const { sendEmail } = require('./emailService');
const { templates } = require('./emailTemplates');

const buildReviewAnalytics = async (days = 30) => {
  const d = Math.min(Math.max(Number(days) || 30, 1), 90);
  const [
    restaurantAgg,
    distribution,
    topRestaurants,
    deliveryAgg,
    volumeByDay,
    topDishes,
    overallAgg,
  ] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::float AS avg_rating,
              COUNT(*) FILTER (WHERE rating >= 4)::int AS positive,
              COUNT(*) FILTER (WHERE rating = 3)::int AS neutral,
              COUNT(*) FILTER (WHERE rating <= 2)::int AS negative
       FROM reviews
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
         AND COALESCE(status, 'visible') = 'visible'`,
      [d]
    ),
    pool.query(
      `SELECT rating, COUNT(*)::int AS count
       FROM reviews
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
       GROUP BY rating ORDER BY rating DESC`,
      [d]
    ),
    pool.query(
      `SELECT r.restaurant_id, rest.name,
              COUNT(*)::int AS review_count,
              ROUND(AVG(r.rating)::numeric, 2)::float AS avg_rating
       FROM reviews r
       JOIN restaurants rest ON rest.id = r.restaurant_id
       WHERE r.created_at >= NOW() - ($1::int * INTERVAL '1 day')
       GROUP BY r.restaurant_id, rest.name
       ORDER BY review_count DESC, avg_rating DESC
       LIMIT 10`,
      [d]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::float AS avg_rating
       FROM delivery_reviews
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')`,
      [d]
    ),
    pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*)::int AS count,
              ROUND(AVG(rating)::numeric, 2)::float AS avg_rating
       FROM reviews
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [d]
    ),
    pool.query(
      `SELECT m.id AS menu_item_id, m.name AS dish_name,
              COUNT(DISTINCT r.id)::int AS review_count,
              ROUND(AVG(r.rating)::numeric, 2)::float AS avg_rating
       FROM reviews r
       JOIN order_items oi ON oi.order_id = r.order_id
       JOIN menu_items m ON m.id = oi.menu_item_id
       WHERE r.created_at >= NOW() - ($1::int * INTERVAL '1 day')
         AND COALESCE(r.status, 'visible') = 'visible'
         AND r.order_id IS NOT NULL
       GROUP BY m.id, m.name
       ORDER BY review_count DESC, avg_rating DESC
       LIMIT 10`,
      [d]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COALESCE(ROUND(AVG(overall_rating)::numeric, 2), 0)::float AS avg_rating,
              COUNT(*) FILTER (WHERE overall_rating >= 4)::int AS positive
       FROM order_feedback
       WHERE created_at >= NOW() - ($1::int * INTERVAL '1 day')
         AND overall_rating IS NOT NULL`,
      [d]
    ),
  ]);

  const rest = restaurantAgg.rows[0] || {};
  const overall = overallAgg.rows[0] || {};
  const combinedPositive = (rest.positive || 0) + (overall.positive || 0);
  const combinedTotal =
    (rest.total || 0) + (overall.total || 0) || 1;
  const csat =
    Math.round((combinedPositive / Math.max(combinedTotal, 1)) * 1000) / 10;

  return {
    days: d,
    restaurant: rest,
    delivery: deliveryAgg.rows[0],
    overall_order: overall,
    distribution: distribution.rows,
    top_restaurants: topRestaurants.rows,
    top_dishes: topDishes.rows,
    volume_by_day: volumeByDay.rows,
    csat_score: csat,
    average_rating: rest.avg_rating || 0,
  };
};

const collectMaintenancePayload = async (periodStart, periodEnd) => {
  const params = [periodStart, periodEnd];
  const [reviews, delivery, bugs, errors, orders, feedback, health] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::float AS avg_rating
         FROM reviews WHERE created_at::date BETWEEN $1 AND $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count,
                COALESCE(ROUND(AVG(rating)::numeric, 2), 0)::float AS avg_rating
         FROM delivery_reviews WHERE created_at::date BETWEEN $1 AND $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS opened,
                COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
                COUNT(*) FILTER (WHERE status IN ('open','triaging','in_progress'))::int AS open_now
         FROM bug_reports
         WHERE created_at::date BETWEEN $1 AND $2
            OR (status IN ('open','triaging','in_progress'))`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS count,
                COUNT(*) FILTER (WHERE status_code >= 500)::int AS server_errors
         FROM error_events WHERE created_at::date BETWEEN $1 AND $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE status = 'Delivered')::int AS delivered,
                COALESCE(SUM(total_amount),0)::float AS gmv
         FROM orders WHERE created_at::date BETWEEN $1 AND $2`,
        params
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM user_feedback WHERE created_at::date BETWEEN $1 AND $2) AS product,
           (SELECT COUNT(*)::int FROM support_tickets WHERE created_at::date BETWEEN $1 AND $2) AS support,
           (SELECT COUNT(*)::int FROM contact_messages WHERE created_at::date BETWEEN $1 AND $2) AS contact,
           (SELECT COUNT(*)::int FROM order_feedback WHERE created_at::date BETWEEN $1 AND $2) AS order_feedback`,
        params
      ),
      pool.query(`SELECT 1 AS ok`).catch(() => ({ rows: [{ ok: 0 }] })),
    ]);

  const payload = {
    generated_at: new Date().toISOString(),
    period: { start: periodStart, end: periodEnd },
    app_version: '2.0.0',
    health: {
      database: health.rows[0]?.ok === 1 ? 'up' : 'down',
    },
    reviews: reviews.rows[0],
    delivery_reviews: delivery.rows[0],
    bugs: bugs.rows[0],
    errors: errors.rows[0],
    orders: orders.rows[0],
    feedback: feedback.rows[0],
    performance: {
      note: 'Compare error_events and avg latency via /admin/monitoring after release',
      error_events_in_period: errors.rows[0]?.count || 0,
      server_errors_in_period: errors.rows[0]?.server_errors || 0,
    },
  };
  return payload;
};

const periodBounds = (period) => {
  const end = new Date();
  const endStr = end.toISOString().slice(0, 10);
  const start = new Date(end);
  if (period === 'weekly') start.setDate(start.getDate() - 7);
  else start.setDate(start.getDate() - 30);
  return { period_start: start.toISOString().slice(0, 10), period_end: endStr };
};

const generateMaintenanceReport = async ({
  period = 'monthly',
  createdBy = null,
  persist = true,
} = {}) => {
  const p = period === 'weekly' ? 'weekly' : 'monthly';
  const { period_start, period_end } = periodBounds(p);
  const payload = await collectMaintenancePayload(period_start, period_end);
  payload.period_label = p;

  let row = null;
  if (persist) {
    const { rows } = await pool.query(
      `INSERT INTO maintenance_reports (period, period_start, period_end, payload, created_by)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING *`,
      [p, period_start, period_end, JSON.stringify(payload), createdBy]
    );
    row = rows[0];
  }

  return { id: row?.id || null, period: p, period_start, period_end, payload };
};

const listMaintenanceReports = async ({ period = null, limit = 20 } = {}) => {
  const values = [];
  let where = '';
  if (period) {
    values.push(period);
    where = `WHERE period = $${values.length}`;
  }
  values.push(Math.min(Number(limit) || 20, 50));
  const { rows } = await pool.query(
    `SELECT id, period, period_start, period_end, payload, created_at
     FROM maintenance_reports
     ${where}
     ORDER BY created_at DESC
     LIMIT $${values.length}`,
    values
  );
  return rows;
};

const sendWeeklyReviewReport = async () => {
  const analytics = await buildReviewAnalytics(7);
  const bugs = await pool.query(
    `SELECT COUNT(*)::int AS open_bugs FROM bug_reports
     WHERE status IN ('open', 'triaging', 'in_progress')`
  );
  const errors = await pool.query(
    `SELECT COUNT(*)::int AS c FROM error_events
     WHERE created_at >= NOW() - INTERVAL '7 days'`
  );

  const body = [
    `Restaurant reviews (7d): ${analytics.restaurant.total} (avg ${analytics.restaurant.avg_rating})`,
    `Delivery reviews (7d): ${analytics.delivery.total} (avg ${analytics.delivery.avg_rating})`,
    `Open bugs: ${bugs.rows[0]?.open_bugs || 0}`,
    `Error events (7d): ${errors.rows[0]?.c || 0}`,
  ].join('\n');

  const report = await generateMaintenanceReport({
    period: 'weekly',
    persist: true,
  });

  const admins = await pool.query(
    `SELECT id, email, full_name FROM users WHERE role = 'admin' AND email IS NOT NULL`
  );
  const results = [];
  for (const admin of admins.rows) {
    const tpl = templates.generic({
      title: 'Foodiq Weekly Review & Maintenance Report',
      body,
      ctaHref: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/maintenance`,
      ctaLabel: 'Open maintenance',
    });
    results.push(
      await sendEmail({
        to: admin.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        userId: admin.id,
        template: 'weekly_review_report',
      })
    );
  }

  return {
    recipients: admins.rows.length,
    analytics,
    report_id: report.id,
    results,
  };
};

module.exports = {
  buildReviewAnalytics,
  generateMaintenanceReport,
  listMaintenanceReports,
  sendWeeklyReviewReport,
  collectMaintenancePayload,
};
