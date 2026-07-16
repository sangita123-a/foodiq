const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

const getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, full_name, phone_number, role, profile_image_url,
              date_of_birth, gender, two_factor_enabled, created_at
       FROM users WHERE id = $1 AND COALESCE(is_deleted, false) = false`,
      [req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'User not found', error: {} });
    }
    const user = rows[0];
    if (user.date_of_birth) {
      user.date_of_birth = new Date(user.date_of_birth).toISOString().slice(0, 10);
    }
    res.json({ success: true, message: 'Profile retrieved', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone_number,
      profile_image_url,
      date_of_birth,
      gender,
      two_factor_enabled,
      old_password,
      new_password,
    } = req.body;

    let query = `
      UPDATE users SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        phone_number = COALESCE($3, phone_number),
        profile_image_url = COALESCE($4, profile_image_url),
        date_of_birth = COALESCE($5, date_of_birth),
        gender = COALESCE($6, gender),
        two_factor_enabled = COALESCE($7, two_factor_enabled)
    `;
    const values = [
      full_name ?? null,
      email ?? null,
      phone_number ?? null,
      profile_image_url ?? null,
      date_of_birth || null,
      gender || null,
      typeof two_factor_enabled === 'boolean' ? two_factor_enabled : null,
    ];
    let valueIndex = 8;

    if (old_password && new_password) {
      if (String(new_password).length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters',
          error: {},
        });
      }
      const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const isMatch = await bcrypt.compare(old_password, rows[0].password_hash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect old password', error: {} });
      }
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(new_password, salt);
      query += `, password_hash = $${valueIndex}`;
      values.push(newHash);
      valueIndex++;
    }

    query += ` WHERE id = $${valueIndex}
      RETURNING id, email, full_name, phone_number, role, profile_image_url,
                date_of_birth, gender, two_factor_enabled, created_at`;
    values.push(req.user.id);

    const { rows: updatedRows } = await pool.query(query, values);
    const user = updatedRows[0];
    if (user?.date_of_birth) {
      user.date_of_birth = new Date(user.date_of_birth).toISOString().slice(0, 10);
    }
    res.json({ success: true, message: 'Profile updated', data: user });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Email already in use', error: {} });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const { confirmation } = req.body;
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        success: false,
        message: 'Please type DELETE MY ACCOUNT to confirm',
        error: {},
      });
    }
    await pool.query('UPDATE users SET is_deleted = true, email = email || \'.deleted.\' || id::text WHERE id = $1', [
      req.user.id,
    ]);
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'Account deleted successfully', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const [ordersRes, spendRes, rewardsRes, favsRes, restFavsRes, notifsRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM orders WHERE user_id = $1', [userId]),
      pool.query(
        `SELECT COALESCE(SUM(total_amount), 0)::float AS total
         FROM orders WHERE user_id = $1 AND LOWER(status) NOT IN ('cancelled')`,
        [userId]
      ),
      pool.query('SELECT * FROM rewards WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS count FROM favorites WHERE user_id = $1', [userId]),
      pool.query('SELECT COUNT(*)::int AS count FROM restaurant_favorites WHERE user_id = $1', [userId]),
      pool.query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [userId]
      ),
    ]);

    const recentOrders = await pool.query(
      `SELECT o.*, r.name AS restaurant_name
       FROM orders o
       LEFT JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Dashboard retrieved',
      data: {
        total_orders: ordersRes.rows[0].count,
        total_spending: spendRes.rows[0].total,
        reward_points: rewardsRes.rows[0]?.points_balance || 0,
        favorite_items: favsRes.rows[0].count,
        favorite_restaurants: restFavsRes.rows[0].count,
        recent_orders: recentOrders.rows,
        recent_notifications: notifsRes.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, deleteAccount, getDashboard };
