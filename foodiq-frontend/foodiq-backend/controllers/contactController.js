const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');

const initContactTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(40),
        reason VARCHAR(80),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(40) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      ALTER TABLE contact_messages
        ADD COLUMN IF NOT EXISTS phone VARCHAR(40),
        ADD COLUMN IF NOT EXISTS reason VARCHAR(80),
        ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'open'
    `);
  } catch (e) {
    console.error('Error init contact table', e);
  }
};
initContactTable();

const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message, phone, reason } = req.body;
    if (!name || !email || !subject || !message) {
      return fail(res, 400, 'All fields are required');
    }
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, reason, subject, message)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        String(name).trim().slice(0, 255),
        String(email).trim().slice(0, 255),
        phone ? String(phone).trim().slice(0, 40) : null,
        reason ? String(reason).trim().slice(0, 80) : null,
        String(subject).trim().slice(0, 255),
        String(message).trim().slice(0, 8000),
      ]
    );
    return ok(res, 'Message sent successfully', rows[0], 201);
  } catch (error) {
    return fail(res, 500, 'Server Error', error);
  }
};

module.exports = { submitContact };
