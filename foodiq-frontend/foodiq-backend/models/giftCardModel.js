const crypto = require('crypto');
const { pool } = require('../config/db');

const generateCode = () =>
  `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

const purchaseGiftCard = async ({
  purchaserId,
  amount,
  recipientEmail = null,
  currency = 'INR',
  expiresInDays = 365,
}) => {
  const bal = Math.max(0, Number(amount) || 0);
  if (bal < 100) {
    const err = new Error('Minimum gift card amount is 100');
    err.status = 400;
    throw err;
  }
  const code = generateCode();
  const expires = new Date();
  expires.setDate(expires.getDate() + (Number(expiresInDays) || 365));
  const { rows } = await pool.query(
    `INSERT INTO gift_cards
       (code, initial_balance, balance, currency, purchaser_id, recipient_email, expires_at)
     VALUES ($1, $2, $2, $3, $4, $5, $6)
     RETURNING *`,
    [code, bal, currency, purchaserId || null, recipientEmail, expires]
  );
  return rows[0];
};

const getByCode = async (code) => {
  const { rows } = await pool.query(
    `SELECT * FROM gift_cards WHERE UPPER(code) = UPPER($1)`,
    [String(code || '').trim()]
  );
  return rows[0] || null;
};

const redeemGiftCard = async ({ code, userId, amount, orderId = null }) => {
  const card = await getByCode(code);
  if (!card) {
    const err = new Error('Gift card not found');
    err.status = 404;
    throw err;
  }
  if (card.status !== 'active') {
    const err = new Error('Gift card is not active');
    err.status = 400;
    throw err;
  }
  if (card.expires_at && new Date(card.expires_at) < new Date()) {
    await pool.query(`UPDATE gift_cards SET status = 'expired' WHERE id = $1`, [card.id]);
    const err = new Error('Gift card has expired');
    err.status = 400;
    throw err;
  }
  const spend = Math.min(Number(amount) || Number(card.balance), Number(card.balance));
  if (spend <= 0) {
    const err = new Error('Nothing to redeem');
    err.status = 400;
    throw err;
  }
  const { rows } = await pool.query(
    `UPDATE gift_cards
     SET balance = balance - $1,
         status = CASE WHEN balance - $1 <= 0 THEN 'redeemed' ELSE status END,
         updated_at = NOW()
     WHERE id = $2 AND balance >= $1
     RETURNING *`,
    [spend, card.id]
  );
  if (!rows[0]) {
    const err = new Error('Insufficient gift card balance');
    err.status = 400;
    throw err;
  }
  await pool.query(
    `INSERT INTO gift_card_transactions (gift_card_id, user_id, order_id, amount, tx_type)
     VALUES ($1, $2, $3, $4, 'redeem')`,
    [card.id, userId || null, orderId, spend]
  );
  return { card: rows[0], applied: spend };
};

const listMyGiftCards = async (userId) => {
  const { rows } = await pool.query(
    `SELECT * FROM gift_cards
     WHERE purchaser_id = $1 OR LOWER(recipient_email) = (
       SELECT LOWER(email) FROM users WHERE id = $1
     )
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  return rows;
};

module.exports = {
  purchaseGiftCard,
  getByCode,
  redeemGiftCard,
  listMyGiftCards,
};
