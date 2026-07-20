const { pool } = require('../config/db');

/** Persist order status timeline entry for customer audit trail. */
async function recordOrderTrackingHistory({
  orderId,
  status,
  note = null,
  actorType = null,
  actorId = null,
}) {
  if (!orderId || !status) return;
  await pool.query(
    `INSERT INTO order_tracking_history (order_id, status, note, actor_type, actor_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, status, note, actorType, actorId]
  );
}

/** Append GPS point for delivery partner (time-series). */
async function recordDriverLocation({ driverId, lat, lng, orderId = null }) {
  if (!driverId || lat == null || lng == null) return;
  await pool.query(
    `INSERT INTO driver_locations (driver_id, order_id, latitude, longitude, last_updated)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
    [driverId, orderId, lat, lng]
  );
}

async function getTrackingHistory(orderId) {
  const { rows } = await pool.query(
    `SELECT id, order_id, status, note, actor_type, actor_id, created_at
     FROM order_tracking_history
     WHERE order_id = $1
     ORDER BY created_at ASC`,
    [orderId]
  );
  return rows;
}

/** Admin: active deliveries with latest rider coordinates. */
async function getLiveDeliveries() {
  const { rows } = await pool.query(
    `SELECT
       o.id AS order_id,
       o.status AS order_status,
       o.total_amount,
       o.created_at,
       r.name AS restaurant_name,
       r.lat AS restaurant_lat,
       r.lng AS restaurant_lng,
       ot.current_status AS tracking_status,
       ot.location_lat AS rider_lat,
       ot.location_lng AS rider_lng,
       ot.estimated_delivery_time,
       dp.id AS driver_id,
       u.full_name AS driver_name,
       u.phone_number AS driver_phone,
       a.lat AS customer_lat,
       a.lng AS customer_lng,
       a.city AS customer_city
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     LEFT JOIN order_tracking ot ON ot.order_id = o.id
     LEFT JOIN delivery_partners dp ON dp.id = ot.delivery_partner_id
     LEFT JOIN users u ON u.id = dp.user_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     WHERE LOWER(o.status) NOT IN ('delivered', 'cancelled', 'rejected')
       AND o.created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
     ORDER BY o.created_at DESC
     LIMIT 100`
  );
  return rows;
}

/** Delayed orders: not delivered 45+ min after creation and still active. */
async function getDelayedOrders() {
  const { rows } = await pool.query(
    `SELECT o.id, o.status, o.created_at, r.name AS restaurant_name,
            ot.current_status, ot.estimated_delivery_time
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     LEFT JOIN order_tracking ot ON ot.order_id = o.id
     WHERE LOWER(o.status) NOT IN ('delivered', 'cancelled', 'rejected')
       AND o.created_at < CURRENT_TIMESTAMP - INTERVAL '45 minutes'
     ORDER BY o.created_at ASC
     LIMIT 50`
  );
  return rows;
}

module.exports = {
  recordOrderTrackingHistory,
  recordDriverLocation,
  getTrackingHistory,
  getLiveDeliveries,
  getDelayedOrders,
};
