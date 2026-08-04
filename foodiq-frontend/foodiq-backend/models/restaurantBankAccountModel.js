const { pool } = require('../config/db');
const { encryptField, decryptField } = require('../utils/fieldCrypto');

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

const getPrimaryForRestaurant = async (restaurantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM restaurant_bank_accounts WHERE restaurant_id = $1 AND is_primary = TRUE`,
    [restaurantId]
  );
  return rows[0] || null;
};

/**
 * A restaurant has exactly one primary bank account (enforced by a partial unique index).
 * Setting new details when one already exists replaces it in place, matching the single
 * "Bank Details" section in the admin drawer.
 */
const createOrReplacePrimary = async ({
  restaurantId,
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

  const existing = await getPrimaryForRestaurant(restaurantId);

  if (existing) {
    const { rows } = await pool.query(
      `UPDATE restaurant_bank_accounts SET
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
       WHERE id = $8 AND restaurant_id = $9
       RETURNING *`,
      [accountHolderName, encryptedNumber, last4, bankName, ifsc, type, encryptedUpi, existing.id, restaurantId]
    );
    return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO restaurant_bank_accounts (
       restaurant_id, account_holder_name, account_number_encrypted, account_number_last4,
       bank_name, ifsc_code, account_type, upi_id, is_primary, verification_status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, 'pending')
     RETURNING *`,
    [restaurantId, accountHolderName, encryptedNumber, last4, bankName, ifsc, type, encryptedUpi]
  );
  return rows[0];
};

/** Admin approve/reject the restaurant's primary bank account. */
const reviewBankAccount = async (id, { status, reason, verifiedBy }) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw Object.assign(new Error('status must be either approved or rejected'), { status: 400 });
  }
  if (status === 'rejected' && !reason) {
    throw Object.assign(new Error('reason is required when rejecting a bank account'), { status: 400 });
  }

  const { rows } = await pool.query(
    `UPDATE restaurant_bank_accounts
     SET verification_status = $1,
         rejection_reason = $2,
         verified_by = $3,
         verified_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4
     RETURNING *`,
    [status, status === 'rejected' ? reason || null : null, verifiedBy, id]
  );
  return rows[0] || null;
};

module.exports = {
  maskAccountNumber,
  mapAccount,
  getPrimaryForRestaurant,
  createOrReplacePrimary,
  reviewBankAccount,
};
