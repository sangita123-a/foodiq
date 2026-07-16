const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT dp.*, u.full_name as name, u.phone_number as phone 
      FROM delivery_partners dp
      JOIN users u ON dp.user_id = u.id
    `);
    res.json({ success: true, message: 'Delivery partners retrieved', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { vehicle_details, vehicle_type, license_number } = req.body;
    
    const { rows } = await pool.query(`
      INSERT INTO delivery_partners (user_id, vehicle_details, vehicle_type, license_number)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET 
        vehicle_details = EXCLUDED.vehicle_details,
        vehicle_type = EXCLUDED.vehicle_type,
        license_number = EXCLUDED.license_number
      RETURNING *
    `, [req.user.id, vehicle_details, vehicle_type, license_number]);
    
    await pool.query("UPDATE users SET role = 'delivery_partner' WHERE id = $1", [req.user.id]);
    
    res.status(201).json({ success: true, message: 'Delivery partner registered', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available, current_lat, current_lng } = req.body;
    
    const { rows } = await pool.query(`
      UPDATE delivery_partners 
      SET is_available = COALESCE($1, is_available),
          current_lat = COALESCE($2, current_lat),
          current_lng = COALESCE($3, current_lng),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [is_available, current_lat, current_lng, id]);
    
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Delivery partner not found', error: {} });
    
    res.json({ success: true, message: 'Delivery partner updated', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM delivery_partners WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Delivery partner not found', error: {} });
    
    await pool.query("UPDATE users SET role = 'customer' WHERE id = $1", [rows[0].user_id]);
    
    res.json({ success: true, message: 'Delivery partner removed', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, create, update, remove };
