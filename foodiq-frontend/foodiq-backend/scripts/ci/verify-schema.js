/**
 * Verify critical Foodiq tables/columns exist after migrate.
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
    console.log('[verify-schema] OK — required tables present:', REQUIRED_TABLES.join(', '));
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
