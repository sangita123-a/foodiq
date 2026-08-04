const {
  validateHolderName,
  validateAccountNumber,
  validateBankName,
  validateIfsc,
  validateAccountType,
  validateUpi,
} = require('./deliveryBankAccountValidator');

const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const FSSAI_REGEX = /^\d{14}$/;
const DOCUMENT_TYPES = ['gst', 'fssai', 'pan'];

const validateDocumentNumber = (type, value) => {
  const number = String(value || '').trim().toUpperCase();
  if (!number) return null; // documents can be saved with a file only, number is optional
  if (type === 'gst' && !GST_REGEX.test(number)) return 'GST number format is invalid (e.g. 22AAAAA0000A1Z5)';
  if (type === 'pan' && !PAN_REGEX.test(number)) return 'PAN number format is invalid (e.g. AAAAA0000A)';
  if (type === 'fssai' && !FSSAI_REGEX.test(number)) return 'FSSAI license number must be 14 digits';
  return null;
};

/** Applies to PATCH /restaurants/:id/documents(/:docId) — only the upsert path, not the approve/reject review path. */
const validateRestaurantDocument = (req, res, next) => {
  const body = req.body || {};
  if (body.status) return next(); // review action, not a document upsert

  const type = String(body.document_type || '').toLowerCase();
  if (!DOCUMENT_TYPES.includes(type)) {
    return fail(res, 400, `document_type must be one of ${DOCUMENT_TYPES.join(', ')}`);
  }
  const err = validateDocumentNumber(type, body.document_number);
  if (err) return fail(res, 400, err);

  next();
};

/** Applies to PATCH /restaurants/:id/bank-account — only the create/replace path, not the approve/reject review path. */
const validateRestaurantBankAccount = (req, res, next) => {
  const body = req.body || {};
  if (body.status) return next(); // review action, not a bank-account upsert

  const errors = [
    validateHolderName(body.account_holder_name),
    validateAccountNumber(body.account_number),
    validateBankName(body.bank_name),
    validateIfsc(body.ifsc_code),
    validateAccountType(body.account_type),
    validateUpi(body.upi_id),
  ].filter(Boolean);

  if (errors.length) return fail(res, 400, errors[0], { details: errors });
  next();
};

module.exports = {
  GST_REGEX,
  PAN_REGEX,
  FSSAI_REGEX,
  validateDocumentNumber,
  validateRestaurantDocument,
  validateRestaurantBankAccount,
};
