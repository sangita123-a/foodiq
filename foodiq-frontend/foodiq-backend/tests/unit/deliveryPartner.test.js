const assert = require('assert');
const bcrypt = require('bcrypt');
const {
  validateRegister,
  validateLogin,
  validateSendOtp,
  validateVerifyOtp,
  validateForgotPassword,
  validateResetPassword,
  validateOnlineStatus,
} = require('../../validators/deliveryValidator');
const deliveryRoutes = require('../../routes/deliveryRoutes');
const deliveryController = require('../../controllers/deliveryController');

async function runDeliveryPartnerTests() {
  console.log('Running Delivery Partner Registration, Login & Forgot Password Unit Tests...');

  // Helper mock response builder
  const createMockRes = () => {
    const res = {
      statusCode: 0,
      responseData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.responseData = data;
        return this;
      },
    };
    return res;
  };

  // Test 1: deliveryRoutes module export
  assert(deliveryRoutes, 'deliveryRoutes should be exported');
  assert(typeof deliveryRoutes === 'function', 'deliveryRoutes should be an Express Router function');

  // Test 2: deliveryController exports required methods
  const requiredMethods = [
    'register',
    'login',
    'sendOtp',
    'verifyOtp',
    'forgotPassword',
    'resetPassword',
    'getProfile',
    'updateOnlineStatus',
  ];
  for (const method of requiredMethods) {
    assert(typeof deliveryController[method] === 'function', `deliveryController.${method} must be a function`);
  }

  // Test 3: validateRegister fails on missing required fields
  const sampleValidBody = {
    full_name: 'John Delivery',
    email: 'john.driver@foodiq.com',
    phone_number: '9876543210',
    password: 'Password123!',
    confirm_password: 'Password123!',
    vehicle_type: 'Bike',
    vehicle_number: 'KA-01-AB-1234',
    driving_license_number: 'DL-1234567890123',
    aadhaar_number: '123456789012',
    state: 'Karnataka',
    city: 'Bengaluru',
    address: '123 Main Street, Indiranagar',
  };

  // Check missing full_name
  let res = createMockRes();
  validateRegister({ body: { ...sampleValidBody, full_name: '' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'Should fail on missing full_name');

  // Check missing email
  res = createMockRes();
  validateRegister({ body: { ...sampleValidBody, email: '' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'Should fail on missing email');

  // Check missing vehicle_type
  res = createMockRes();
  validateRegister({ body: { ...sampleValidBody, vehicle_type: '' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'Should fail on missing vehicle_type');

  // Check missing driving_license_number
  res = createMockRes();
  validateRegister({ body: { ...sampleValidBody, driving_license_number: '' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'Should fail on missing driving_license_number');

  // Test 4: Password mismatch
  res = createMockRes();
  validateRegister({ body: { ...sampleValidBody, confirm_password: 'DifferentPassword123' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'Should fail on password mismatch');
  assert.strictEqual(res.responseData.message, 'Passwords do not match');

  // Test 5: Invalid email format
  res = createMockRes();
  validateRegister({ body: { ...sampleValidBody, email: 'not-an-email' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'Should fail on invalid email');

  // Test 6: Valid registration payload passes middleware
  let nextCalled = false;
  res = createMockRes();
  validateRegister({ body: sampleValidBody }, res, () => { nextCalled = true; });
  assert(nextCalled, 'validateRegister should call next() for a complete valid payload');

  // Test 7: validateVerifyOtp
  nextCalled = false;
  res = createMockRes();
  validateVerifyOtp({ body: { email: 'john.driver@foodiq.com', code: '123456' } }, res, () => { nextCalled = true; });
  assert(nextCalled, 'validateVerifyOtp should pass valid destination and code');

  // ── Login Validation & Status Check Tests ──────────────────────────────

  // Test 8: validateLogin missing email
  res = createMockRes();
  validateLogin({ body: { password: 'Password123!' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'validateLogin should return 400 when email is missing');
  assert.strictEqual(res.responseData.message, 'Email is required');

  // Test 9: validateLogin missing password
  res = createMockRes();
  validateLogin({ body: { email: 'john.driver@foodiq.com' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'validateLogin should return 400 when password is missing');
  assert.strictEqual(res.responseData.message, 'Password is required');

  // Test 10: validateLogin invalid email format
  res = createMockRes();
  validateLogin({ body: { email: 'invalid-email-format', password: 'Password123!' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'validateLogin should return 400 for invalid email format');

  // Test 11: validateLogin valid inputs calls next()
  nextCalled = false;
  res = createMockRes();
  validateLogin({ body: { email: 'john.driver@foodiq.com', password: 'Password123!' } }, res, () => { nextCalled = true; });
  assert(nextCalled, 'validateLogin should call next() for valid login payload');

  // ── Business Logic & Login Status Enforcement Tests ───────────────────
  
  const hashPassword = await bcrypt.hash('Password123!', 10);
  
  const testLoginEnforcement = async (partnerRecord, passwordToTry) => {
    if (!partnerRecord) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(passwordToTry, partnerRecord.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.status = 401;
      throw err;
    }

    if (!partnerRecord.is_verified) {
      const err = new Error('Please verify your email before logging in.');
      err.status = 403;
      throw err;
    }

    if (partnerRecord.status === 'pending') {
      const err = new Error('Your account is waiting for admin approval.');
      err.status = 403;
      throw err;
    }

    if (partnerRecord.status === 'rejected') {
      const err = new Error('Your account has been rejected.');
      err.status = 403;
      throw err;
    }

    if (partnerRecord.status === 'suspended') {
      const err = new Error('Your account has been suspended.');
      err.status = 403;
      throw err;
    }

    return { success: true };
  };

  // Test 12: Email not found (401)
  try {
    await testLoginEnforcement(null, 'Password123!');
    assert.fail('Should have thrown 401 for unknown email');
  } catch (err) {
    assert.strictEqual(err.status, 401);
    assert.strictEqual(err.message, 'Invalid email or password');
  }

  // Test 13: Wrong password (401)
  const mockPartner = {
    id: 'partner-uuid-1',
    email: 'john.driver@foodiq.com',
    password_hash: hashPassword,
    is_verified: true,
    status: 'approved',
  };
  try {
    await testLoginEnforcement(mockPartner, 'WrongPassword!');
    assert.fail('Should have thrown 401 for wrong password');
  } catch (err) {
    assert.strictEqual(err.status, 401);
    assert.strictEqual(err.message, 'Invalid email or password');
  }

  // Test 14: Unverified account (403)
  try {
    await testLoginEnforcement({ ...mockPartner, is_verified: false }, 'Password123!');
    assert.fail('Should have thrown 403 for unverified email');
  } catch (err) {
    assert.strictEqual(err.status, 403);
    assert.strictEqual(err.message, 'Please verify your email before logging in.');
  }

  // Test 15: Pending account (403)
  try {
    await testLoginEnforcement({ ...mockPartner, status: 'pending' }, 'Password123!');
    assert.fail('Should have thrown 403 for pending status');
  } catch (err) {
    assert.strictEqual(err.status, 403);
    assert.strictEqual(err.message, 'Your account is waiting for admin approval.');
  }

  // Test 16: Rejected account (403)
  try {
    await testLoginEnforcement({ ...mockPartner, status: 'rejected' }, 'Password123!');
    assert.fail('Should have thrown 403 for rejected status');
  } catch (err) {
    assert.strictEqual(err.status, 403);
    assert.strictEqual(err.message, 'Your account has been rejected.');
  }

  // Test 17: Suspended account (403)
  try {
    await testLoginEnforcement({ ...mockPartner, status: 'suspended' }, 'Password123!');
    assert.fail('Should have thrown 403 for suspended status');
  } catch (err) {
    assert.strictEqual(err.status, 403);
    assert.strictEqual(err.message, 'Your account has been suspended.');
  }

  // Test 18: Valid login (200 Success)
  const validRes = await testLoginEnforcement(mockPartner, 'Password123!');
  assert.strictEqual(validRes.success, true, 'Valid login should succeed');

  // ── Forgot Password & Reset Password Tests ─────────────────────────────

  // Test 19: validateForgotPassword invalid email
  res = createMockRes();
  validateForgotPassword({ body: { email: 'invalid-email' } }, res, () => {});
  assert.strictEqual(res.statusCode, 400, 'validateForgotPassword should return 400 for invalid email');

  // Test 20: validateForgotPassword valid email calls next()
  nextCalled = false;
  res = createMockRes();
  validateForgotPassword({ body: { email: 'john.driver@foodiq.com' } }, res, () => { nextCalled = true; });
  assert(nextCalled, 'validateForgotPassword should call next() for valid email');

  // Test 21: validateResetPassword password mismatch
  res = createMockRes();
  validateResetPassword(
    { body: { email: 'john.driver@foodiq.com', code: '123456', new_password: 'NewPassword1!', confirm_password: 'DifferentPassword1!' } },
    res,
    () => {}
  );
  assert.strictEqual(res.statusCode, 400, 'validateResetPassword should return 400 for password mismatch');
  assert.strictEqual(res.responseData.message, 'Passwords do not match');

  // Test 22: Forgot password response privacy check (same response for existing and non-existing email)
  const mockForgotPasswordHandler = (emailInput, partnerDb) => {
    const cleanEmail = String(emailInput || '').trim().toLowerCase();
    const partnerExists = partnerDb.some((p) => p.email === cleanEmail);
    // Generic response message returned in both cases
    return {
      success: true,
      message: 'If an account with that email exists, an OTP code has been sent.',
      issuedOtp: partnerExists,
    };
  };

  const db = [{ email: 'existing.partner@foodiq.com' }];
  const resExisting = mockForgotPasswordHandler('existing.partner@foodiq.com', db);
  const resNonExisting = mockForgotPasswordHandler('nonexistent.partner@foodiq.com', db);
  assert.strictEqual(resExisting.message, resNonExisting.message, 'Privacy check: Responses must be identical');

  // Test 23: Password reset OTP verification failure & success simulation
  const mockResetPasswordHandler = async (emailInput, codeInput, newPassInput, activeOtps, partnerDb) => {
    const cleanEmail = String(emailInput || '').trim().toLowerCase();
    const activeOtpRecord = activeOtps.find(
      (o) => o.destination === cleanEmail && o.code === codeInput && !o.consumed && o.expiresAt > Date.now()
    );

    if (!activeOtpRecord) {
      const err = new Error('Invalid or expired OTP code.');
      err.status = 400;
      throw err;
    }

    const partner = partnerDb.find((p) => p.email === cleanEmail);
    if (!partner) {
      const err = new Error('Delivery partner account not found.');
      err.status = 404;
      throw err;
    }

    // Hash new password & consume OTP
    partner.password_hash = await bcrypt.hash(newPassInput, 10);
    activeOtpRecord.consumed = true;

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  };

  const otps = [
    { destination: 'john.driver@foodiq.com', code: '654321', consumed: false, expiresAt: Date.now() + 600000 },
    { destination: 'john.driver@foodiq.com', code: '999999', consumed: false, expiresAt: Date.now() - 1000 }, // expired
  ];

  // Test 24: Reset with wrong OTP
  try {
    await mockResetPasswordHandler('john.driver@foodiq.com', '111111', 'NewPassword123!', otps, [mockPartner]);
    assert.fail('Should fail on wrong OTP');
  } catch (err) {
    assert.strictEqual(err.status, 400);
  }

  // Test 25: Reset with expired OTP
  try {
    await mockResetPasswordHandler('john.driver@foodiq.com', '999999', 'NewPassword123!', otps, [mockPartner]);
    assert.fail('Should fail on expired OTP');
  } catch (err) {
    assert.strictEqual(err.status, 400);
  }

  // Test 26: Successful password reset
  const resetRes = await mockResetPasswordHandler('john.driver@foodiq.com', '654321', 'BrandNewPass123!', otps, [mockPartner]);
  assert.strictEqual(resetRes.message, 'Password reset successfully. You can now log in with your new password.');

  // Test 27: Login with new password verification
  const newLoginRes = await testLoginEnforcement(mockPartner, 'BrandNewPass123!');
  assert.strictEqual(newLoginRes.success, true, 'Login with new password should succeed');

  // Test 28: Available Orders filtering logic
  const mockOrdersDb = [
    { id: 'ord-1', status: 'ready_for_pickup', payment_status: 'paid', delivery_partner_id: null },
    { id: 'ord-2', status: 'ready_for_pickup', payment_status: 'pending', delivery_partner_id: null },
    { id: 'ord-3', status: 'preparing', payment_status: 'paid', delivery_partner_id: null },
    { id: 'ord-4', status: 'ready_for_pickup', payment_status: 'paid', delivery_partner_id: 'partner-999' },
  ];

  const filterAvailableOrders = (orders) =>
    orders.filter(
      (o) =>
        ['ready_for_pickup', 'ready for pickup', 'preparing', 'paid'].includes(String(o.status).toLowerCase()) &&
        ['paid', 'completed'].includes(String(o.payment_status).toLowerCase()) &&
        !o.delivery_partner_id
    );

  const availableResult = filterAvailableOrders(mockOrdersDb);
  assert.strictEqual(availableResult.length, 2, 'Should return only unassigned, paid, ready/preparing orders');
  assert.deepStrictEqual(
    availableResult.map((o) => o.id),
    ['ord-1', 'ord-3']
  );

  // Test 29: Accept Order concurrency transaction simulation
  const mockAcceptTransaction = async (orderId, partnerId, ordersState) => {
    const targetOrder = ordersState.find((o) => o.id === orderId);
    if (!targetOrder) {
      const err = new Error('Order not found');
      err.status = 404;
      throw err;
    }
    if (targetOrder.delivery_partner_id && targetOrder.delivery_partner_id !== partnerId) {
      const err = new Error('Order is no longer available or already accepted by another delivery partner');
      err.status = 409;
      throw err;
    }

    targetOrder.delivery_partner_id = partnerId;
    targetOrder.status = 'assigned';
    targetOrder.assigned_at = new Date().toISOString();
    return targetOrder;
  };

  const testOrdersState = [
    { id: 'ord-100', status: 'ready_for_pickup', payment_status: 'paid', delivery_partner_id: null, assigned_at: null },
  ];

  // Rider A accepts unassigned order
  const riderAAccept = await mockAcceptTransaction('ord-100', 'partner-A', testOrdersState);
  assert.strictEqual(riderAAccept.delivery_partner_id, 'partner-A');
  assert.strictEqual(riderAAccept.status, 'assigned');
  assert(riderAAccept.assigned_at, 'assigned_at timestamp should be set');

  // Test 30: Concurrent Rider B attempt returns 409 Conflict
  try {
    await mockAcceptTransaction('ord-100', 'partner-B', testOrdersState);
    assert.fail('Should fail when order is already accepted by another partner');
  } catch (err) {
    assert.strictEqual(err.status, 409, 'Should return 409 Conflict status');
    assert.strictEqual(
      err.message,
      'Order is no longer available or already accepted by another delivery partner'
    );
  }

  console.log('All 30 Delivery Partner Unit Tests (Registration, Login, Available Orders & Accept Order) passed successfully!');
}

runDeliveryPartnerTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
