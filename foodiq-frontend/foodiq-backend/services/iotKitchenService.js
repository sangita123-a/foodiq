const { pool } = require('../config/db');

const ingestTelemetry = async ({ device_key, metric, value, payload = {} }) => {
  const { rows: devices } = await pool.query(
    `SELECT id FROM iot_devices WHERE device_key = $1 AND is_active = TRUE LIMIT 1`,
    [device_key]
  );
  if (!devices[0]) {
    const err = new Error('Unknown device_key');
    err.status = 404;
    throw err;
  }
  const deviceId = devices[0].id;
  await pool.query(`UPDATE iot_devices SET last_seen_at = NOW() WHERE id = $1`, [deviceId]);
  const { rows } = await pool.query(
    `INSERT INTO iot_telemetry (device_id, metric, value, payload)
     VALUES ($1, $2, $3, $4::jsonb) RETURNING *`,
    [deviceId, metric, value ?? null, JSON.stringify(payload)]
  );
  return rows[0];
};

const registerDevice = async ({ restaurant_id, organization_id, device_key, name, device_type }) => {
  const { rows } = await pool.query(
    `INSERT INTO iot_devices (restaurant_id, organization_id, device_key, name, device_type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [restaurant_id || null, organization_id || null, device_key, name, device_type || 'sensor']
  );
  return rows[0];
};

module.exports = { ingestTelemetry, registerDevice };
