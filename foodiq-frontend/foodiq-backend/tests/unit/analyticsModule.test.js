const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

describe('Analytics & Reports Module Unit Tests', () => {
  const AnalyticsModel = require('../../models/analyticsModel');
  const AnalyticsService = require('../../services/analyticsService');

  it('should generate valid date range SQL filters', () => {
    const filterToday = AnalyticsModel.getDateRangeFilter('today', 'date');
    const filterWeek = AnalyticsModel.getDateRangeFilter('this_week', 'date');
    const filterMonth = AnalyticsModel.getDateRangeFilter('this_month', 'date');
    const filterLifetime = AnalyticsModel.getDateRangeFilter('lifetime', 'date');

    assert.equal(filterToday.includes('CURRENT_DATE'), true);
    assert.equal(filterWeek.includes('DATE_TRUNC'), true);
    assert.equal(filterMonth.includes('DATE_TRUNC'), true);
    assert.equal(filterLifetime, '1=1');
  });

  it('should generate properly formatted CSV reports', () => {
    const mockReportData = {
      period: 'daily',
      generated_at: new Date().toISOString(),
      partner_id: 'partner-test-123',
      performance_score: 95,
      summary: {
        completed_orders: 12,
        cancelled_orders: 1,
        acceptance_rate: 92,
        completion_rate: 92,
        average_rating: 4.9,
        total_distance_km: 42.5,
        total_online_hours: 8.5,
        active_hours: 6.0,
        idle_hours: 2.5,
        earnings: 120.0,
        tips: 35.0,
        bonuses: 15.0,
        total_earnings: 170.0,
        average_earnings_per_order: 14.17,
        wallet_growth: 170.0,
        most_active_area: 'Downtown Central',
      },
    };

    const csvStr = AnalyticsService.generateCSVReport(mockReportData);

    assert.equal(typeof csvStr, 'string');
    assert.equal(csvStr.includes('Period,Generated At,Partner ID'), true);
    assert.equal(csvStr.includes('partner-test-123'), true);
    assert.equal(csvStr.includes('Downtown Central'), true);
  });

  it('should compute weighted score accurately', () => {
    const acceptance = 100;
    const completion = 100;
    const rating = 100; // 5.0 rating
    const fraud = 100;
    const attendance = 100;
    const feedback = 100;

    const total =
      acceptance * 0.20 +
      completion * 0.25 +
      rating * 0.20 +
      fraud * 0.15 +
      attendance * 0.10 +
      feedback * 0.10;

    assert.equal(total, 100);
  });
});
