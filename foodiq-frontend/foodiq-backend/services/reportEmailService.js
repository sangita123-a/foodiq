/**
 * Scheduled / on-demand sales & earnings email reports.
 * Invoke via admin API or a cron hitting the same functions.
 */
const { pool } = require('../config/db');
const { sendEmail } = require('./emailService');
const { templates } = require('./emailTemplates');

const sendDailyPlatformReport = async () => {
  const stats = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM orders WHERE created_at::date = CURRENT_DATE) AS orders_today,
      (SELECT COALESCE(SUM(total_amount),0)::float FROM orders WHERE created_at::date = CURRENT_DATE) AS gmv_today,
      (SELECT COUNT(*)::int FROM payments WHERE status = 'failed' AND created_at::date = CURRENT_DATE) AS failed_payments,
      (SELECT COUNT(*)::int FROM users WHERE created_at::date = CURRENT_DATE) AS new_users
  `);
  const s = stats.rows[0];
  const body = [
    `Orders today: ${s.orders_today}`,
    `GMV today: ₹${Number(s.gmv_today).toFixed(2)}`,
    `Failed payments: ${s.failed_payments}`,
    `New users: ${s.new_users}`,
  ].join('\n');

  const admins = await pool.query(
    `SELECT id, email, full_name FROM users WHERE role = 'admin' AND email IS NOT NULL`
  );
  const results = [];
  for (const admin of admins.rows) {
    const tpl = templates.generic({
      title: 'Foodiq Daily Platform Report',
      body,
      ctaHref: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/analytics`,
      ctaLabel: 'Open analytics',
    });
    results.push(
      await sendEmail({
        to: admin.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        userId: admin.id,
        template: 'daily_platform_report',
      })
    );
  }
  return { recipients: admins.rows.length, stats: s, results };
};

const restaurantSalesForRange = async (restaurantId, days) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(COUNT(*),0)::int AS orders,
            COALESCE(SUM(total_amount),0)::float AS revenue
     FROM orders
     WHERE restaurant_id = $1
       AND created_at >= CURRENT_DATE - ($2::int * INTERVAL '1 day')
       AND status NOT IN ('Cancelled')`,
    [restaurantId, days]
  );
  return rows[0];
};

const sendRestaurantSales = async (restaurantId, days, label) => {
  if (!restaurantId) {
    const err = new Error('restaurant_id is required');
    err.status = 400;
    throw err;
  }
  const rest = await pool.query(
    `SELECT r.id, r.name, r.owner_id, u.email, u.full_name
     FROM restaurants r
     JOIN users u ON u.id = r.owner_id
     WHERE r.id = $1`,
    [restaurantId]
  );
  if (!rest.rows[0]?.email) {
    const err = new Error('Restaurant owner email not found');
    err.status = 404;
    throw err;
  }
  const sales = await restaurantSalesForRange(restaurantId, days);
  const body = `${label} for ${rest.rows[0].name}\nOrders: ${sales.orders}\nRevenue: ₹${Number(sales.revenue).toFixed(2)}`;
  const tpl = templates.generic({
    title: `${label} — ${rest.rows[0].name}`,
    body,
    ctaHref: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/partner/analytics`,
  });
  return sendEmail({
    to: rest.rows[0].email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    userId: rest.rows[0].owner_id,
    template: days === 1 ? 'restaurant_daily_sales' : 'restaurant_weekly_sales',
  });
};

const sendRestaurantDailySales = (restaurantId) =>
  sendRestaurantSales(restaurantId, 1, 'Daily sales report');
const sendRestaurantWeeklySales = (restaurantId) =>
  sendRestaurantSales(restaurantId, 7, 'Weekly sales report');

const partnerEarnings = async (partnerUserId, days) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(de.amount),0)::float AS earnings, COUNT(*)::int AS deliveries
     FROM delivery_earnings de
     JOIN delivery_partners dp ON dp.id = de.delivery_partner_id
     WHERE dp.user_id = $1
       AND de.earned_at >= CURRENT_DATE - ($2::int * INTERVAL '1 day')`,
    [partnerUserId, days]
  );
  return rows[0];
};

const sendDeliveryEarnings = async (partnerUserId, days, label) => {
  if (!partnerUserId) {
    const err = new Error('partner_user_id is required');
    err.status = 400;
    throw err;
  }
  const user = await pool.query(
    'SELECT id, email, full_name FROM users WHERE id = $1',
    [partnerUserId]
  );
  if (!user.rows[0]?.email) {
    const err = new Error('Delivery partner not found');
    err.status = 404;
    throw err;
  }
  const e = await partnerEarnings(partnerUserId, days);
  const body = `${label}\nDeliveries: ${e.deliveries}\nEarnings: ₹${Number(e.earnings).toFixed(2)}`;
  const tpl = templates.generic({
    title: label,
    body,
    ctaHref: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/delivery/earnings`,
  });
  return sendEmail({
    to: user.rows[0].email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    userId: partnerUserId,
    template: days >= 28 ? 'delivery_monthly_earnings' : 'delivery_weekly_earnings',
  });
};

const sendDeliveryWeeklyEarnings = (id) =>
  sendDeliveryEarnings(id, 7, 'Weekly earnings report');
const sendDeliveryMonthlyEarnings = (id) =>
  sendDeliveryEarnings(id, 30, 'Monthly earnings report');

/** Notify restaurant of approval / suspension */
const sendRestaurantStatusEmail = async (restaurantId, status) => {
  const rest = await pool.query(
    `SELECT r.name, r.owner_id, u.email, u.full_name
     FROM restaurants r JOIN users u ON u.id = r.owner_id WHERE r.id = $1`,
    [restaurantId]
  );
  if (!rest.rows[0]?.email) return null;
  const approved = String(status).toLowerCase().includes('approv');
  const tpl = templates.generic({
    title: approved ? 'Restaurant approved' : 'Restaurant account update',
    body: approved
      ? `Hi ${rest.rows[0].full_name}, ${rest.rows[0].name} is approved on Foodiq. You can start accepting orders.`
      : `Hi ${rest.rows[0].full_name}, your restaurant ${rest.rows[0].name} status is now: ${status}. Contact support if you need help.`,
    ctaHref: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/partner/dashboard`,
  });
  return sendEmail({
    to: rest.rows[0].email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    userId: rest.rows[0].owner_id,
    template: approved ? 'restaurant_approval' : 'restaurant_suspension',
  });
};

const sendDeliveryApprovalEmail = async (partnerUserId) => {
  const user = await pool.query(
    'SELECT id, email, full_name FROM users WHERE id = $1',
    [partnerUserId]
  );
  if (!user.rows[0]?.email) return null;
  const tpl = templates.generic({
    title: 'Delivery partner approved',
    body: `Hi ${user.rows[0].full_name}, your Foodiq delivery partner registration is approved. Go online to receive orders.`,
    ctaHref: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/delivery/dashboard`,
  });
  return sendEmail({
    to: user.rows[0].email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    userId: partnerUserId,
    template: 'delivery_registration_approved',
  });
};

module.exports = {
  sendDailyPlatformReport,
  sendRestaurantDailySales,
  sendRestaurantWeeklySales,
  sendDeliveryWeeklyEarnings,
  sendDeliveryMonthlyEarnings,
  sendRestaurantStatusEmail,
  sendDeliveryApprovalEmail,
};
