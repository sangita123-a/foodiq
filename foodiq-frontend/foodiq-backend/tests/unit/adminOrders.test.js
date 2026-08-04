/**
 * Unit tests — admin order management pure logic (Node built-in test runner).
 * Run: node --test tests/unit/adminOrders.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const admin = require('../../models/adminModel');
const adminController = require('../../controllers/adminController');

describe('adminModel order exports', () => {
  it('exposes the expected order management functions', () => {
    assert.equal(typeof admin.listOrders, 'function');
    assert.equal(typeof admin.getOrderStats, 'function');
    assert.equal(typeof admin.getOrderDetails, 'function');
    assert.equal(typeof admin.updateOrderAdmin, 'function');
    assert.equal(typeof admin.bulkUpdateOrderStatus, 'function');
    assert.equal(typeof admin.bulkAssignDeliveryPartner, 'function');
  });
});

describe('adminModel.ORDER_SORT_MAP', () => {
  it('whitelists only known sort keys (no raw user input reaches SQL)', () => {
    const knownKeys = ['latest', 'oldest', 'amount_high', 'amount_low', 'delivery_time'];
    assert.deepEqual(Object.keys(admin.ORDER_SORT_MAP).sort(), knownKeys.sort());
  });
  it('has no entry for arbitrary/malicious input, forcing a safe fallback', () => {
    assert.equal(admin.ORDER_SORT_MAP['created_at; DROP TABLE orders;'], undefined);
  });
  it('every mapped value references a real, known-safe column expression', () => {
    Object.values(admin.ORDER_SORT_MAP).forEach((expr) => {
      assert.match(expr, /^(o\.created_at|o\.total_amount|ot\.estimated_delivery_time)\s+(ASC|DESC)/);
    });
  });
});

describe('adminController.ORDER_EXPORT_COLUMNS', () => {
  it('defines a curated, human-labeled column set (not a raw key dump)', () => {
    assert.ok(Array.isArray(adminController.ORDER_EXPORT_COLUMNS));
    assert.ok(adminController.ORDER_EXPORT_COLUMNS.length > 0);
    adminController.ORDER_EXPORT_COLUMNS.forEach((col) => {
      assert.equal(typeof col.key, 'string');
      assert.equal(typeof col.label, 'string');
      assert.ok(col.label.length > 0);
    });
  });
  it('includes the core columns requested by the order management spec', () => {
    const keys = adminController.ORDER_EXPORT_COLUMNS.map((c) => c.key);
    ['id', 'customer_name', 'restaurant_name', 'total_amount', 'status', 'payment_status'].forEach((k) => {
      assert.ok(keys.includes(k), `expected export columns to include "${k}"`);
    });
  });
});
