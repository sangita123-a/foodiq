/**
 * Standalone schema migrate for CI/CD (reuses ensureSchema — no feature changes).
 * Usage: node scripts/ci/run-migrate.js
 * Exit 0 on success, 1 on failure.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

async function main() {
  const ensureSchema = require('../../utils/ensureSchema');
  const { pool } = require('../../config/db');
  console.log('[migrate] Applying ensureSchema…');
  await ensureSchema();
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
