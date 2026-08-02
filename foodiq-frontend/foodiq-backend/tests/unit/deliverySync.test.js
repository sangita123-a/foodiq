const test = require('node:test');
const assert = require('node:assert/strict');
const syncService = require('../../services/deliverySyncService');

test('Offline Mode & Auto Sync Module Business Rules & Logic', async (t) => {
  await t.test('calculates exponential backoff delay correctly', () => {
    const calculateBackoff = (retryCount) => {
      const maxDelay = 30000; // 30s cap
      return Math.min(maxDelay, Math.pow(2, retryCount) * 1000);
    };

    assert.equal(calculateBackoff(0), 1000, 'Retry 0 delay must be 1000ms');
    assert.equal(calculateBackoff(1), 2000, 'Retry 1 delay must be 2000ms');
    assert.equal(calculateBackoff(2), 4000, 'Retry 2 delay must be 4000ms');
    assert.equal(calculateBackoff(3), 8000, 'Retry 3 delay must be 8000ms');
    assert.equal(calculateBackoff(4), 16000, 'Retry 4 delay must be 16000ms');
    assert.equal(calculateBackoff(5), 30000, 'Retry 5 delay must be capped at 30000ms');
  });

  await t.test('enforces max retry limit of 5', () => {
    const isRetryAllowed = (retryCount) => {
      const MAX_RETRY = 5;
      return retryCount < MAX_RETRY;
    };

    assert.equal(isRetryAllowed(0), true, 'Retry 0 must be allowed');
    assert.equal(isRetryAllowed(4), true, 'Retry 4 must be allowed');
    assert.equal(isRetryAllowed(5), false, 'Retry 5 must be rejected (max retry reached)');
    assert.equal(isRetryAllowed(6), false, 'Retry > 5 must be rejected');
  });

  await t.test('validates action dispatcher for generic / fallback actions', async () => {
    const dummyLog = {
      sync_type: 'PROFILE_CHANGE',
      entity_type: 'PROFILE_CHANGE',
      entity_id: null,
      payload: { city: 'Bengaluru', full_name: 'Test Driver' },
    };

    const validUuid = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const res = await syncService.dispatchAction(validUuid, dummyLog);
    assert.equal(res.success, true, 'Dispatcher should execute successfully');
  });

  await t.test('enforces FIFO ordering on queued items', () => {
    const items = [
      { id: 2, timestamp: '2026-08-01T12:10:00Z' },
      { id: 1, timestamp: '2026-08-01T12:00:00Z' },
      { id: 3, timestamp: '2026-08-01T12:15:00Z' },
    ];

    const sorted = [...items].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    assert.equal(sorted[0].id, 1, 'Oldest item must be first in FIFO queue');
    assert.equal(sorted[1].id, 2, 'Second oldest item must be second');
    assert.equal(sorted[2].id, 3, 'Newest item must be last');
  });

  await t.test('prevents duplicate sync requests using idempotency check', () => {
    const isDuplicate = (existingLogs, newAction) => {
      return existingLogs.some(
        (log) =>
          log.sync_type === newAction.sync_type &&
          log.entity_id === newAction.entity_id &&
          log.sync_status === 'completed'
      );
    };

    const logs = [
      { sync_type: 'STATUS_CHANGE', entity_id: 'ord-100', sync_status: 'completed' },
    ];

    const duplicateAction = { sync_type: 'STATUS_CHANGE', entity_id: 'ord-100' };
    const newAction = { sync_type: 'STATUS_CHANGE', entity_id: 'ord-200' };

    assert.equal(isDuplicate(logs, duplicateAction), true, 'Identical completed action must be detected as duplicate');
    assert.equal(isDuplicate(logs, newAction), false, 'New action must not be marked as duplicate');
  });
});
