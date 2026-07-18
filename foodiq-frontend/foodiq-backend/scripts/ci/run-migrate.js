/**
 * Standalone schema migrate for CI/CD.
 * 1) Apply database/schema.sql (CREATE IF NOT EXISTS)
 * 2) ensureSchema (ALTERs + satellite tables)
 * 3) Auto-seed catalog when empty (UPSERT)
 * Usage: node scripts/ci/run-migrate.js
 * Exit 0 on success, 1 on failure.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function main() {
  const applyBaseSchema = require('../../utils/applyBaseSchema');
  const ensureSchema = require('../../utils/ensureSchema');
  const ensureProductionCatalog = require('../../utils/ensureProductionCatalog');
  const { pool } = require('../../config/db');
  console.log('[migrate] Applying base schema.sql…');
  await applyBaseSchema();
  console.log('[migrate] Applying ensureSchema…');
  await ensureSchema();
  console.log('[migrate] Ensuring production catalog…');
  await ensureProductionCatalog();
  console.log('[migrate] Schema ensure complete');
  await pool.end();
}

main().catch(async (err) => {
  console.error('[migrate] FAILED', err.message);
  try {
    await require('../../config/db').pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
