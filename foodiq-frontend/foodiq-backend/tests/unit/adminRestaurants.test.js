/**
 * Unit tests — admin restaurant management pure logic (Node built-in test runner).
 * Run: node --test tests/unit/adminRestaurants.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const admin = require('../../models/adminModel');
const adminController = require('../../controllers/adminController');
const restaurantDocumentModel = require('../../models/restaurantDocumentModel');
const restaurantBankAccountModel = require('../../models/restaurantBankAccountModel');

describe('adminModel restaurant exports', () => {
  it('exposes the expected restaurant management functions', () => {
    assert.equal(typeof admin.listRestaurants, 'function');
    assert.equal(typeof admin.getRestaurantStats, 'function');
    assert.equal(typeof admin.getRestaurantDetail, 'function');
    assert.equal(typeof admin.verifyRestaurant, 'function');
    assert.equal(typeof admin.getRestaurantVerificationTimeline, 'function');
    assert.equal(typeof admin.getRestaurantRevenueTrend, 'function');
    assert.equal(typeof admin.getRestaurantAnalytics, 'function');
    assert.equal(typeof admin.listRestaurantReviews, 'function');
    assert.equal(typeof admin.replyToReview, 'function');
    assert.equal(typeof admin.setReviewStatus, 'function');
    assert.equal(typeof admin.setReviewReported, 'function');
    assert.equal(typeof admin.bulkUpdateRestaurants, 'function');
    assert.equal(typeof admin.getRestaurantSettlements, 'function');
  });
});

describe('adminModel.RESTAURANT_SORT_MAP', () => {
  it('whitelists only known sort keys (no raw user input reaches SQL)', () => {
    const knownKeys = ['latest', 'oldest', 'revenue_high', 'rating_high', 'orders_high'];
    assert.deepEqual(Object.keys(admin.RESTAURANT_SORT_MAP).sort(), knownKeys.sort());
  });
  it('has no entry for arbitrary/malicious input, forcing a safe fallback', () => {
    assert.equal(admin.RESTAURANT_SORT_MAP['created_at; DROP TABLE restaurants;'], undefined);
  });
  it('every mapped value references a real, known-safe column expression', () => {
    Object.values(admin.RESTAURANT_SORT_MAP).forEach((expr) => {
      assert.match(expr, /^(r\.created_at|revenue|r\.rating|order_count)\s+(ASC|DESC)/);
    });
  });
});

describe('adminController.RESTAURANT_EXPORT_COLUMNS', () => {
  it('defines a curated, human-labeled column set (not a raw key dump)', () => {
    assert.ok(Array.isArray(adminController.RESTAURANT_EXPORT_COLUMNS));
    assert.ok(adminController.RESTAURANT_EXPORT_COLUMNS.length > 0);
    adminController.RESTAURANT_EXPORT_COLUMNS.forEach((col) => {
      assert.equal(typeof col.key, 'string');
      assert.equal(typeof col.label, 'string');
      assert.ok(col.label.length > 0);
    });
  });
  it('includes the core columns requested by the restaurant management spec', () => {
    const keys = adminController.RESTAURANT_EXPORT_COLUMNS.map((c) => c.key);
    ['id', 'name', 'owner_name', 'city', 'approval_status', 'rating', 'revenue_today'].forEach((k) => {
      assert.ok(keys.includes(k), `expected export columns to include "${k}"`);
    });
  });
});

describe('adminController verification action guard', () => {
  it('verifyRestaurantAction rejects an unknown action before touching the DB', async () => {
    const req = { params: { id: 'r1' }, body: { action: 'delete_everything' }, user: { id: 'u1', role: 'admin' } };
    let statusCode;
    let payload;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        payload = body;
        return this;
      },
    };
    await adminController.verifyRestaurantAction(req, res);
    assert.equal(statusCode, 400);
    assert.equal(payload.success, false);
  });

  it('verifyRestaurantAction requires a reason when rejecting', async () => {
    const req = { params: { id: 'r1' }, body: { action: 'reject' }, user: { id: 'u1', role: 'admin' } };
    let statusCode;
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json() {
        return this;
      },
    };
    await adminController.verifyRestaurantAction(req, res);
    assert.equal(statusCode, 400);
  });
});

describe('restaurantDocumentModel exports', () => {
  it('exposes GST/FSSAI/PAN document types and CRUD functions', () => {
    assert.deepEqual(restaurantDocumentModel.DOCUMENT_TYPES.sort(), ['fssai', 'gst', 'pan'].sort());
    assert.equal(typeof restaurantDocumentModel.upsertDocument, 'function');
    assert.equal(typeof restaurantDocumentModel.listDocumentsByRestaurant, 'function');
    assert.equal(typeof restaurantDocumentModel.reviewDocument, 'function');
  });
});

describe('restaurantBankAccountModel', () => {
  it('masks account numbers instead of exposing them raw', () => {
    assert.equal(restaurantBankAccountModel.maskAccountNumber('1234'), 'XXXXXX1234');
  });
  it('mapAccount strips the encrypted column from API responses', () => {
    const mapped = restaurantBankAccountModel.mapAccount({
      id: 'b1',
      restaurant_id: 'r1',
      account_number_encrypted: 'super-secret-cipher',
      account_number_last4: '5678',
      upi_id: null,
    });
    assert.equal('account_number_encrypted' in mapped, false);
    assert.equal(mapped.account_number_masked, 'XXXXXX5678');
  });
});
