const { pool } = require('../config/db');

const createCorporateAccount = async ({ organization_id, name, billing_email, credit_limit }) => {
  const { rows } = await pool.query(
    `INSERT INTO corporate_accounts (organization_id, name, billing_email, credit_limit)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [organization_id, name, billing_email || null, credit_limit || 0]
  );
  return rows[0];
};

const listCorporateAccounts = async ({ organizationId } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM corporate_accounts
     WHERE ($1::uuid IS NULL OR organization_id = $1)
     ORDER BY created_at DESC LIMIT 100`,
    [organizationId || null]
  );
  return rows;
};

const createCorporateOrder = async ({
  corporate_account_id,
  organization_id,
  placed_by,
  total_amount,
  currency,
  payload,
  status = 'draft',
}) => {
  const { rows } = await pool.query(
    `INSERT INTO corporate_orders (
       corporate_account_id, organization_id, placed_by, status, total_amount, currency, payload
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb) RETURNING *`,
    [
      corporate_account_id,
      organization_id || null,
      placed_by || null,
      status,
      total_amount || 0,
      currency || 'INR',
      JSON.stringify(payload || {}),
    ]
  );
  return rows[0];
};

const createRecurringSchedule = async (body) => {
  const { rows } = await pool.query(
    `INSERT INTO recurring_order_schedules (
       corporate_account_id, organization_id, cron_expr, timezone, template, next_run_at, is_active
     ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, TRUE) RETURNING *`,
    [
      body.corporate_account_id,
      body.organization_id || null,
      body.cron_expr || '0 10 * * 1-5',
      body.timezone || 'Asia/Kolkata',
      JSON.stringify(body.template || {}),
      body.next_run_at || new Date(Date.now() + 86400000),
    ]
  );
  return rows[0];
};

/** Create draft corporate orders for due schedules (cron-friendly). */
const runDueRecurring = async () => {
  const { rows: due } = await pool.query(
    `SELECT * FROM recurring_order_schedules
     WHERE is_active = TRUE
       AND (next_run_at IS NULL OR next_run_at <= NOW())
     LIMIT 20`
  );
  const created = [];
  for (const s of due) {
    const order = await createCorporateOrder({
      corporate_account_id: s.corporate_account_id,
      organization_id: s.organization_id,
      status: 'draft',
      total_amount: Number(s.template?.total_amount) || 0,
      currency: s.template?.currency || 'INR',
      payload: { recurring_schedule_id: s.id, template: s.template },
    });
    await pool.query(
      `UPDATE recurring_order_schedules
       SET next_run_at = NOW() + INTERVAL '1 day' WHERE id = $1`,
      [s.id]
    );
    created.push(order);
  }
  return { created: created.length, orders: created };
};

module.exports = {
  createCorporateAccount,
  listCorporateAccounts,
  createCorporateOrder,
  createRecurringSchedule,
  runDueRecurring,
};
