const crypto = require('crypto');
const { pool } = require('../config/db');

const hashKey = (raw) =>
  crypto.createHash('sha256').update(String(raw)).digest('hex');

const generateRawKey = () => {
  const raw = `fq_${crypto.randomBytes(24).toString('hex')}`;
  return { raw, prefix: raw.slice(0, 10), hash: hashKey(raw) };
};

const createApiKey = async ({ organization_id, name, scopes = ['public'] }) => {
  const { raw, prefix, hash } = generateRawKey();
  const { rows } = await pool.query(
    `INSERT INTO api_keys (organization_id, name, key_prefix, key_hash, scopes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, organization_id, name, key_prefix, scopes, is_active, created_at`,
    [organization_id || null, name, prefix, hash, scopes]
  );
  return { ...rows[0], raw_key: raw };
};

const findByRawKey = async (raw) => {
  if (!raw) return null;
  const hash = hashKey(raw);
  const { rows } = await pool.query(
    `SELECT * FROM api_keys WHERE key_hash = $1 AND is_active = TRUE LIMIT 1`,
    [hash]
  );
  if (rows[0]) {
    await pool.query(
      `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
      [rows[0].id]
    );
  }
  return rows[0] || null;
};

module.exports = { createApiKey, findByRawKey, hashKey };
