const assert = require('assert');
const dn = require('../../models/deliveryNotificationModel');
const dnController = require('../../controllers/deliveryNotificationController');
const dnRoutes = require('../../routes/deliveryNotificationRoutes');
const adminController = require('../../controllers/adminController');
const socketEvents = require('../../socket/events');
const emitters = require('../../socket/emitters');

async function runDeliveryNotificationTests() {
  console.log('Running Delivery Notification System Unit Tests...');

  // ── Model exports ────────────────────────────────────────────────────────
  const requiredModelFns = [
    'createNotification',
    'listForPartner',
    'getUnreadCount',
    'markRead',
    'markAllRead',
    'deleteNotification',
    'getCategory',
  ];
  for (const fn of requiredModelFns) {
    assert(typeof dn[fn] === 'function', `deliveryNotificationModel.${fn} must be a function`);
  }

  // Test: all spec'd notification types are present.
  const EXPECTED_TYPES = [
    'new_order',
    'order_assigned',
    'order_cancelled',
    'order_updated',
    'delivery_completed',
    'wallet_credit',
    'withdrawal_approved',
    'withdrawal_rejected',
    'kyc_approved',
    'kyc_rejected',
    'admin_message',
    'support_ticket_reply',
    'support_ticket_resolved',
    'referral_registered',
    'reward_credited',
    'referral_expired',
    'first_delivery_completed',
  ];
  assert.strictEqual(dn.NOTIFICATION_TYPES.length, EXPECTED_TYPES.length, 'Must expose exactly the spec notification types');
  for (const type of EXPECTED_TYPES) {
    assert(dn.NOTIFICATION_TYPES.includes(type), `NOTIFICATION_TYPES must include ${type}`);
  }

  // Test: every type maps to one of the five filter-tab categories.
  for (const type of dn.NOTIFICATION_TYPES) {
    const category = dn.getCategory(type);
    assert(dn.CATEGORIES.includes(category), `${type} must map to a known category (got ${category})`);
  }
  assert.deepStrictEqual(dn.CATEGORIES.slice().sort(), ['KYC', 'Orders', 'Support', 'System', 'Wallet'].sort());

  // Test: createNotification rejects invalid type / missing fields (no DB call needed — fails fast).
  await assert.rejects(
    () => dn.createNotification({ partnerId: 'p1', type: 'not_a_real_type', title: 'x', message: 'y' }),
    /Invalid notification type/
  );
  await assert.rejects(
    () => dn.createNotification({ partnerId: 'p1', type: 'admin_message', title: '', message: '' }),
    /required/
  );
  // No partnerId short-circuits without touching the DB.
  assert.strictEqual(await dn.createNotification({ type: 'admin_message', title: 'x', message: 'y' }), null);

  // ── Controller exports ───────────────────────────────────────────────────
  const requiredControllerFns = ['getNotifications', 'markOneRead', 'markAllReadHandler', 'deleteOne', 'adminSend', 'adminList'];
  for (const fn of requiredControllerFns) {
    assert(typeof dnController[fn] === 'function', `deliveryNotificationController.${fn} must be a function`);
  }

  // ── Admin controller wiring ──────────────────────────────────────────────
  assert(typeof adminController.sendDeliveryNotification === 'function', 'adminController.sendDeliveryNotification must be a function');
  assert(typeof adminController.getDeliveryNotifications === 'function', 'adminController.getDeliveryNotifications must be a function');

  // ── Routes ────────────────────────────────────────────────────────────────
  assert(typeof dnRoutes === 'function', 'deliveryNotificationRoutes must export an Express router');
  assert(Array.isArray(dnRoutes.stack) && dnRoutes.stack.length > 0, 'router must have registered routes');

  // Per spec, /:id/read and /read-all must be PATCH (not POST).
  const routeMethods = dnRoutes.stack
    .filter((layer) => layer.route)
    .map((layer) => ({ path: layer.route.path, methods: layer.route.methods }));
  const readAll = routeMethods.find((r) => r.path === '/read-all');
  const readOne = routeMethods.find((r) => r.path === '/:id/read');
  assert(readAll && readAll.methods.patch, 'PATCH /read-all must be registered');
  assert(readOne && readOne.methods.patch, 'PATCH /:id/read must be registered');
  assert(!readAll.methods.post, '/read-all should no longer be a POST route');
  assert(!readOne.methods.post, '/:id/read should no longer be a POST route');

  // ── Socket events ─────────────────────────────────────────────────────────
  assert.strictEqual(socketEvents.DELIVERY_NOTIFICATION, 'delivery:notification');
  assert.strictEqual(socketEvents.DELIVERY_NOTIFICATION_READ, 'delivery:notification-read');
  assert.strictEqual(socketEvents.DELIVERY_NOTIFICATION_ALL_READ, 'delivery:notification-all-read');

  // ── Socket emitters ───────────────────────────────────────────────────────
  for (const fn of ['emitDeliveryNotification', 'emitDeliveryNotificationRead', 'emitDeliveryNotificationAllRead']) {
    assert(typeof emitters[fn] === 'function', `emitters.${fn} must be a function`);
  }
  // Emitters must no-op safely (never throw) when Socket.IO has not been initialized.
  assert.doesNotThrow(() => emitters.emitDeliveryNotification('partner-1', { id: 'n1', title: 'x' }));
  assert.doesNotThrow(() => emitters.emitDeliveryNotificationRead('partner-1', 'n1'));
  assert.doesNotThrow(() => emitters.emitDeliveryNotificationAllRead('partner-1'));
  // Missing partnerId must also no-op safely.
  assert.doesNotThrow(() => emitters.emitDeliveryNotification(null, { id: 'n1' }));

  // ── Pagination math (mirrors listForPartner) ─────────────────────────────
  const paginate = (total, limit) => Math.max(1, Math.ceil(total / limit));
  assert.strictEqual(paginate(45, 20), 3);
  assert.strictEqual(paginate(0, 20), 1);
  assert.strictEqual(paginate(20, 20), 1);

  // ── Category filter simulation (mirrors listForPartner's type-set lookup) ─
  const typesForCategory = (category) =>
    dn.NOTIFICATION_TYPES.filter((t) => dn.CATEGORY_BY_TYPE[t] === category);
  assert.deepStrictEqual(typesForCategory('Wallet').sort(), ['wallet_credit', 'withdrawal_approved', 'withdrawal_rejected', 'referral_registered', 'reward_credited'].sort());
  assert.deepStrictEqual(typesForCategory('KYC').sort(), ['kyc_approved', 'kyc_rejected'].sort());
  assert.deepStrictEqual(typesForCategory('System').sort(), ['admin_message', 'referral_expired'].sort());
  assert.deepStrictEqual(typesForCategory('Support').sort(), ['support_ticket_reply', 'support_ticket_resolved'].sort());
  assert.strictEqual(
    typesForCategory('Orders').length,
    dn.NOTIFICATION_TYPES.length -
      typesForCategory('Wallet').length -
      typesForCategory('KYC').length -
      typesForCategory('System').length -
      typesForCategory('Support').length
  );

  // ── action_url plumbing ───────────────────────────────────────────────────
  await assert.rejects(
    () => dn.createNotification({ partnerId: 'p1', type: 'not_a_real_type', title: 'x', message: 'y', actionUrl: '/delivery/wallet' }),
    /Invalid notification type/
  );

  console.log('All Delivery Notification System Unit Tests passed successfully!');
}

runDeliveryNotificationTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
