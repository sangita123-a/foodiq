const { pool } = require('../config/db');

const getOrCreateWallet = async (partnerId, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO driver_wallets (delivery_partner_id, balance)
     VALUES ($1, 0)
     ON CONFLICT (delivery_partner_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [partnerId]
  );
  return rows[0];
};

const creditWallet = async (partnerId, amount, reference, note = 'Delivery earnings') => {
  if (!amount || amount <= 0) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wallet = await getOrCreateWallet(partnerId, client);
    const { rows } = await client.query(
      `UPDATE driver_wallets
       SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP
       WHERE delivery_partner_id = $2
       RETURNING *`,
      [amount, partnerId]
    );
    await client.query(
      `INSERT INTO driver_wallet_transactions (
         delivery_partner_id, type, amount, status, reference_type, reference_id, note
       ) VALUES ($1, 'credit', $2, 'completed', 'order', $3, $4)`,
      [partnerId, amount, reference, note]
    );
    await client.query('COMMIT');
    return rows[0] || wallet;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getWalletSummary = async (partnerId) => {
  const wallet = await getOrCreateWallet(partnerId);
  const txns = await pool.query(
    `SELECT id, type, amount, status, note, reference_type, reference_id, created_at
     FROM driver_wallet_transactions
     WHERE delivery_partner_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [partnerId]
  );
  const withdrawals = await pool.query(
    `SELECT id, amount, status, note, created_at, processed_at
     FROM driver_withdrawal_requests
     WHERE delivery_partner_id = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [partnerId]
  );
  const totalEarned = await pool.query(
    `SELECT COALESCE(SUM(amount), 0)::float AS total
     FROM delivery_earnings WHERE delivery_partner_id = $1`,
    [partnerId]
  );
  return {
    balance: Number(wallet.balance || 0),
    total_earned: totalEarned.rows[0].total,
    transactions: txns.rows,
    withdrawals: withdrawals.rows,
  };
};

const requestWithdrawal = async (partnerId, amount, note = '') => {
  const wallet = await getOrCreateWallet(partnerId);
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 100) {
    throw Object.assign(new Error('Minimum withdrawal amount is ₹100'), { status: 400 });
  }
  if (Number(wallet.balance) < amt) {
    throw Object.assign(new Error('Insufficient wallet balance'), { status: 400 });
  }

  const partner = await pool.query(
    `SELECT bank_account_name, bank_account_number, bank_ifsc, upi_id
     FROM delivery_partners WHERE id = $1`,
    [partnerId]
  );
  if (!partner.rows[0]?.bank_account_number && !partner.rows[0]?.upi_id) {
    throw Object.assign(new Error('Add bank or UPI details in profile before withdrawing'), {
      status: 400,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE driver_wallets
       SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP
       WHERE delivery_partner_id = $2 AND balance >= $1`,
      [amt, partnerId]
    );
    const { rows } = await client.query(
      `INSERT INTO driver_withdrawal_requests (delivery_partner_id, amount, status, note)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [partnerId, amt, note || 'Withdrawal request']
    );
    await client.query(
      `INSERT INTO driver_wallet_transactions (
         delivery_partner_id, type, amount, status, reference_type, reference_id, note
       ) VALUES ($1, 'withdrawal', $2, 'pending', 'withdrawal', $3, $4)`,
      [partnerId, amt, rows[0].id, 'Withdrawal request submitted']
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  getOrCreateWallet,
  creditWallet,
  getWalletSummary,
  requestWithdrawal,
};
