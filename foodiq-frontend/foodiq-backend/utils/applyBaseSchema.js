const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

/**
 * Split SQL into executable statements (handles simple $$ blocks).
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollar = false;
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (ch === '$' && next === '$') {
      inDollar = !inDollar;
      current += '$$';
      i += 1;
      continue;
    }
    if (ch === ';' && !inDollar) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      continue;
    }
    current += ch;
  }
  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);
  return statements;
}

/**
 * Applies database/schema.sql (idempotent CREATE IF NOT EXISTS).
 * Must run before ensureSchema ALTERs on a fresh Postgres.
 * On partially-migrated DBs, falls back to per-statement apply so missing
 * columns don't abort the whole migrate (ensureSchema fills gaps next).
 */
async function applyBaseSchema(client) {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const runner = client || (await pool.connect());
  const shouldRelease = !client;
  try {
    console.log('[SCHEMA] Applying base schema.sql…');
    try {
      await runner.query(sql);
      console.log('[SCHEMA] Base schema applied');
      return;
    } catch (err) {
      console.warn(
        '[SCHEMA] Bulk schema apply failed (' +
          err.message +
          ') — retrying statement-by-statement'
      );
    }

    const statements = splitSqlStatements(sql);
    let applied = 0;
    let skipped = 0;
    for (const statement of statements) {
      try {
        await runner.query(statement);
        applied += 1;
      } catch (err) {
        skipped += 1;
        if (process.env.SCHEMA_VERBOSE === 'true') {
          console.warn('[SCHEMA] skip:', err.message.slice(0, 160));
        }
      }
    }
    console.log(
      `[SCHEMA] Base schema partial apply complete (ok=${applied}, skipped=${skipped})`
    );
  } finally {
    if (shouldRelease) runner.release();
  }
}

module.exports = applyBaseSchema;
