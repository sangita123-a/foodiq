const { pool } = require('../config/db');
const { encryptField, decryptField } = require('../utils/fieldCrypto');

/** Sensitive fields that reset verification back to 'pending' when changed. */
const SENSITIVE_FIELDS = ['account_holder_name', 'account_number', 'bank_name', 'ifsc_code'];

const maskAccountNumber = (last4) => `XXXXXX${String(last4 || '').padStart(4, 'X')}`;

/** Strips encrypted/plain account number and decrypts UPI — safe to return over the API. */
const mapAccount = (row) => {
  if (!row) return row;
  const {
    account_number_encrypted, // eslint-disable-line no-unused-vars
    ...safe
  } = row;
  return {
    ...safe,
    account_number_masked: maskAccountNumber(row.account_number_last4),
    upi_id: decryptField(row.upi_id),
  };
};

const getPrimaryForPartner = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_partner_bank_accounts WHERE partner_id = $1 AND is_primary = TRUE`,
    [partnerId]
  );
  return rows[0] || null;
};

const listForPartner = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_partner_bank_accounts WHERE partner_id = $1 ORDER BY is_primary DESC, created_at DESC`,
    [partnerId]
  );
  return rows;
};

const getByIdForPartner = async (id, partnerId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_partner_bank_accounts WHERE id = $1 AND partner_id = $2`,
    [id, partnerId]
  );
  return rows[0] || null;
};

/** Only an approved bank account may be used for withdrawals. */
const getVerifiedPrimaryForPartner = async (partnerId) => {
  const { rows } = await pool.query(
    `SELECT * FROM delivery_partner_bank_accounts
     WHERE partner_id = $1 AND is_primary = TRUE AND verification_status = 'approved'`,
    [partnerId]
  );
  return rows[0] || null;
};

/**
 * A partner has exactly one primary bank account (enforced by a partial unique index).
 * Adding a new account when one already exists safely replaces it in place — this both
 * matches the single "Bank Account" section in the delivery UI and avoids violating the
 * uq_delivery_partner_bank_accounts_primary index.
 */
const createOrReplacePrimary = async ({
  partnerId,
  accountHolderName,
  accountNumber,
  bankName,
  ifscCode,
  accountType,
  upiId,
}) => {
  const last4 = String(accountNumber).slice(-4);
  const encryptedNumber = encryptField(accountNumber);
  const ifsc = String(ifscCode).trim().toUpperCase();
  const type = String(accountType || 'savings').toLowerCase();
  const encryptedUpi = upiId ? encryptField(String(upiId).trim()) : null;

  const existing = await getPrimaryForPartner(partnerId);

  if (existing) {
    const { rows } = await pool.query(
      `UPDATE delivery_partner_bank_accounts SET
         account_holder_name = $1,
         account_number_encrypted = $2,
         account_number_last4 = $3,
         bank_name = $4,
         ifsc_code = $5,
         account_type = $6,
         upi_id = $7,
         verification_status = 'pending',
         rejection_reason = NULL,
         verified_by = NULL,
         verified_at = NULL,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND partner_id = $9
       RETURNING *`,
      [accountHolderName, encryptedNumber, last4, bankName, ifsc, type, encryptedUpi, existing.id, partnerId]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO delivery_partner_bank_accounts (
       partner_id, account_holder_name, account_number_encrypted, account_number_last4,
       bank_name, ifsc_code, account_type, upi_id, is_primary, verification_status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, 'pending')
     RETURNING *`,
    [partnerId, accountHolderName, encryptedNumber, last4, bankName, ifsc, type, encryptedUpi]
  );
  return rows[0];
};

const updateAccount = async (id, partnerId, fields = {}) => {
  const existing = await getByIdForPartner(id, partnerId);
  if (!existing) return null;

  const next = {
    account_holder_name: fields.account_holder_name != null
      ? String(fields.account_holder_name).trim()
      : existing.account_holder_name,
    bank_name: fields.bank_name != null ? String(fields.bank_name).trim() : existing.bank_name,
    ifsc_code: fields.ifsc_code ? String(fields.ifsc_code).trim().toUpperCase() : existing.ifsc_code,
    account_type: fields.account_type ? String(fields.account_type).toLowerCase() : existing.account_type,
  };

  let account_number_encrypted = existing.account_number_encrypted;
  let account_number_last4 = existing.account_number_last4;
  if (fields.account_number) {
    const digits = String(fields.account_number).trim();
    account_number_encrypted = encryptField(digits);
    account_number_last4 = digits.slice(-4);
  }

  let upi_id = existing.upi_id;
  if (fields.upi_id !== undefined) {
    upi_id = fields.upi_id ? encryptField(String(fields.upi_id).trim()) : null;
  }

  const changedSensitive =
    !!fields.account_number ||
    next.account_holder_name !== existing.account_holder_name ||
    next.bank_name !== existing.bank_name ||
    next.ifsc_code !== existing.ifsc_code;

  const { rows } = await pool.query(
    `UPDATE delivery_partner_bank_accounts SET
       account_holder_name = $1,
       account_number_encrypted = $2,
       account_number_last4 = $3,
       bank_name = $4,
       ifsc_code = $5,
       account_type = $6,
       upi_id = $7,
       verification_status = CASE WHEN $8 THEN 'pending' ELSE verification_status END,
       rejection_reason = CASE WHEN $8 THEN NULL ELSE rejection_reason END,
       verified_by = CASE WHEN $8 THEN NULL ELSE verified_by END,
       verified_at = CASE WHEN $8 THEN NULL ELSE verified_at END,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $9 AND partner_id = $10
     RETURNING *`,
    [
      next.account_holder_name,
      account_number_encrypted,
      account_number_last4,
      next.bank_name,
      next.ifsc_code,
      next.account_type,
      upi_id,
      changedSensitive,
      id,
      partnerId,
    ]
  );
  return rows[0] || null;
};

/** Blocks deletion when a pending withdrawal references this bank account. */
const deleteAccount = async (id, partnerId) => {
  const existing = await getByIdForPartner(id, partnerId);
  if (!existing) return null;

  const { rows: pending } = await pool.query(
    `SELECT id FROM withdrawal_requests WHERE bank_account_id = $1 AND status = 'pending'`,
    [id]
  );
  if (pending[0]) {
    throw Object.assign(
      new Error('This bank account cannot be removed while a withdrawal request is pending against it'),
      { status: 409 }
    );
  }

  await pool.query(`DELETE FROM delivery_partner_bank_accounts WHERE id = $1 AND partner_id = $2`, [
    id,
    partnerId,
  ]);
  return existing;
};

/** Admin review queue — joined with partner identity for search/filter/display. */
const listAllForAdmin = async ({ status = '', search = '', page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`b.verification_status = $${values.length}`);
  }
  if (search) {
    values.push(`%${search.toLowerCase()}%`);
    const idx = values.length;
    conditions.push(
      `(LOWER(p.full_name) LIKE $${idx} OR LOWER(p.email) LIKE $${idx} OR p.phone_number LIKE $${idx} OR LOWER(b.bank_name) LIKE $${idx})`
    );
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await pool.query(
    `SELECT COUNT(*) FROM delivery_partner_bank_accounts b
     JOIN delivery_partners p ON p.id = b.partner_id
     ${whereClause}`,
    values
  );
  const total = Number(countRes.rows[0].count);

  const dataValues = [...values, limitNum, offset];
  const { rows } = await pool.query(
    `SELECT b.*, p.full_name AS partner_name, p.email AS partner_email, p.phone_number AS partner_phone
     FROM delivery_partner_bank_accounts b
     JOIN delivery_partners p ON p.id = b.partner_id
     ${whereClause}
     ORDER BY
       CASE b.verification_status WHEN 'pending' THEN 0 ELSE 1 END,
       b.created_at DESC
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  return {
    accounts: rows.map(mapAccount),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.max(1, Math.ceil(total / limitNum)),
    },
  };
};

/** Admin approve/reject a bank account. */
const reviewBankAccount = async (id, { status, reason, verifiedBy }) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw Object.assign(new Error('status must be either approved or rejected'), { status: 400 });
  }
  if (status === 'rejected' && !reason) {
    throw Object.assign(new Error('reason is required when rejecting a bank account'), { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE delivery_partner_bank_accounts
     SET verification_status = $1,
         rejection_reason = $2,
         verified_by = $3,
         verified_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, status === 'rejected' ? reason || null : null, verifiedBy, id]
  );

  const account = rows[0] || null;
  if (account) {
    try {
      const dn = require('./deliveryNotificationModel');
      const approved = status === 'approved';
      await dn.createNotification({
        partnerId: account.partner_id,
        type: approved ? 'bank_account_approved' : 'bank_account_rejected',
        title: approved ? 'Bank Account Approved' : 'Bank Account Rejected',
        message: approved
          ? `Your bank account ending in ${account.account_number_last4} has been approved for payouts.`
          : `Your bank account submission was rejected.${reason ? ` Reason: ${reason}` : ''}`,
        actionUrl: '/delivery/bank-account',
      });
    } catch (err) {
      console.warn('[deliveryBankAccount] verification notification skipped:', err.message);
    }
  }

  return account;
};

module.exports = {
  maskAccountNumber,
  mapAccount,
  getPrimaryForPartner,
  listForPartner,
  getByIdForPartner,
  getVerifiedPrimaryForPartner,
  createOrReplacePrimary,
  updateAccount,
  deleteAccount,
  listAllForAdmin,
  reviewBankAccount,
};
