const { pool } = require('../config/db');

/**
 * Single source of truth for "what counts as commission-bearing revenue".
 * An order only counts once it's delivered AND paid, and any processed
 * refund against that payment is subtracted — a fully refunded order nets
 * to ~0 instead of still inflating gross_revenue/commission.
 * (Previously admin and partner settlement reads used two different,
 * diverging predicates — see paymentModel.getPartnerSettlements /
 * legacy adminModel.getRestaurantSettlements.)
 */
const SETTLEMENT_REVENUE_CTE = `
  orders_revenue AS (
    SELECT o.id, o.restaurant_id, o.created_at,
           GREATEST(o.total_amount - COALESCE(rf.refunded, 0), 0) AS net_amount,
           p.status AS payment_status
    FROM orders o
    JOIN payments p ON p.order_id = o.id
    LEFT JOIN (
      SELECT payment_id, SUM(amount) AS refunded
      FROM refunds WHERE status = 'processed'
      GROUP BY payment_id
    ) rf ON rf.payment_id = p.id
    WHERE LOWER(o.status) = 'delivered'
      AND LOWER(p.status) IN ('completed', 'refunded', 'partially_refunded')
  )
`;

const getCommissionRate = async () => {
  const { rows } = await pool.query(`SELECT commission_percent FROM admin_settings WHERE id = 1`);
  return Number(rows[0]?.commission_percent || 15) / 100;
};

/** Admin-facing: per-restaurant settlement summary, optionally scoped/date-filtered. */
const getRestaurantSettlements = async ({ restaurant_id = '', date_from = '', date_to = '' } = {}) => {
  const rate = await getCommissionRate();

  const conditions = [];
  const values = [rate];
  if (restaurant_id) {
    values.push(restaurant_id);
    conditions.push(`r.id = $${values.length}`);
  }
  if (date_from) {
    values.push(date_from);
    conditions.push(`ov.created_at::date >= $${values.length}::date`);
  }
  if (date_to) {
    values.push(date_to);
    conditions.push(`ov.created_at::date <= $${values.length}::date`);
  }
  const extraWhere = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `WITH ${SETTLEMENT_REVENUE_CTE}
     SELECT r.id, r.name,
            COALESCE(SUM(ov.net_amount), 0)::float AS gross_revenue,
            COALESCE(SUM(ov.net_amount), 0)::float * $1 AS commission,
            COALESCE(SUM(ov.net_amount), 0)::float * (1 - $1) AS settlement,
            COUNT(ov.id)::int AS delivered_orders
     FROM restaurants r
     LEFT JOIN orders_revenue ov ON ov.restaurant_id = r.id ${extraWhere}
     GROUP BY r.id, r.name
     HAVING COALESCE(SUM(ov.net_amount), 0) > 0
     ORDER BY gross_revenue DESC
     LIMIT 100`,
    values
  );
  return { commission_rate: rate * 100, settlements: rows };
};

/** Partner-facing: today/week/month earnings breakdown for one restaurant. */
const getPartnerEarningsSummary = async (restaurantId) => {
  const rate = await getCommissionRate();

  const { rows } = await pool.query(
    `WITH ${SETTLEMENT_REVENUE_CTE}
     SELECT
       COALESCE(SUM(ov.net_amount) FILTER (WHERE ov.created_at::date = CURRENT_DATE), 0)::float AS today,
       COALESCE(SUM(ov.net_amount) FILTER (WHERE ov.created_at >= date_trunc('week', CURRENT_DATE)), 0)::float AS week,
       COALESCE(SUM(ov.net_amount) FILTER (WHERE ov.created_at >= date_trunc('month', CURRENT_DATE)), 0)::float AS month,
       COUNT(ov.id)::int AS paid_orders
     FROM orders_revenue ov
     WHERE ov.restaurant_id = $1`,
    [restaurantId]
  );

  const pendingPayments = await pool.query(
    `SELECT COUNT(*)::int AS pending_payments
     FROM orders o
     LEFT JOIN payments p ON p.order_id = o.id
     WHERE o.restaurant_id = $1
       AND LOWER(o.status) NOT IN ('cancelled', 'rejected')
       AND LOWER(p.status) = 'pending'`,
    [restaurantId]
  );

  const monthGross = rows[0].month;
  const commissionAmountFixed = monthGross * rate;
  const netPayout = monthGross - commissionAmountFixed;

  const paidOrders = await pool.query(
    `SELECT o.id, o.total_amount, o.status, o.created_at,
            p.status AS payment_status, p.method AS payment_method, p.transaction_time
     FROM orders o
     JOIN payments p ON p.order_id = o.id
     WHERE o.restaurant_id = $1
       AND LOWER(p.status) IN ('completed', 'refunded', 'partially_refunded', 'pending')
     ORDER BY o.created_at DESC
     LIMIT 50`,
    [restaurantId]
  );

  return {
    summary: {
      today: rows[0].today,
      week: rows[0].week,
      month: rows[0].month,
      paid_orders: rows[0].paid_orders,
      pending_payments: pendingPayments.rows[0].pending_payments,
      commission_percent: rate * 100,
      commission_amount: Math.round(commissionAmountFixed * 100) / 100,
      net_payout: Math.round(netPayout * 100) / 100,
    },
    paid_orders: paidOrders.rows,
  };
};

/**
 * Create a persisted settlement batch for a restaurant covering a date range,
 * snapshotting the settlement math at creation time so it can be tracked
 * through approve/pay/reject without being recomputed (and drifting) later.
 */
const createSettlementBatch = async ({ restaurantId, periodStart, periodEnd, createdBy = null, bankAccountId = null }) => {
  const rate = await getCommissionRate();

  const { rows } = await pool.query(
    `WITH ${SETTLEMENT_REVENUE_CTE}
     SELECT
       COALESCE(SUM(ov.net_amount), 0)::float AS gross_revenue,
       COUNT(ov.id)::int AS delivered_orders
     FROM orders_revenue ov
     WHERE ov.restaurant_id = $1
       AND ov.created_at >= $2::timestamptz
       AND ov.created_at <= $3::timestamptz`,
    [restaurantId, periodStart, periodEnd]
  );

  const grossRevenue = rows[0].gross_revenue;
  if (grossRevenue <= 0) {
    throw Object.assign(new Error('No settleable revenue in this period'), { status: 400 });
  }
  const commissionAmount = Math.round(grossRevenue * rate * 100) / 100;
  const netPayout = Math.round((grossRevenue - commissionAmount) * 100) / 100;

  let bankAccount = bankAccountId;
  if (!bankAccount) {
    const primary = await pool.query(
      `SELECT id FROM restaurant_bank_accounts WHERE restaurant_id = $1 AND is_primary = TRUE LIMIT 1`,
      [restaurantId]
    );
    bankAccount = primary.rows[0]?.id || null;
  }

  const { rows: inserted } = await pool.query(
    `INSERT INTO restaurant_settlements (
       restaurant_id, period_start, period_end, delivered_orders,
       gross_revenue, commission_percent, commission_amount, net_payout,
       bank_account_id, created_by, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
     ON CONFLICT (restaurant_id, period_start, period_end) DO NOTHING
     RETURNING *`,
    [restaurantId, periodStart, periodEnd, rows[0].delivered_orders, grossRevenue, rate * 100, commissionAmount, netPayout, bankAccount, createdBy]
  );

  if (!inserted[0]) {
    const existing = await pool.query(
      `SELECT * FROM restaurant_settlements WHERE restaurant_id = $1 AND period_start = $2 AND period_end = $3`,
      [restaurantId, periodStart, periodEnd]
    );
    return { duplicate: true, settlement: existing.rows[0] };
  }
  return { settlement: inserted[0] };
};

const listSettlements = async ({ status = '', restaurant_id = '', date_from = '', date_to = '', limit = 100 } = {}) => {
  const conditions = [];
  const values = [];
  if (status) {
    values.push(status);
    conditions.push(`rs.status = $${values.length}`);
  }
  if (restaurant_id) {
    values.push(restaurant_id);
    conditions.push(`rs.restaurant_id = $${values.length}`);
  }
  if (date_from) {
    values.push(date_from);
    conditions.push(`rs.period_start::date >= $${values.length}::date`);
  }
  if (date_to) {
    values.push(date_to);
    conditions.push(`rs.period_end::date <= $${values.length}::date`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  values.push(Math.min(Number(limit) || 100, 500));

  const { rows } = await pool.query(
    `SELECT rs.*, r.name AS restaurant_name,
            ba.bank_name, ba.account_number_last4
     FROM restaurant_settlements rs
     JOIN restaurants r ON r.id = rs.restaurant_id
     LEFT JOIN restaurant_bank_accounts ba ON ba.id = rs.bank_account_id
     ${where}
     ORDER BY rs.created_at DESC
     LIMIT $${values.length}`,
    values
  );
  return rows;
};

const approveSettlement = async (id, approvedBy) => {
  const { rows } = await pool.query(
    `UPDATE restaurant_settlements SET
       status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND status = 'pending'
     RETURNING *`,
    [approvedBy, id]
  );
  if (!rows[0]) throw Object.assign(new Error('Settlement not found or not pending'), { status: 404 });
  return rows[0];
};

const markSettlementPaid = async (id) => {
  const { rows } = await pool.query(
    `UPDATE restaurant_settlements SET
       status = 'paid', paid_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'approved'
     RETURNING *`,
    [id]
  );
  if (!rows[0]) throw Object.assign(new Error('Settlement not found or not approved'), { status: 404 });
  return rows[0];
};

const rejectSettlement = async (id, reason = '') => {
  const { rows } = await pool.query(
    `UPDATE restaurant_settlements SET
       status = 'rejected', rejection_reason = $1
     WHERE id = $2 AND status IN ('pending', 'approved')
     RETURNING *`,
    [reason, id]
  );
  if (!rows[0]) throw Object.assign(new Error('Settlement not found or already finalized'), { status: 404 });
  return rows[0];
};

const bulkApproveSettlements = async (ids, approvedBy) => {
  const { rows } = await pool.query(
    `UPDATE restaurant_settlements SET
       status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP
     WHERE id = ANY($2::uuid[]) AND status = 'pending'
     RETURNING *`,
    [approvedBy, ids]
  );
  return rows;
};

module.exports = {
  getCommissionRate,
  getRestaurantSettlements,
  getPartnerEarningsSummary,
  createSettlementBatch,
  listSettlements,
  approveSettlement,
  markSettlementPaid,
  rejectSettlement,
  bulkApproveSettlements,
};
