const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/;
const ACCOUNT_TYPES = ['savings', 'current'];

const validateHolderName = (value) => {
  const name = String(value || '').trim();
  if (!name) return 'Account holder name is required';
  if (name.length > 150) return 'Account holder name must be under 150 characters';
  if (!/^[A-Za-z\s.'-]+$/.test(name)) return 'Account holder name contains invalid characters';
  return null;
};

const validateAccountNumber = (value) => {
  const digits = String(value || '').trim();
  if (!digits) return 'Account number is required';
  if (!ACCOUNT_NUMBER_REGEX.test(digits)) {
    return 'Account number must be 9-18 digits';
  }
  return null;
};

const validateBankName = (value) => {
  const name = String(value || '').trim();
  if (!name) return 'Bank name is required';
  if (name.length > 150) return 'Bank name must be under 150 characters';
  return null;
};

const validateIfsc = (value) => {
  const ifsc = String(value || '').trim().toUpperCase();
  if (!ifsc) return 'IFSC code is required';
  if (!IFSC_REGEX.test(ifsc)) {
    return 'IFSC code format is invalid (e.g. SBIN0001234)';
  }
  return null;
};

const validateAccountType = (value) => {
  if (value == null || value === '') return null;
  if (!ACCOUNT_TYPES.includes(String(value).toLowerCase())) {
    return 'Account type must be savings or current';
  }
  return null;
};

const validateUpi = (value) => {
  if (value == null || value === '') return null;
  const upi = String(value).trim();
  if (upi.length > 150) return 'UPI ID must be under 150 characters';
  if (!UPI_REGEX.test(upi)) return 'UPI ID format is invalid (e.g. name@bank)';
  return null;
};

const validateAddBankAccount = (req, res, next) => {
  const body = req.body || {};
  const account_number = String(body.account_number || '').trim();
  const confirm_account_number = body.confirm_account_number ?? body.confirmAccountNumber;

  const errors = [
    validateHolderName(body.account_holder_name),
    validateAccountNumber(account_number),
    validateBankName(body.bank_name),
    validateIfsc(body.ifsc_code),
    validateAccountType(body.account_type),
    validateUpi(body.upi_id),
  ].filter(Boolean);

  if (errors.length) return fail(res, 400, errors[0], { details: errors });

  if (confirm_account_number != null && String(confirm_account_number).trim() !== account_number) {
    return fail(res, 400, 'Account number and confirmation do not match');
  }

  next();
};

const validateUpdateBankAccount = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (body.account_holder_name != null) {
    const err = validateHolderName(body.account_holder_name);
    if (err) errors.push(err);
  }
  if (body.account_number != null && String(body.account_number).trim() !== '') {
    const account_number = String(body.account_number).trim();
    const err = validateAccountNumber(account_number);
    if (err) errors.push(err);
    const confirm_account_number = body.confirm_account_number ?? body.confirmAccountNumber;
    if (!err && confirm_account_number != null && String(confirm_account_number).trim() !== account_number) {
      errors.push('Account number and confirmation do not match');
    }
  }
  if (body.bank_name != null) {
    const err = validateBankName(body.bank_name);
    if (err) errors.push(err);
  }
  if (body.ifsc_code != null) {
    const err = validateIfsc(body.ifsc_code);
    if (err) errors.push(err);
  }
  if (body.account_type != null) {
    const err = validateAccountType(body.account_type);
    if (err) errors.push(err);
  }
  if (body.upi_id != null) {
    const err = validateUpi(body.upi_id);
    if (err) errors.push(err);
  }

  if (errors.length) return fail(res, 400, errors[0], { details: errors });
  next();
};

module.exports = {
  IFSC_REGEX,
  ACCOUNT_NUMBER_REGEX,
  UPI_REGEX,
  ACCOUNT_TYPES,
  validateHolderName,
  validateAccountNumber,
  validateBankName,
  validateIfsc,
  validateAccountType,
  validateUpi,
  validateAddBankAccount,
  validateUpdateBankAccount,
};
