const { pool } = require('../config/db');
const { haversineKm, estimateEtaMinutes } = require('../socket');
const { emitLocationUpdated } = require('../socket/emitters');

const getTrackingInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: orderRows } = await pool.query(
      `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
              r.lat AS restaurant_lat, r.lng AS restaurant_lng, r.owner_id,
              a.lat AS customer_lat, a.lng AS customer_lng,
              a.house_no, a.street, a.city, a.state, a.zip_code, a.phone_number
       FROM orders o
       JOIN restaurants r ON r.id = o.restaurant_id
       LEFT JOIN addresses a ON a.id = o.delivery_address_id
       WHERE o.id = $1`,
      [id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found', error: {} });
    }

    const order = orderRows[0];
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized', error: {} });
    }

    const { rows } = await pool.query('SELECT * FROM order_tracking WHERE order_id = $1', [id]);

    let tracking = rows[0];
    if (!tracking) {
      const newTracking = await pool.query(
        `
        INSERT INTO order_tracking (order_id, current_status, estimated_delivery_time)
        VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
        RETURNING *
      `,
        [id, order.status]
      );
      tracking = newTracking.rows[0];
    }

    let rider = null;
    if (tracking.delivery_partner_id) {
      const partner = await pool.query(
        `SELECT dp.id, dp.vehicle_details, dp.vehicle_type, dp.current_lat, dp.current_lng,
                dp.rating, u.full_name, u.phone_number
         FROM delivery_partners dp
         JOIN users u ON u.id = dp.user_id
         WHERE dp.id = $1`,
        [tracking.delivery_partner_id]
      );
      if (partner.rows[0]) {
        const p = partner.rows[0];
        rider = {
          id: p.id,
          name: p.full_name,
          phone: p.phone_number,
          vehicle_details: p.vehicle_details,
          vehicle_type: p.vehicle_type,
          rating: p.rating,
          lat: p.current_lat != null ? Number(p.current_lat) : tracking.location_lat,
          lng: p.current_lng != null ? Number(p.current_lng) : tracking.location_lng,
        };
      }
    }

    const riderLat = rider?.lat != null ? Number(rider.lat) : Number(tracking.location_lat);
    const riderLng = rider?.lng != null ? Number(rider.lng) : Number(tracking.location_lng);
    const custLat = order.customer_lat != null ? Number(order.customer_lat) : null;
    const custLng = order.customer_lng != null ? Number(order.customer_lng) : null;

    let distance_km = null;
    let eta_minutes = null;
    if (
      riderLat != null &&
      !Number.isNaN(riderLat) &&
      custLat != null &&
      !Number.isNaN(custLat)
    ) {
      distance_km = Math.round(haversineKm(riderLat, riderLng, custLat, custLng) * 100) / 100;
      eta_minutes = estimateEtaMinutes(distance_km);
    } else if (tracking.estimated_delivery_time) {
      const ms = new Date(tracking.estimated_delivery_time).getTime() - Date.now();
      if (ms > 0) eta_minutes = Math.max(1, Math.round(ms / 60000));
    }

    res.json({
      success: true,
      message: 'Tracking info retrieved',
      data: {
        ...tracking,
        location_lat: tracking.location_lat != null ? Number(tracking.location_lat) : riderLat,
        location_lng: tracking.location_lng != null ? Number(tracking.location_lng) : riderLng,
        order_status: order.status,
        restaurant: {
          id: order.restaurant_id,
          name: order.restaurant_name,
          address: order.restaurant_address,
          lat: order.restaurant_lat != null ? Number(order.restaurant_lat) : null,
          lng: order.restaurant_lng != null ? Number(order.restaurant_lng) : null,
        },
        customer: {
          lat: custLat,
          lng: custLng,
          address: [order.house_no, order.street, order.city, order.state, order.zip_code]
            .filter(Boolean)
            .join(', '),
          phone: order.phone_number,
        },
        rider,
        distance_km,
        eta_minutes,
        live: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_lat, location_lng } = req.body;

    if (req.user.role !== 'delivery_partner' && req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized to update location', error: {} });
    }

    const lat = Number(location_lat);
    const lng = Number(location_lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates', error: {} });
    }

    const { rows } = await pool.query(
      `
      UPDATE order_tracking 
      SET location_lat = $1, location_lng = $2, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $3
      RETURNING *
    `,
      [lat, lng, id]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: 'Tracking record not found', error: {} });
    }

    const partner = await pool.query(
      'UPDATE delivery_partners SET current_lat = $1, current_lng = $2 WHERE user_id = $3 RETURNING id',
      [lat, lng, req.user.id]
    );

    const orderMeta = await pool.query(
      `SELECT user_id, restaurant_id FROM orders WHERE id = $1`,
      [id]
    );

    let distance_km = null;
    let eta_minutes = null;
    try {
      const dest = await pool.query(
        `SELECT a.lat, a.lng FROM orders o
         JOIN addresses a ON a.id = o.delivery_address_id WHERE o.id = $1`,
        [id]
      );
      if (dest.rows[0]?.lat != null) {
        distance_km =
          Math.round(haversineKm(lat, lng, Number(dest.rows[0].lat), Number(dest.rows[0].lng)) * 100) /
          100;
        eta_minutes = estimateEtaMinutes(distance_km);
      }
    } catch {
      /* ignore */
    }

    emitLocationUpdated({
      order_id: id,
      user_id: orderMeta.rows[0]?.user_id,
      restaurant_id: orderMeta.rows[0]?.restaurant_id,
      delivery_partner_id: partner.rows[0]?.id || rows[0].delivery_partner_id,
      lat,
      lng,
      eta_minutes,
      distance_km,
    });

    res.json({
      success: true,
      message: 'Location updated',
      data: { ...rows[0], distance_km, eta_minutes },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getTrackingInfo, updateLocation };
