const { pool } = require('../config/db');

/** Persist a single GPS ping for a delivery partner (time-series, for live tracking + replay). */
const recordLocation = async ({ partnerId, orderId = null, latitude, longitude, accuracy = null, speed = null, heading = null }) => {
  const { rows } = await pool.query(
    `INSERT INTO delivery_locations (partner_id, order_id, latitude, longitude, accuracy, speed, heading)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, partner_id, order_id, latitude, longitude, accuracy, speed, heading, created_at`,
    [partnerId, orderId, latitude, longitude, accuracy, speed, heading]
  );
  return rows[0];
};

/** Latest GPS ping for a partner (optionally scoped to an order). */
const getLatestForPartner = async (partnerId, orderId = null) => {
  const { rows } = await pool.query(
    orderId
      ? `SELECT * FROM delivery_locations WHERE partner_id = $1 AND order_id = $2 ORDER BY created_at DESC LIMIT 1`
      : `SELECT * FROM delivery_locations WHERE partner_id = $1 ORDER BY created_at DESC LIMIT 1`,
    orderId ? [partnerId, orderId] : [partnerId]
  );
  return rows[0] || null;
};

/** Latest GPS ping for an order (regardless of which partner sent it — handles reassignment). */
const getLatestForOrder = async (orderId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_locations WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
};

/** The order currently being actively delivered by this partner, if any. */
const getActiveOrderIdForPartner = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT order_id FROM delivery_assignments
     WHERE delivery_partner_id = $1
       AND status IN ('accepted', 'assigned', 'reached_restaurant', 'picked_up', 'out_for_delivery', 'on_the_way')
     ORDER BY updated_at DESC
     LIMIT 1`,
    [partnerId]
  );
  return rows[0]?.order_id || null;
};

module.exports = {
  recordLocation,
  getLatestForPartner,
  getLatestForOrder,
  getActiveOrderIdForPartner,
};
