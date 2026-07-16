const { pool } = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM payment_methods
       WHERE user_id = $1 AND is_active = true
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, message: 'Payment methods retrieved', data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const unsetOtherDefaults = async (userId, excludeId) => {
  await pool.query(
    'UPDATE payment_methods SET is_default = false WHERE user_id = $1 AND id != $2',
    [userId, excludeId]
  );
};

const create = async (req, res) => {
  try {
    const {
      type,
      label,
      card_holder_name,
      card_number,
      card_brand,
      card_expiry,
      upi_id,
      wallet_name,
      is_default,
    } = req.body;

    const allowed = ['credit_card', 'debit_card', 'upi', 'wallet', 'cod'];
    if (!type || !allowed.includes(type)) {
      return res.status(400).json({ success: false, message: 'Valid payment type is required', error: {} });
    }

    let card_last4 = null;
    if (type === 'credit_card' || type === 'debit_card') {
      const digits = String(card_number || '').replace(/\D/g, '');
      if (digits.length < 12) {
        return res.status(400).json({ success: false, message: 'Valid card number is required', error: {} });
      }
      card_last4 = digits.slice(-4);
    }
    if (type === 'upi' && !upi_id) {
      return res.status(400).json({ success: false, message: 'UPI ID is required', error: {} });
    }

    const { rows } = await pool.query(
      `INSERT INTO payment_methods
        (user_id, type, label, card_holder_name, card_last4, card_brand, card_expiry, upi_id, wallet_name, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,false))
       RETURNING *`,
      [
        req.user.id,
        type,
        label || null,
        card_holder_name || null,
        card_last4,
        card_brand || null,
        card_expiry || null,
        upi_id || null,
        wallet_name || null,
        is_default,
      ]
    );

    if (rows[0].is_default) await unsetOtherDefaults(req.user.id, rows[0].id);
    res.status(201).json({ success: true, message: 'Payment method added', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      'SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2 AND is_active = true',
      [id, req.user.id]
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, message: 'Payment method not found', error: {} });
    }

    const b = req.body;
    let card_last4 = existing.rows[0].card_last4;
    if (b.card_number) {
      const digits = String(b.card_number).replace(/\D/g, '');
      if (digits.length >= 4) card_last4 = digits.slice(-4);
    }

    const { rows } = await pool.query(
      `UPDATE payment_methods SET
        label = COALESCE($1, label),
        card_holder_name = COALESCE($2, card_holder_name),
        card_last4 = COALESCE($3, card_last4),
        card_brand = COALESCE($4, card_brand),
        card_expiry = COALESCE($5, card_expiry),
        upi_id = COALESCE($6, upi_id),
        wallet_name = COALESCE($7, wallet_name),
        is_default = COALESCE($8, is_default),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [
        b.label ?? null,
        b.card_holder_name ?? null,
        card_last4,
        b.card_brand ?? null,
        b.card_expiry ?? null,
        b.upi_id ?? null,
        b.wallet_name ?? null,
        typeof b.is_default === 'boolean' ? b.is_default : null,
        id,
        req.user.id,
      ]
    );

    if (rows[0].is_default) await unsetOtherDefaults(req.user.id, rows[0].id);
    res.json({ success: true, message: 'Payment method updated', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE payment_methods SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Payment method not found', error: {} });
    }
    res.json({ success: true, message: 'Payment method removed', data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const setDefault = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2 AND is_active = true',
      [id, req.user.id]
    );
    if (!existing.rows[0]) {
      return res.status(404).json({ success: false, message: 'Payment method not found', error: {} });
    }
    await unsetOtherDefaults(req.user.id, id);
    const { rows } = await pool.query(
      'UPDATE payment_methods SET is_default = true WHERE id = $1 RETURNING *',
      [id]
    );
    res.json({ success: true, message: 'Default payment method updated', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { getAll, create, update, remove, setDefault };
