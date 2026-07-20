const { pool } = require('../config/db');

const getOrCreateWallet = async (userId, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO customer_wallets (user_id, balance, cashback_balance, refund_balance)
     VALUES ($1, 0, 0, 0)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId]
  );
  return rows[0];
};

const getWalletByUserId = async (userId) => {
  return getOrCreateWallet(userId);
};

const listTransactions = async (userId, { limit = 50, type = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT * FROM wallet_transactions
     WHERE user_id = $1
       AND ($2 = '' OR type = $2 OR category = $2)
     ORDER BY created_at DESC
     LIMIT $3`,
    [userId, type || '', Math.min(Number(limit) || 50, 200)]
  );
  return rows;
};

const creditWallet = async (
  userId,
  amount,
  {
    type = 'credit',
    category = 'general',
    referenceType = null,
    referenceId = null,
    orderId = null,
    dedupeKey = null,
    note = '',
    meta = {},
    cashbackPortion = 0,
    refundPortion = 0,
  },
  client = null
) => {
  const amt = Number(amount);
  if (!userId || !Number.isFinite(amt) || amt <= 0) {
    throw Object.assign(new Error('Invalid credit amount'), { status: 400 });
  }

  const db = client || (await pool.connect());
  const ownClient = !client;

  try {
    if (ownClient) await db.query('BEGIN');

    if (dedupeKey) {
      const dup = await db.query(
        `SELECT id FROM wallet_transactions WHERE dedupe_key = $1 LIMIT 1`,
        [dedupeKey]
      );
      if (dup.rows[0]) {
        if (ownClient) await db.query('ROLLBACK');
        return { duplicate: true, id: dup.rows[0].id };
      }
    }

    await getOrCreateWallet(userId, db);
    const cb = Number(cashbackPortion) || (category === 'cashback' ? amt : 0);
    const rf = Number(refundPortion) || (category === 'refund' ? amt : 0);

    const { rows } = await db.query(
      `UPDATE customer_wallets SET
         balance = balance + $1,
         cashback_balance = cashback_balance + $2,
         refund_balance = refund_balance + $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING *`,
      [amt, cb, rf, userId]
    );
    const wallet = rows[0];

    const { rows: txnRows } = await db.query(
      `INSERT INTO wallet_transactions (
         user_id, type, category, amount, balance_after, status,
         reference_type, reference_id, order_id, dedupe_key, note, meta
       ) VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9, $10, $11::jsonb)
       RETURNING *`,
      [
        userId,
        type,
        category,
        amt,
        Number(wallet.balance),
        referenceType,
        referenceId ? String(referenceId) : null,
        orderId,
        dedupeKey,
        note,
        JSON.stringify(meta),
      ]
    );

    if (ownClient) await db.query('COMMIT');
    return { wallet, transaction: txnRows[0] };
  } catch (err) {
    if (ownClient) await db.query('ROLLBACK');
    throw err;
  } finally {
    if (ownClient) db.release();
  }
};

const debitWallet = async (
  userId,
  amount,
  {
    type = 'debit',
    category = 'payment',
    referenceType = null,
    referenceId = null,
    orderId = null,
    dedupeKey = null,
    note = '',
    meta = {},
  },
  client = null
) => {
  const amt = Number(amount);
  if (!userId || !Number.isFinite(amt) || amt <= 0) {
    throw Object.assign(new Error('Invalid debit amount'), { status: 400 });
  }

  const db = client || (await pool.connect());
  const ownClient = !client;

  try {
    if (ownClient) await db.query('BEGIN');

    if (dedupeKey) {
      const dup = await db.query(
        `SELECT id FROM wallet_transactions WHERE dedupe_key = $1 LIMIT 1`,
        [dedupeKey]
      );
      if (dup.rows[0]) {
        if (ownClient) await db.query('ROLLBACK');
        return { duplicate: true, id: dup.rows[0].id };
      }
    }

    const wallet = await getOrCreateWallet(userId, db);
    if (Number(wallet.balance) < amt) {
      throw Object.assign(new Error('Insufficient wallet balance'), { status: 400 });
    }

    let remaining = amt;
    let refundDebit = Math.min(Number(wallet.refund_balance), remaining);
    remaining -= refundDebit;
    let cashbackDebit = Math.min(Number(wallet.cashback_balance), remaining);
    remaining -= cashbackDebit;

    const { rows } = await db.query(
      `UPDATE customer_wallets SET
         balance = balance - $1,
         refund_balance = refund_balance - $2,
         cashback_balance = cashback_balance - $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4 AND balance >= $1
       RETURNING *`,
      [amt, refundDebit, cashbackDebit, userId]
    );
    if (!rows[0]) {
      throw Object.assign(new Error('Insufficient wallet balance'), { status: 400 });
    }

    const { rows: txnRows } = await db.query(
      `INSERT INTO wallet_transactions (
         user_id, type, category, amount, balance_after, status,
         reference_type, reference_id, order_id, dedupe_key, note, meta
       ) VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9, $10, $11::jsonb)
       RETURNING *`,
      [
        userId,
        type,
        category,
        -amt,
        Number(rows[0].balance),
        referenceType,
        referenceId ? String(referenceId) : null,
        orderId,
        dedupeKey,
        note,
        JSON.stringify({ ...meta, refund_debit: refundDebit, cashback_debit: cashbackDebit }),
      ]
    );

    if (ownClient) await db.query('COMMIT');
    return { wallet: rows[0], transaction: txnRows[0] };
  } catch (err) {
    if (ownClient) await db.query('ROLLBACK');
    throw err;
  } finally {
    if (ownClient) db.release();
  }
};

const getWalletSummary = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  const transactions = await listTransactions(userId, { limit: 30 });
  return {
    balance: Number(wallet.balance || 0),
    cashback_balance: Number(wallet.cashback_balance || 0),
    refund_balance: Number(wallet.refund_balance || 0),
    transactions,
  };
};

const listAllTransactions = async ({ limit = 100, user_id = '' } = {}) => {
  const { rows } = await pool.query(
    `SELECT wt.*, u.full_name, u.email
     FROM wallet_transactions wt
     JOIN users u ON u.id = wt.user_id
     WHERE ($1 = '' OR wt.user_id = $1::uuid)
     ORDER BY wt.created_at DESC
     LIMIT $2`,
    [user_id || '', Math.min(Number(limit) || 100, 500)]
  );
  return rows;
};

module.exports = {
  getOrCreateWallet,
  getWalletByUserId,
  listTransactions,
  creditWallet,
  debitWallet,
  getWalletSummary,
  listAllTransactions,
};
