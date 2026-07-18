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
  // V3.0 tenancy foundation
  'organizations',
  'markets',
  'currencies',
  'franchises',
  'restaurant_chains',
  'white_label_configs',
  'api_keys',
  'warehouses',
  'inventory_items',
  'integration_connectors',
  'pricing_rules',
  'surge_events',
  'ai_forecast_runs',
  // V4.0 enterprise foundation
  'locales',
  'tax_rules',
  'sso_providers',
  'organization_memberships',
  'corporate_accounts',
  'corporate_orders',
  'recurring_order_schedules',
  'ai_chat_sessions',
  'fleet_vehicles',
  'iot_devices',
  'iot_telemetry',
  'inventory_reorder_suggestions',
  'api_marketplace_listings',
  'privacy_requests',
  // CPI Task 3
  'wishlists',
  'recently_viewed',
  'referral_codes',
  'referral_redemptions',
  'gift_cards',
  'gift_card_transactions',
  'restaurant_collections',
  'collection_restaurants',
  'seasonal_campaigns',
  'product_feature_flags',
];

const REQUIRED_COLUMNS = [
  { table: 'reviews', column: 'status' },
  { table: 'reviews', column: 'admin_reply' },
  { table: 'contact_messages', column: 'reason' },
  { table: 'contact_messages', column: 'phone' },
  { table: 'restaurants', column: 'organization_id' },
  { table: 'restaurants', column: 'market_id' },
  { table: 'orders', column: 'market_id' },
  { table: 'orders', column: 'currency' },
  { table: 'audit_logs', column: 'organization_id' },
  { table: 'audit_logs', column: 'actor_type' },
  { table: 'bug_reports', column: 'stack_trace' },
  { table: 'bug_reports', column: 'api_endpoint' },
  { table: 'bug_reports', column: 'browser' },
  { table: 'bug_reports', column: 'device' },
  { table: 'bug_reports', column: 'fingerprint' },
  { table: 'bug_reports', column: 'occurrence_count' },
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
      console.error('[verify-schema] Present table count:', present.size);
      console.error(`::error title=Missing tables::${missing.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    const missingCols = [];
    for (const { table, column } of REQUIRED_COLUMNS) {
      const col = await client.query(
        `SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
        [table, column]
      );
      if (!col.rows[0]) {
        missingCols.push(`${table}.${column}`);
      }
    }
    if (missingCols.length) {
      console.error('[verify-schema] Missing columns:', missingCols.join(', '));
      console.error(`::error title=Missing columns::${missingCols.join(', ')}`);
      process.exitCode = 1;
      return;
    }

    console.log(
      '[verify-schema] OK — required tables present:',
      REQUIRED_TABLES.join(', ')
    );
    console.log(
      '[verify-schema] OK — V2/V3 columns:',
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
