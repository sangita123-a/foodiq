const { pool } = require('../config/db');
const { t } = require('./i18nService');
const { aiEnabled } = require('./voiceOrderingService');

const FAQ = [
  { q: /refund|cancel/i, a: 'You can cancel from Orders while status is Pending. Refunds follow payment policy.' },
  { q: /delivery|track/i, a: 'Open Orders → Track for live delivery status.' },
  { q: /payment|razorpay|upi/i, a: 'We support UPI, cards, and COD where enabled.' },
  { q: /hello|hi|help/i, a: null },
];

const reply = async ({ userId, message, locale = 'en', sessionId = null }) => {
  const enabled = aiEnabled();
  const text = String(message || '').trim();
  let answer = FAQ.find((f) => f.q.test(text))?.a;
  if (!answer) {
    answer = t(locale, 'support.hello', 'How can we help you today?');
  }
  if (/ticket|agent|human/i.test(text)) {
    answer = 'I created a support intent. An agent will follow up via Support tickets.';
  }

  const messages = [
    { role: 'user', content: text, at: new Date().toISOString() },
    { role: 'assistant', content: answer, at: new Date().toISOString() },
  ];

  let id = sessionId;
  if (id) {
    await pool.query(
      `UPDATE ai_chat_sessions
       SET messages = messages || $1::jsonb, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(messages), id]
    );
  } else {
    const { rows } = await pool.query(
      `INSERT INTO ai_chat_sessions (user_id, channel, messages)
       VALUES ($1, 'support', $2::jsonb) RETURNING id`,
      [userId || null, JSON.stringify(messages)]
    );
    id = rows[0].id;
  }

  return { enabled, session_id: id, reply: answer, messages };
};

module.exports = { reply };
