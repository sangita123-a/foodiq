const { pool } = require('../config/db');

const initSupportTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Open',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error("Error init support table", e);
  }
};
initSupportTable();

const submitSupport = async (req, res) => {
  try {
    const { category, subject, description } = req.body;
    if (!category || !subject || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const { rows } = await pool.query(
      'INSERT INTO support_tickets (user_id, category, subject, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, category, subject, description]
    );
    res.status(201).json({ success: true, message: 'Support ticket submitted successfully', data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

module.exports = { submitSupport };
