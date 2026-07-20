const { pool } = require('../config/db');
const { ok, fail } = require('../utils/respond');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initNewsletterTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        source VARCHAR(80) DEFAULT 'footer',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) {
    console.error('Error init newsletter table', e);
  }
};
initNewsletterTable();

const subscribeNewsletter = async (req, res) => {
  try {
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase()
      .slice(0, 255);
    const source = String(req.body?.source || 'footer').trim().slice(0, 80);

    if (!email || !EMAIL_RE.test(email)) {
      return fail(res, 400, 'Please enter a valid email address');
    }

    const existing = await pool.query(
      'SELECT id FROM newsletter_subscribers WHERE email = $1',
      [email]
    );
    if (existing.rows.length > 0) {
      return ok(res, 'You are already subscribed to our newsletter', { email });
    }

    const { rows } = await pool.query(
      `INSERT INTO newsletter_subscribers (email, source)
       VALUES ($1, $2) RETURNING id, email, created_at`,
      [email, source]
    );
    return ok(res, 'Successfully subscribed to the newsletter', rows[0], 201);
  } catch (error) {
    if (error.code === '23505') {
      return ok(res, 'You are already subscribed to our newsletter');
    }
    return fail(res, 500, 'Server Error', error);
  }
};

module.exports = { subscribeNewsletter };
