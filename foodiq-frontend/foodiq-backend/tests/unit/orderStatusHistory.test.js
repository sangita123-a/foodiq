/**
 * Unit tests — order status history timeline merge (Node built-in test runner).
 * Run: node --test tests/unit/orderStatusHistory.test.js
 */
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildTimeline,
  describeStatus,
  recordStatusChange,
  listRawForOrder,
  listForOrder,
} = require('../../models/orderStatusHistoryModel');

describe('orderStatusHistoryModel.describeStatus', () => {
  it('maps known lowercase statuses to human labels', () => {
    assert.equal(describeStatus('picked up'), 'Picked Up');
    assert.equal(describeStatus('on the way'), 'Out for Delivery');
    assert.equal(describeStatus('PENDING'), 'Order Placed');
  });
  it('falls back to the raw value for unknown statuses', () => {
    assert.equal(describeStatus('Some Custom Status'), 'Some Custom Status');
  });
  it('handles empty input', () => {
    assert.equal(describeStatus(null), 'Unknown');
    assert.equal(describeStatus(''), 'Unknown');
  });
});

describe('orderStatusHistoryModel.buildTimeline', () => {
  it('always starts with a synthesized Order Placed event from created_at', () => {
    const events = buildTimeline({ created_at: '2026-01-01T00:00:00Z', status: 'Pending' }, []);
    assert.equal(events.length, 1);
    assert.equal(events[0].label, 'Order Placed');
    assert.equal(events[0].created_at, '2026-01-01T00:00:00Z');
  });

  it('appends real history rows in order with labels and actor attribution', () => {
    const rows = [
      { to_status: 'Accepted', from_status: 'Pending', source: 'system', changed_by_name: null, reason: null, created_at: 't1' },
      { to_status: 'Preparing', from_status: 'Accepted', source: 'admin', changed_by_name: 'Jane Admin', reason: 'kitchen ready', created_at: 't2' },
    ];
    const events = buildTimeline({ created_at: 't0', status: 'Preparing' }, rows);
    assert.equal(events.length, 3);
    assert.equal(events[1].label, 'Restaurant Accepted');
    assert.equal(events[2].label, 'Preparing');
    assert.equal(events[2].source, 'admin');
    assert.equal(events[2].changed_by_name, 'Jane Admin');
    assert.equal(events[2].reason, 'kitchen ready');
  });

  it('synthesizes an undated current-status event for legacy orders with no history rows', () => {
    const events = buildTimeline({ created_at: 't0', status: 'Delivered' }, []);
    assert.equal(events.length, 2);
    assert.equal(events[1].label, 'Delivered');
    assert.equal(events[1].created_at, null);
    assert.equal(events[1].derived, true);
  });

  it('does not synthesize a duplicate event when status is still pending', () => {
    const events = buildTimeline({ created_at: 't0', status: 'pending' }, []);
    assert.equal(events.length, 1);
  });

  it('does not synthesize a duplicate event when real history rows already exist', () => {
    const rows = [{ to_status: 'Cancelled', from_status: 'Pending', source: 'system', created_at: 't1' }];
    const events = buildTimeline({ created_at: 't0', status: 'Cancelled' }, rows);
    assert.equal(events.length, 2);
    assert.equal(events.some((e) => e.derived), false);
  });

  it('tolerates a missing order object', () => {
    const events = buildTimeline(undefined, []);
    assert.equal(events.length, 1);
    assert.equal(events[0].created_at, null);
  });
});

describe('orderStatusHistoryModel exports', () => {
  it('exposes the expected model functions', () => {
    assert.equal(typeof recordStatusChange, 'function');
    assert.equal(typeof listRawForOrder, 'function');
    assert.equal(typeof listForOrder, 'function');
  });
});
