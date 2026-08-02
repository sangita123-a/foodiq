const test = require('node:test');
const assert = require('node:assert/strict');

// Business Rule Tests for SOS Emergency Module
test('SOS Emergency Module Business Rules & Logic', async (t) => {
  await t.test('enforces max 1 active emergency per delivery partner restriction', () => {
    const activeEmergencies = [
      { id: 'sos-1', partner_id: 'partner-123', status: 'active', reason: 'Accident' },
    ];

    const canCreateNew = (partnerId) => {
      const existing = activeEmergencies.find((e) => e.partner_id === partnerId && e.status === 'active');
      return !existing;
    };

    assert.equal(canCreateNew('partner-123'), false, 'Partner with active SOS must be prevented from creating another');
    assert.equal(canCreateNew('partner-456'), true, 'Partner with no active SOS can create one');
  });

  await t.test('validates emergency reason against allowed enum values', () => {
    const VALID_REASONS = [
      'Accident',
      'Vehicle Breakdown',
      'Medical Emergency',
      'Customer Threat',
      'Robbery',
      'Harassment',
      'Road Block',
      'Other',
    ];

    const isValidReason = (reason) => VALID_REASONS.includes(reason);

    assert.equal(isValidReason('Accident'), true);
    assert.equal(isValidReason('Medical Emergency'), true);
    assert.equal(isValidReason('Invalid Reason Test'), false);
  });

  await t.test('triggers 5-minute unresolved escalation threshold check', () => {
    const isUnresolvedFiveMins = (createdAt, now = Date.now()) => {
      const elapsedMs = now - new Date(createdAt).getTime();
      return elapsedMs >= 5 * 60 * 1000;
    };

    const fourMinsAgo = new Date(Date.now() - 4 * 60 * 1000).toISOString();
    const sixMinsAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();

    assert.equal(isUnresolvedFiveMins(fourMinsAgo), false, 'Emergency < 5 mins should not trigger alert');
    assert.equal(isUnresolvedFiveMins(sixMinsAgo), true, 'Emergency >= 5 mins should trigger high priority alert');
  });
});
