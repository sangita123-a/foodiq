const { pool } = require('../config/db');

const MIN_WITHDRAWAL = 100;

const getOrCreateWallet = async (partnerId, client = pool) => {
  const { rows } = await client.query(
    `INSERT INTO delivery_wallets (partner_id)
     VALUES ($1)
     ON CONFLICT (partner_id) DO UPDATE SET updated_at = delivery_wallets.updated_at
     RETURNING *`,
    [partnerId]
  );
  return rows[0];
};

const creditWallet = async (partnerId, amount, orderId = null, description = 'Delivery earnings') => {
  if (!amount || amount <= 0) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await getOrCreateWallet(partnerId, client);
    const { rows } = await client.query(
      `UPDATE delivery_wallets
       SET available_balance = available_balance + $1,
           lifetime_earnings = lifetime_earnings + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE partner_id = $2
       RETURNING *`,
      [amount, partnerId]
    );
    await client.query(
      `INSERT INTO delivery_transactions (partner_id, order_id, type, amount, description, status)
       VALUES ($1, $2, 'credit', $3, $4, 'completed')`,
      [partnerId, orderId, amount, description]
    );
    await client.query('COMMIT');

    try {
      const dn = require('./deliveryNotificationModel');
      await dn.createNotification({
        partnerId,
        type: 'wallet_credit',
        title: 'Wallet Credited',
        message: `₹${amount} credited to your wallet${orderId ? ` for order #${String(orderId).slice(0, 8)}` : ''}. ${description}`,
        relatedOrderId: orderId,
        actionUrl: '/delivery/wallet',
      });
    } catch (err) {
      console.warn('[deliveryWallet] wallet_credit notification skipped:', err.message);
    }

    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getWalletSummary = async (partnerId) => {
  const wallet = await getOrCreateWallet(partnerId);
  const earnings = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::float AS today,
       COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('week', CURRENT_DATE)), 0)::float AS weekly,
       COALESCE(SUM(amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0)::float AS monthly
     FROM delivery_transactions
     WHERE partner_id = $1 AND type = 'credit' AND status = 'completed'`,
    [partnerId]
  );

  return {
    available_balance: Number(wallet.available_balance || 0),
    pending_balance: Number(wallet.pending_balance || 0),
    lifetime_earnings: Number(wallet.lifetime_earnings || 0),
    today_earnings: earnings.rows[0].today,
    weekly_earnings: earnings.rows[0].weekly,
    monthly_earnings: earnings.rows[0].monthly,
  };
};

const listTransactions = async (partnerId, { page = 1, limit = 20, type = '', status = '' } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;

  const conditions = ['partner_id = $1'];
  const params = [partnerId];
  if (type) {
    params.push(type);
    conditions.push(`type = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.join(' AND ');

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM delivery_transactions WHERE ${where}`,
    params
  );

  const rowsRes = await pool.query(
    `SELECT id, order_id, type, amount, description, status, created_at
     FROM delivery_transactions
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );

  const total = countRes.rows[0].total;
  return {
    transactions: rowsRes.rows,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
};

const requestWithdrawal = async (partnerId, amount, bankAccountId = null) => {
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < MIN_WITHDRAWAL) {
    throw Object.assign(new Error(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`), { status: 400 });
  }

  const existing = await pool.query(
    `SELECT id FROM withdrawal_requests WHERE partner_id = $1 AND status = 'pending'`,
    [partnerId]
  );
  if (existing.rows[0]) {
    throw Object.assign(new Error('You already have a pending withdrawal request'), { status: 409 });
  }

  const bankAccounts = require('./deliveryBankAccountModel');
  let bankAccount = bankAccountId
    ? await bankAccounts.getByIdForPartner(bankAccountId, partnerId)
    : await bankAccounts.getPrimaryForPartner(partnerId);

  if (!bankAccount) {
    throw Object.assign(
      new Error('Please add and verify your bank account before requesting a withdrawal.'),
      { status: 400 }
    );
  }
  if (bankAccount.verification_status !== 'approved') {
    throw Object.assign(
      new Error('Please add and verify your bank account before requesting a withdrawal.'),
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await getOrCreateWallet(partnerId, client);
    const { rows: walletRows } = await client.query(
      `UPDATE delivery_wallets
       SET available_balance = available_balance - $1,
           pending_balance = pending_balance + $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE partner_id = $2 AND available_balance >= $1
       RETURNING *`,
      [amt, partnerId]
    );
    if (!walletRows[0]) {
      throw Object.assign(new Error('Insufficient available balance'), { status: 400 });
    }
    const { rows } = await client.query(
      `INSERT INTO withdrawal_requests (partner_id, amount, bank_account_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING *`,
      [partnerId, amt, bankAccount.id]
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

const listWithdrawals = async ({ status = '', page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * pageSize;

  const conditions = [];
  const params = [];
  if (status) {
    params.push(status);
    conditions.push(`wr.status = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM withdrawal_requests wr ${where}`,
    params
  );

  const rowsRes = await pool.query(
    `SELECT wr.*, u.full_name AS partner_name, u.email AS partner_email, u.phone_number AS partner_phone
     FROM withdrawal_requests wr
     JOIN delivery_partners dp ON dp.id = wr.partner_id
     JOIN users u ON u.id = dp.user_id
     ${where}
     ORDER BY wr.requested_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, pageSize, offset]
  );

  const total = countRes.rows[0].total;
  return {
    withdrawals: rowsRes.rows,
    pagination: {
      page: pageNum,
      limit: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
};

const processWithdrawal = async (id, action, adminNote = '') => {
  if (!['approve', 'reject'].includes(action)) {
    throw Object.assign(new Error('Action must be approve or reject'), { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: reqRows } = await client.query(
      `SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const request = reqRows[0];
    if (!request) {
      throw Object.assign(new Error('Withdrawal request not found'), { status: 404 });
    }
    if (request.status !== 'pending') {
      throw Object.assign(new Error('Withdrawal request has already been processed'), { status: 409 });
    }

    if (action === 'approve') {
      await client.query(
        `UPDATE delivery_wallets
         SET pending_balance = pending_balance - $1, updated_at = CURRENT_TIMESTAMP
         WHERE partner_id = $2`,
        [request.amount, request.partner_id]
      );
      await client.query(
        `INSERT INTO delivery_transactions (partner_id, type, amount, description, status)
         VALUES ($1, 'debit', $2, 'Withdrawal approved', 'completed')`,
        [request.partner_id, request.amount]
      );
    } else {
      await client.query(
        `UPDATE delivery_wallets
         SET pending_balance = pending_balance - $1,
             available_balance = available_balance + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE partner_id = $2`,
        [request.amount, request.partner_id]
      );
    }

    const { rows } = await client.query(
      `UPDATE withdrawal_requests
       SET status = $1, admin_note = $2, processed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [action === 'approve' ? 'approved' : 'rejected', adminNote || null, id]
    );

    await client.query('COMMIT');

    try {
      const dn = require('./deliveryNotificationModel');
      const approved = action === 'approve';
      await dn.createNotification({
        partnerId: request.partner_id,
        type: approved ? 'withdrawal_approved' : 'withdrawal_rejected',
        title: approved ? 'Withdrawal Approved' : 'Withdrawal Rejected',
        message: approved
          ? `Your withdrawal request of ₹${request.amount} has been approved.`
          : `Your withdrawal request of ₹${request.amount} was rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
        actionUrl: '/delivery/wallet',
      });
    } catch (err) {
      console.warn('[deliveryWallet] withdrawal notification skipped:', err.message);
    }

    return rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  MIN_WITHDRAWAL,
  getOrCreateWallet,
  creditWallet,
  getWalletSummary,
  listTransactions,
  requestWithdrawal,
  listWithdrawals,
  processWithdrawal,
};
