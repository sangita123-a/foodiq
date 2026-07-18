const { pool } = require('../config/db');

const SETTINGS_COLUMNS = `
  user_id, email_notifications, push_notifications, sms_notifications, marketing_emails,
  theme, language, notify_orders, notify_offers, notify_rewards, notify_order_updates,
  country, currency, timezone, accent_color, hide_profile, data_sharing, created_at, updated_at
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
        sms_notifications = COALESCE($3, sms_notifications),
        marketing_emails = COALESCE($4, marketing_emails),
        theme = COALESCE($5, theme),
        language = COALESCE($6, language),
        notify_orders = COALESCE($7, notify_orders),
        notify_offers = COALESCE($8, notify_offers),
        notify_rewards = COALESCE($9, notify_rewards),
        notify_order_updates = COALESCE($10, notify_order_updates),
        country = COALESCE($11, country),
        currency = COALESCE($12, currency),
        timezone = COALESCE($13, timezone),
        accent_color = COALESCE($14, accent_color),
        hide_profile = COALESCE($15, hide_profile),
        data_sharing = COALESCE($16, data_sharing),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $17
       RETURNING *`,
      [
        typeof b.email_notifications === 'boolean' ? b.email_notifications : null,
        typeof b.push_notifications === 'boolean' ? b.push_notifications : null,
        typeof b.sms_notifications === 'boolean' ? b.sms_notifications : null,
        typeof b.marketing_emails === 'boolean' ? b.marketing_emails : null,
        b.theme ?? null,
        b.language ?? null,
        typeof b.notify_orders === 'boolean' ? b.notify_orders : null,
        typeof b.notify_offers === 'boolean' ? b.notify_offers : null,
        typeof b.notify_rewards === 'boolean' ? b.notify_rewards : null,
        typeof b.notify_order_updates === 'boolean' ? b.notify_order_updates : null,
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

module.exports = { getSettings, updateSettings, SETTINGS_COLUMNS };
