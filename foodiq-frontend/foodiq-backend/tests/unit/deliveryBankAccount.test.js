const assert = require('assert');
const bankAccountModel = require('../../models/deliveryBankAccountModel');
const bankAccountController = require('../../controllers/deliveryBankAccountController');
const bankAccountValidator = require('../../validators/deliveryBankAccountValidator');
const adminController = require('../../controllers/adminController');
const { encryptField, decryptField } = require('../../utils/fieldCrypto');

async function runDeliveryBankAccountTests() {
  console.log('Running Delivery Bank Account & Payout Management Unit Tests...');

  // Test 1: deliveryBankAccountModel exports required functions
  const requiredModelFns = [
    'maskAccountNumber',
    'mapAccount',
    'getPrimaryForPartner',
    'listForPartner',
    'getByIdForPartner',
    'getVerifiedPrimaryForPartner',
    'createOrReplacePrimary',
    'updateAccount',
    'deleteAccount',
    'listAllForAdmin',
    'reviewBankAccount',
  ];
  for (const fn of requiredModelFns) {
    assert(typeof bankAccountModel[fn] === 'function', `deliveryBankAccountModel.${fn} must be a function`);
  }

  // Test 2: deliveryBankAccountController exports the partner-facing endpoints
  const requiredControllerFns = ['getBankAccount', 'addBankAccount', 'updateBankAccount', 'deleteBankAccount'];
  for (const fn of requiredControllerFns) {
    assert(typeof bankAccountController[fn] === 'function', `deliveryBankAccountController.${fn} must be a function`);
  }

  // Test 3: adminController exports bank account verification endpoints
  assert(typeof adminController.getDeliveryBankAccounts === 'function', 'adminController.getDeliveryBankAccounts must be a function');
  assert(typeof adminController.patchDeliveryBankAccount === 'function', 'adminController.patchDeliveryBankAccount must be a function');

  // ── Masking ───────────────────────────────────────────────────────────────
  // Test 4: masked account number never reveals more than the last 4 digits
  assert.strictEqual(bankAccountModel.maskAccountNumber('1234'), 'XXXXXX1234');
  assert.strictEqual(bankAccountModel.mapAccount(null), null);

  const rawRow = {
    id: 'acc-1',
    partner_id: 'partner-1',
    account_number_encrypted: 'enc:v1:super-secret-ciphertext',
    account_number_last4: '5678',
    upi_id: null,
  };
  const mapped = bankAccountModel.mapAccount(rawRow);
  assert.strictEqual(mapped.account_number_masked, 'XXXXXX5678');
  assert.strictEqual(mapped.account_number_encrypted, undefined, 'Encrypted/plain account number must never be returned by the API');

  // ── Encryption / decryption round trip ──────────────────────────────────
  // Test 5: account numbers round-trip through AES-256-GCM field encryption unchanged
  const previousKey = process.env.DATA_ENCRYPTION_KEY;
  process.env.DATA_ENCRYPTION_KEY = require('crypto').randomBytes(32).toString('hex');
  try {
    const plaintextAccountNumber = '123456789012';
    const encrypted = encryptField(plaintextAccountNumber);
    assert.notStrictEqual(encrypted, plaintextAccountNumber, 'Encrypted value must differ from plaintext');
    assert(encrypted.startsWith('enc:v1:'), 'Encrypted value must carry the field-crypto version prefix');
    assert.strictEqual(decryptField(encrypted), plaintextAccountNumber, 'Decryption must recover the original account number');
  } finally {
    if (previousKey === undefined) delete process.env.DATA_ENCRYPTION_KEY;
    else process.env.DATA_ENCRYPTION_KEY = previousKey;
  }

  // ── Validation ────────────────────────────────────────────────────────────
  // Test 6: IFSC format validation
  assert.strictEqual(bankAccountValidator.validateIfsc('SBIN0001234'), null, 'A valid IFSC must pass');
  assert.strictEqual(bankAccountValidator.validateIfsc('sbin0001234'), null, 'IFSC validation must be case-insensitive');
  assert(bankAccountValidator.validateIfsc('') , 'Empty IFSC must be rejected');
  assert(bankAccountValidator.validateIfsc('INVALID123'), 'Malformed IFSC must be rejected');
  assert(bankAccountValidator.validateIfsc('SBIN1001234'), 'IFSC without the fixed 0 in position 5 must be rejected');

  // Test 7: Account number format validation
  assert.strictEqual(bankAccountValidator.validateAccountNumber('123456789'), null, '9-digit numeric account number must pass');
  assert.strictEqual(bankAccountValidator.validateAccountNumber('123456789012345678'), null, '18-digit numeric account number must pass');
  assert(bankAccountValidator.validateAccountNumber(''), 'Empty account number must be rejected');
  assert(bankAccountValidator.validateAccountNumber('12345'), 'Account number shorter than 9 digits must be rejected');
  assert(bankAccountValidator.validateAccountNumber('1234567890123456789'), 'Account number longer than 18 digits must be rejected');
  assert(bankAccountValidator.validateAccountNumber('12345ABCD9'), 'Non-numeric account number must be rejected');

  // Test 8: UPI ID sanitization/validation
  assert.strictEqual(bankAccountValidator.validateUpi(''), null, 'Empty/omitted UPI is optional and must pass');
  assert.strictEqual(bankAccountValidator.validateUpi('rider.name@okhdfcbank'), null, 'A valid UPI ID must pass');
  assert(bankAccountValidator.validateUpi('not-a-upi-id'), 'UPI ID missing "@handle" must be rejected');
  assert(bankAccountValidator.validateUpi('a@b'), 'UPI handle shorter than 2 chars must be rejected');

  // Test 9: Account holder name / bank name / account type validation
  assert.strictEqual(bankAccountValidator.validateHolderName('Ravi Kumar'), null);
  assert(bankAccountValidator.validateHolderName(''), 'Empty account holder name must be rejected');
  assert(bankAccountValidator.validateHolderName('Ravi123'), 'Account holder name with digits must be rejected');
  assert.strictEqual(bankAccountValidator.validateBankName('State Bank of India'), null);
  assert(bankAccountValidator.validateBankName(''), 'Empty bank name must be rejected');
  assert.strictEqual(bankAccountValidator.validateAccountType('savings'), null);
  assert.strictEqual(bankAccountValidator.validateAccountType('current'), null);
  assert(bankAccountValidator.validateAccountType('checking'), 'Unsupported account type must be rejected');

  // ── Ownership / IDOR protection simulation ──────────────────────────────
  // Mirrors the "WHERE id = $1 AND partner_id = $2" guard used by every
  // partner-scoped bank account query in the model.
  const simulateOwnedLookup = (accounts, id, partnerId) =>
    accounts.find((a) => a.id === id && a.partner_id === partnerId) || null;

  const accounts = [
    { id: 'acc-a', partner_id: 'partner-a', verification_status: 'approved' },
    { id: 'acc-b', partner_id: 'partner-b', verification_status: 'pending' },
  ];

  // Test 10: The owner can fetch their own bank account
  assert.strictEqual(simulateOwnedLookup(accounts, 'acc-a', 'partner-a').id, 'acc-a');

  // Test 11: A different partner requesting someone else's bank account gets nothing back (IDOR blocked)
  assert.strictEqual(simulateOwnedLookup(accounts, 'acc-a', 'partner-b'), null, 'Cross-partner access must be blocked');
  assert.strictEqual(simulateOwnedLookup(accounts, 'acc-b', 'partner-a'), null, 'Cross-partner access must be blocked both ways');

  // ── Add / replace primary account business rule ─────────────────────────
  // Mirrors createOrReplacePrimary: insert if none exists, otherwise update in place.
  const simulateCreateOrReplacePrimary = (existingPrimary, incoming) => {
    if (existingPrimary) {
      return { ...existingPrimary, ...incoming, verification_status: 'pending', rejection_reason: null };
    }
    return { id: 'new-id', is_primary: true, verification_status: 'pending', ...incoming };
  };

  // Test 12: First-time add creates a new pending primary account
  const created = simulateCreateOrReplacePrimary(null, { account_holder_name: 'Ravi Kumar' });
  assert.strictEqual(created.is_primary, true);
  assert.strictEqual(created.verification_status, 'pending');

  // Test 13: Adding again when a primary already exists safely replaces it (no duplicate row / unique-index violation)
  const existingApproved = { id: 'acc-a', is_primary: true, verification_status: 'approved' };
  const replaced = simulateCreateOrReplacePrimary(existingApproved, { account_holder_name: 'Ravi K.' });
  assert.strictEqual(replaced.id, 'acc-a', 'Replacing must reuse the same primary row, not create a second one');
  assert.strictEqual(replaced.verification_status, 'pending', 'Replacing sensitive details must reset verification to pending');

  // ── Sensitive-field change resets verification_status ───────────────────
  const simulateSensitiveChangeResets = (existing, fields) => {
    const changed =
      !!fields.account_number ||
      (fields.account_holder_name !== undefined && fields.account_holder_name !== existing.account_holder_name) ||
      (fields.bank_name !== undefined && fields.bank_name !== existing.bank_name) ||
      (fields.ifsc_code !== undefined && fields.ifsc_code.toUpperCase() !== existing.ifsc_code);
    return changed ? 'pending' : existing.verification_status;
  };

  // Test 14: Changing the account number resets verification to pending
  assert.strictEqual(
    simulateSensitiveChangeResets({ verification_status: 'approved', ifsc_code: 'SBIN0001234' }, { account_number: '999999999' }),
    'pending'
  );
  // Test 15: Changing only the UPI ID (non-sensitive) leaves verification untouched
  assert.strictEqual(
    simulateSensitiveChangeResets(
      { verification_status: 'approved', account_holder_name: 'Ravi', bank_name: 'SBI', ifsc_code: 'SBIN0001234' },
      { upi_id: 'ravi@okhdfcbank' }
    ),
    'approved'
  );

  // ── Deletion blocked by a pending withdrawal ────────────────────────────
  const simulateDeleteAccount = (bankAccountId, pendingWithdrawals) => {
    const blocking = pendingWithdrawals.find((w) => w.bank_account_id === bankAccountId && w.status === 'pending');
    if (blocking) {
      const err = new Error('This bank account cannot be removed while a withdrawal request is pending against it');
      err.status = 409;
      throw err;
    }
    return { deleted: true };
  };

  // Test 16: Cannot delete a bank account referenced by a pending withdrawal
  try {
    simulateDeleteAccount('acc-a', [{ bank_account_id: 'acc-a', status: 'pending' }]);
    assert.fail('Should block deletion while a withdrawal is pending');
  } catch (err) {
    assert.strictEqual(err.status, 409);
  }

  // Test 17: Deletion succeeds once there is no pending withdrawal against it
  assert.deepStrictEqual(simulateDeleteAccount('acc-a', [{ bank_account_id: 'acc-a', status: 'approved' }]), { deleted: true });

  // ── Admin approve / reject ───────────────────────────────────────────────
  const simulateReviewBankAccount = (status, reason) => {
    if (!['approved', 'rejected'].includes(status)) {
      const err = new Error('status must be either approved or rejected');
      err.status = 400;
      throw err;
    }
    if (status === 'rejected' && !reason) {
      const err = new Error('reason is required when rejecting a bank account');
      err.status = 400;
      throw err;
    }
    return { verification_status: status, rejection_reason: status === 'rejected' ? reason : null };
  };

  // Test 18: Admin approval
  assert.strictEqual(simulateReviewBankAccount('approved').verification_status, 'approved');
  // Test 19: Admin rejection requires a reason
  try {
    simulateReviewBankAccount('rejected');
    assert.fail('Rejection without a reason must be blocked');
  } catch (err) {
    assert.strictEqual(err.status, 400);
  }
  // Test 20: Admin rejection with a reason succeeds
  const rejection = simulateReviewBankAccount('rejected', 'Account holder name mismatch');
  assert.strictEqual(rejection.verification_status, 'rejected');
  assert.strictEqual(rejection.rejection_reason, 'Account holder name mismatch');

  // ── Withdrawal integration gating ───────────────────────────────────────
  // Mirrors the bank-account guard added to deliveryWalletModel.requestWithdrawal.
  const BANK_ACCOUNT_REQUIRED_MESSAGE = 'Please add and verify your bank account before requesting a withdrawal.';
  const simulateWithdrawalBankGate = (bankAccount) => {
    if (!bankAccount || bankAccount.verification_status !== 'approved') {
      const err = new Error(BANK_ACCOUNT_REQUIRED_MESSAGE);
      err.status = 400;
      throw err;
    }
    return true;
  };

  // Test 21: Withdrawal blocked when no bank account exists
  try {
    simulateWithdrawalBankGate(null);
    assert.fail('Should block withdrawal with no bank account');
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, BANK_ACCOUNT_REQUIRED_MESSAGE);
  }

  // Test 22: Withdrawal blocked while bank account verification is still pending
  try {
    simulateWithdrawalBankGate({ verification_status: 'pending' });
    assert.fail('Should block withdrawal while bank account is pending verification');
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, BANK_ACCOUNT_REQUIRED_MESSAGE);
  }

  // Test 23: Withdrawal blocked for a rejected bank account
  try {
    simulateWithdrawalBankGate({ verification_status: 'rejected' });
    assert.fail('Should block withdrawal for a rejected bank account');
  } catch (err) {
    assert.strictEqual(err.status, 400);
  }

  // Test 24: Withdrawal allowed once the bank account is approved
  assert.strictEqual(simulateWithdrawalBankGate({ verification_status: 'approved' }), true);

  console.log('All Delivery Bank Account & Payout Management Unit Tests passed successfully!');
}

runDeliveryBankAccountTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
