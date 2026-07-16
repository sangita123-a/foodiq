const { pool } = require('../config/db');

const parseUa = (ua = '') => {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : 'Unknown';
  const device_type = /Mobile|Android|iPhone/.test(ua) ? 'mobile' : 'desktop';
  const device_name = `${browser} on ${os}`;
  return { browser, os, device_type, device_name };
};

const registerSession = async (req, res) => {
  try {
    const ua = req.headers['user-agent'] || '';
    const parsed = parseUa(ua);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const location = req.body.location || 'Hyderabad, India';

    await pool.query('UPDATE user_sessions SET is_current = false WHERE user_id = $1', [req.user.id]);

    const existing = await pool.query(
      `SELECT id FROM user_sessions
       WHERE user_id = $1 AND device_name = $2 AND browser = $3
       ORDER BY last_active DESC LIMIT 1`,
      [req.user.id, parsed.device_name, parsed.browser]
    );

    let session;
    if (existing.rows[0]) {
      const { rows } = await pool.query(
        `UPDATE user_sessions
         SET is_current = true, last_active = CURRENT_TIMESTAMP, ip_address = $1, location = $2
         WHERE id = $3 RETURNING *`,
        [String(ip).split(',')[0].trim(), location, existing.rows[0].id]
      );
      session = rows[0];
    } else {
      const { rows } = await pool.query(
        `INSERT INTO user_sessions
          (user_id, device_name, device_type, browser, os, ip_address, location, is_current)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING *`,
        [req.user.id, parsed.device_name, parsed.device_type, parsed.browser, parsed.os, String(ip).split(',')[0].trim(), location]
      );
      session = rows[0];
    }

    await pool.query(
      `INSERT INTO login_history (user_id, device_name, ip_address, location, status)
       VALUES ($1,$2,$3,$4,'success')`,
      [req.user.id, parsed.device_name, String(ip).split(',')[0].trim(), location]
    );

    res.json({ success: true, message: 'Session registered', data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY is_current DESC, last_active DESC`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Sessions retrieved', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const removeSession = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM user_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Session not found', error: {} });
    }
    res.json({ success: true, message: 'Session removed', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const logoutAll = async (req, res) => {
  try {
    await pool.query('DELETE FROM user_sessions WHERE user_id = $1 AND is_current = false', [req.user.id]);
    res.json({ success: true, message: 'Logged out from other devices', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getLoginHistory = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM login_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Login history retrieved', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { registerSession, getSessions, removeSession, logoutAll, getLoginHistory };
