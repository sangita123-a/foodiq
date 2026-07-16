const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, message: 'Notifications retrieved', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { user_id, title, message } = req.body;
    
    if (req.user.role !== 'admin' && req.user.id !== user_id) {
      return res.status(403).json({ success: false, message: 'Not authorized', error: {} });
    }
    
    const { rows } = await pool.query(
      'INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3) RETURNING *',
      [user_id || req.user.id, title, message]
    );
    
    res.status(201).json({ success: true, message: 'Notification created', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Notification not found', error: {} });
    
    res.json({ success: true, message: 'Notification marked as read', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING id',
      [req.user.id]
    );
    res.json({ success: true, message: 'All notifications marked as read', data: { updated: rows.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const clearAll = async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
    res.json({ success: true, message: 'All notifications cleared', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
    
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Notification not found', error: {} });
    
    res.json({ success: true, message: 'Notification deleted', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, create, markRead, markAllRead, clearAll, remove };
