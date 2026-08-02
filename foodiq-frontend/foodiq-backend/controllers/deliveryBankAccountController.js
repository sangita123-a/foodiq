const model = require('../models/deliveryBankAccountModel');
const { log } = require('../utils/logger');

const ok = (res, message, data = {}) => res.status(200).json({ success: true, message, data });
const created = (res, message, data = {}) => res.status(201).json({ success: true, message, data });
const fail = (res, status, message, error = {}) => res.status(status).json({ success: false, message, error });

const partnerId = (req) => req.deliveryPartner?.id || req.user?.id;

/** GET /api/delivery/bank-account — the authenticated partner's primary bank account. */
const getBankAccount = async (req, res) => {
  try {
    const account = await model.getPrimaryForPartner(partnerId(req));
    ok(res, 'Bank account retrieved', account ? model.mapAccount(account) : null);
  } catch (error) {
    log.error('[deliveryBankAccountController] getBankAccount error', { error: error.message });
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

/** POST /api/delivery/bank-account — add (or safely replace the existing primary) bank account. */
const addBankAccount = async (req, res) => {
  try {
    const body = req.body || {};
    const account = await model.createOrReplacePrimary({
      partnerId: partnerId(req),
      accountHolderName: String(body.account_holder_name).trim(),
      accountNumber: String(body.account_number).trim(),
      bankName: String(body.bank_name).trim(),
      ifscCode: body.ifsc_code,
      accountType: body.account_type,
      upiId: body.upi_id,
    });
    created(res, 'Bank account saved. It will be reviewed before you can withdraw.', model.mapAccount(account));
  } catch (error) {
    log.error('[deliveryBankAccountController] addBankAccount error', { error: error.message });
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

/** PATCH /api/delivery/bank-account/:id — update; ownership enforced by the model query. */
const updateBankAccount = async (req, res) => {
  try {
    const account = await model.updateAccount(req.params.id, partnerId(req), req.body || {});
    if (!account) return fail(res, 404, 'Bank account not found');
    ok(res, 'Bank account updated', model.mapAccount(account));
  } catch (error) {
    log.error('[deliveryBankAccountController] updateBankAccount error', { error: error.message });
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

/** DELETE /api/delivery/bank-account/:id — blocked while a pending withdrawal references it. */
const deleteBankAccount = async (req, res) => {
  try {
    const removed = await model.deleteAccount(req.params.id, partnerId(req));
    if (!removed) return fail(res, 404, 'Bank account not found');
    ok(res, 'Bank account removed', {});
  } catch (error) {
    log.error('[deliveryBankAccountController] deleteBankAccount error', { error: error.message });
    fail(res, error.status || 500, error.message || 'Server Error');
  }
};

module.exports = { getBankAccount, addBankAccount, updateBankAccount, deleteBankAccount };
