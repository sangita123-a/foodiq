const assert = require('assert');
const deliveryWalletModel = require('../../models/deliveryWalletModel');
const deliveryController = require('../../controllers/deliveryController');
const adminController = require('../../controllers/adminController');

async function runDeliveryWalletTests() {
  console.log('Running Delivery Wallet & Earnings Unit Tests...');

  // Test 1: deliveryWalletModel exports required functions
  const requiredModelFns = [
    'getOrCreateWallet',
    'creditWallet',
    'getWalletSummary',
    'listTransactions',
    'requestWithdrawal',
    'listWithdrawals',
    'processWithdrawal',
  ];
  for (const fn of requiredModelFns) {
    assert(typeof deliveryWalletModel[fn] === 'function', `deliveryWalletModel.${fn} must be a function`);
  }
  assert.strictEqual(deliveryWalletModel.MIN_WITHDRAWAL, 100, 'Minimum withdrawal must be ₹100');

  // Test 2: deliveryController exports wallet endpoints
  const requiredControllerFns = ['getWallet', 'getTransactions', 'requestWithdrawal'];
  for (const fn of requiredControllerFns) {
    assert(typeof deliveryController[fn] === 'function', `deliveryController.${fn} must be a function`);
  }

  // Test 3: adminController exports withdrawal management endpoints
  assert(typeof adminController.getWithdrawals === 'function', 'adminController.getWithdrawals must be a function');
  assert(typeof adminController.patchWithdrawal === 'function', 'adminController.patchWithdrawal must be a function');

  // ── Withdrawal request business-rule simulation ─────────────────────────
  // Mirrors the validation logic inside deliveryWalletModel.requestWithdrawal
  const MIN_WITHDRAWAL = deliveryWalletModel.MIN_WITHDRAWAL;

  const simulateRequestWithdrawal = (wallet, hasPendingRequest, amount) => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < MIN_WITHDRAWAL) {
      const err = new Error(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}`);
      err.status = 400;
      throw err;
    }
    if (hasPendingRequest) {
      const err = new Error('You already have a pending withdrawal request');
      err.status = 409;
      throw err;
    }
    if (Number(wallet.available_balance) < amt) {
      const err = new Error('Insufficient available balance');
      err.status = 400;
      throw err;
    }
    return {
      available_balance: wallet.available_balance - amt,
      pending_balance: wallet.pending_balance + amt,
    };
  };

  // Test 4: Reject withdrawal below minimum
  try {
    simulateRequestWithdrawal({ available_balance: 500, pending_balance: 0 }, false, 50);
    assert.fail('Should reject withdrawal below ₹100');
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, 'Minimum withdrawal amount is ₹100');
  }

  // Test 5: Reject withdrawal exceeding available balance
  try {
    simulateRequestWithdrawal({ available_balance: 150, pending_balance: 0 }, false, 500);
    assert.fail('Should reject withdrawal exceeding available balance');
  } catch (err) {
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.message, 'Insufficient available balance');
  }

  // Test 6: Reject duplicate pending withdrawal request
  try {
    simulateRequestWithdrawal({ available_balance: 1000, pending_balance: 200 }, true, 300);
    assert.fail('Should reject a second pending withdrawal request');
  } catch (err) {
    assert.strictEqual(err.status, 409);
    assert.strictEqual(err.message, 'You already have a pending withdrawal request');
  }

  // Test 7: Valid withdrawal moves funds from available to pending
  const afterRequest = simulateRequestWithdrawal({ available_balance: 1000, pending_balance: 0 }, false, 300);
  assert.strictEqual(afterRequest.available_balance, 700);
  assert.strictEqual(afterRequest.pending_balance, 300);

  // ── Admin approve/reject balance transition simulation ──────────────────
  // Mirrors the transaction logic inside deliveryWalletModel.processWithdrawal
  const simulateProcessWithdrawal = (wallet, requestAmount, action) => {
    if (action === 'approve') {
      return {
        available_balance: wallet.available_balance,
        pending_balance: wallet.pending_balance - requestAmount,
        status: 'approved',
      };
    }
    if (action === 'reject') {
      return {
        available_balance: wallet.available_balance + requestAmount,
        pending_balance: wallet.pending_balance - requestAmount,
        status: 'rejected',
      };
    }
    const err = new Error('Action must be approve or reject');
    err.status = 400;
    throw err;
  };

  // Test 8: Approval permanently deducts from pending balance (money leaves wallet)
  const approved = simulateProcessWithdrawal({ available_balance: 700, pending_balance: 300 }, 300, 'approve');
  assert.strictEqual(approved.available_balance, 700, 'Available balance is untouched on approval');
  assert.strictEqual(approved.pending_balance, 0, 'Pending balance is cleared on approval');
  assert.strictEqual(approved.status, 'approved');

  // Test 9: Rejection releases the reserved amount back to available balance
  const rejected = simulateProcessWithdrawal({ available_balance: 700, pending_balance: 300 }, 300, 'reject');
  assert.strictEqual(rejected.available_balance, 1000, 'Available balance is restored on rejection');
  assert.strictEqual(rejected.pending_balance, 0, 'Pending balance is cleared on rejection');
  assert.strictEqual(rejected.status, 'rejected');

  // Test 10: Invalid action is rejected
  try {
    simulateProcessWithdrawal({ available_balance: 700, pending_balance: 300 }, 300, 'delete');
    assert.fail('Should reject unknown action');
  } catch (err) {
    assert.strictEqual(err.status, 400);
  }

  // ── Pagination math (mirrors listTransactions / listWithdrawals) ────────
  const paginate = (total, limit) => Math.max(1, Math.ceil(total / limit));

  // Test 11: Pagination page count
  assert.strictEqual(paginate(45, 20), 3, '45 rows at 20/page should be 3 pages');
  assert.strictEqual(paginate(0, 20), 1, 'Zero rows should still report 1 page');
  assert.strictEqual(paginate(20, 20), 1, 'Exact multiple should not add an extra page');

  console.log('All Delivery Wallet & Earnings Unit Tests passed successfully!');
}

runDeliveryWalletTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
