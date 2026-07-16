const { pool } = require('../config/db');

const initContactTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("Error init contact table", e);
  }
};
initContactTable();

const submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, subject, message]
    );
    res.status(201).json({ success: true, message: 'Message sent successfully', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { submitContact };
