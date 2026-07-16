const { pool } = require('../config/db');

const SETTINGS_COLUMNS = `
  user_id, email_notifications, push_notifications, theme, language,
  notify_orders, notify_offers, notify_rewards, country, currency, timezone,
  accent_color, hide_profile, data_sharing, created_at, updated_at
`;

const ensureSettings = async (userId) => {
  const { rows } = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [userId]);
  if (rows[0]) return rows[0];
  const inserted = await pool.query(
    'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return inserted.rows[0];
};

const getSettings = async (req, res) => {
  try {
    const settings = await ensureSettings(req.user.id);
    res.json({ success: true, message: 'Settings retrieved', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    await ensureSettings(req.user.id);
    const b = req.body;
    const { rows } = await pool.query(
      `UPDATE user_settings SET
        email_notifications = COALESCE($1, email_notifications),
        push_notifications = COALESCE($2, push_notifications),
        theme = COALESCE($3, theme),
        language = COALESCE($4, language),
        notify_orders = COALESCE($5, notify_orders),
        notify_offers = COALESCE($6, notify_offers),
        notify_rewards = COALESCE($7, notify_rewards),
        country = COALESCE($8, country),
        currency = COALESCE($9, currency),
        timezone = COALESCE($10, timezone),
        accent_color = COALESCE($11, accent_color),
        hide_profile = COALESCE($12, hide_profile),
        data_sharing = COALESCE($13, data_sharing),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $14
       RETURNING *`,
      [
        typeof b.email_notifications === 'boolean' ? b.email_notifications : null,
        typeof b.push_notifications === 'boolean' ? b.push_notifications : null,
        b.theme ?? null,
        b.language ?? null,
        typeof b.notify_orders === 'boolean' ? b.notify_orders : null,
        typeof b.notify_offers === 'boolean' ? b.notify_offers : null,
        typeof b.notify_rewards === 'boolean' ? b.notify_rewards : null,
        b.country ?? null,
        b.currency ?? null,
        b.timezone ?? null,
        b.accent_color ?? null,
        typeof b.hide_profile === 'boolean' ? b.hide_profile : null,
        typeof b.data_sharing === 'boolean' ? b.data_sharing : null,
        req.user.id,
      ]
    );
    res.json({ success: true, message: 'Settings updated', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getSettings, updateSettings };
