const { pool } = require('../config/db');

const getTrackingInfo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRows.length === 0) return res.status(404).json({ success: false, message: 'Order not found', error: {} });
    
    const order = orderRows[0];
    if (req.user.role === 'customer' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized', error: {} });
    }

    const { rows } = await pool.query('SELECT * FROM order_tracking WHERE order_id = $1', [id]);
    
    let tracking = rows[0];
    if (!tracking) {
      const newTracking = await pool.query(`
        INSERT INTO order_tracking (order_id, current_status, estimated_delivery_time)
        VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 minutes')
        RETURNING *
      `, [id, order.status]);
      tracking = newTracking.rows[0];
    }
    
    res.json({ success: true, message: 'Tracking info retrieved', data: tracking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { location_lat, location_lng } = req.body;
    
    if (req.user.role !== 'delivery_partner' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update location', error: {} });
    }
    
    const { rows } = await pool.query(`
      UPDATE order_tracking 
      SET location_lat = $1, location_lng = $2, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $3
      RETURNING *
    `, [location_lat, location_lng, id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tracking record not found', error: {} });
    }

    await pool.query('UPDATE delivery_partners SET current_lat = $1, current_lng = $2 WHERE user_id = $3', [location_lat, location_lng, req.user.id]);
    
    res.json({ success: true, message: 'Location updated', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getTrackingInfo, updateLocation };
