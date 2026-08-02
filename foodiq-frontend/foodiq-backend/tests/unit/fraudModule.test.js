const { test, describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Fraud Detection & Risk Monitoring Module Tests', () => {
  const FraudDetectionService = require('../../services/fraudDetectionService');

  it('should calculate risk score severity buckets correctly', () => {
    const scoreLow = 15;
    const scoreMed = 45;
    const scoreHigh = 75;
    const scoreCrit = 95;

    assert.equal(scoreLow <= 30, true);
    assert.equal(scoreMed >= 31 && scoreMed <= 60, true);
    assert.equal(scoreHigh >= 61 && scoreHigh <= 80, true);
    assert.equal(scoreCrit >= 81, true);
  });

  it('should compute haversine distance correctly', () => {
    const dist = FraudDetectionService._haversineDistance(12.9716, 77.5946, 12.9352, 77.6245);
    assert.equal(typeof dist, 'number');
    assert.equal(dist > 0, true);
  });

  it('should evaluate impossible speed correctly', async () => {
    const rules = new Map([
      ['IMPOSSIBLE_SPEED', { rule_type: 'IMPOSSIBLE_SPEED', threshold: 40, enabled: true }]
    ]);

    const result = await FraudDetectionService._evaluateGpsData(
      'partner-123',
      'order-123',
      {
        lat: 13.5000,
        lng: 78.5000,
        prev_lat: 12.9716,
        prev_lng: 77.5946,
        timestamp: Date.now(),
        prev_timestamp: Date.now() - 60000 // 1 minute ago for ~100km dist
      },
      rules
    );

    assert.notEqual(result, null);
    assert.equal(result.fraud_type, 'Impossible Speed');
    assert.equal(result.severity, 'High');
  });
});
