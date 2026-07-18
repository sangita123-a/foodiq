/**
 * Verify critical Foodiq tables/columns exist after migrate (incl. V2.0 maintenance).
 * Usage: node scripts/ci/verify-schema.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const REQUIRED_TABLES = [
  'users',
  'restaurants',
  'menu_items',
  'orders',
  'payments',
  'offers',
  'notifications',
  'reviews',
  'contact_messages',
  'support_tickets',
  // V2.0 maintenance
  'delivery_reviews',
  'order_feedback',
  'user_feedback',
  'bug_reports',
  'maintenance_reports',
];

const REQUIRED_COLUMNS = [
  { table: 'reviews', column: 'status' },
  { table: 'reviews', column: 'admin_reply' },
  { table: 'contact_messages', column: 'reason' },
  { table: 'contact_messages', column: 'phone' },
];

async function main() {
  const { pool } = require('../../config/db');
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    const present = new Set(rows.map((r) => r.table_name));
    const missing = REQUIRED_TABLES.filter((t) => !present.has(t));
    if (missing.length) {
      console.error('[verify-schema] Missing tables:', missing.join(', '));
      process.exitCode = 1;
      return;
    }

    for (const { table, column } of REQUIRED_COLUMNS) {
      const col = await client.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column]
      );
      if (!col.rows[0]) {
        console.error(`[verify-schema] Missing column ${table}.${column}`);
        process.exitCode = 1;
        return;
      }
    }

    console.log(
      '[verify-schema] OK — required tables present:',
      REQUIRED_TABLES.join(', ')
    );
    console.log(
      '[verify-schema] OK — V2 columns:',
      REQUIRED_COLUMNS.map((c) => `${c.table}.${c.column}`).join(', ')
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(async (err) => {
  console.error('[verify-schema] FAILED', err.message);
  try {
    await require('../../config/db').pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
