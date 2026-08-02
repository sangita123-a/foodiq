const PDFDocument = require('pdfkit');
const AnalyticsModel = require('../models/analyticsModel');
const { getIO } = require('../socket');
const {
  DELIVERY_ANALYTICS_UPDATE,
  DELIVERY_PERFORMANCE_UPDATE,
  ADMIN_ANALYTICS_UPDATE,
} = require('../socket/events');

class AnalyticsService {
  /**
   * Get analytics summary for delivery partner across ranges (today, yesterday, this_week, etc.)
   */
  static async getPartnerAnalytics(partnerId, range = 'this_month') {
    return await AnalyticsModel.getPartnerAnalyticsSummary(partnerId, range);
  }

  /**
   * Get Performance Score & breakdown for delivery partner
   */
  static async getPartnerPerformance(partnerId) {
    return await AnalyticsModel.calculatePerformanceScore(partnerId);
  }

  /**
   * Get Performance Audit History logs for delivery partner
   */
  static async getPartnerHistory(partnerId, limit = 50, offset = 0) {
    return await AnalyticsModel.getPerformanceHistory(partnerId, limit, offset);
  }

  /**
   * Generate report data for specified period (daily, weekly, monthly)
   */
  static async generateReportData(partnerId, period = 'daily') {
    let range = 'today';
    if (period === 'weekly') range = 'this_week';
    if (period === 'monthly') range = 'this_month';

    const summary = await AnalyticsModel.getPartnerAnalyticsSummary(partnerId, range);
    const score = await AnalyticsModel.calculatePerformanceScore(partnerId);

    return {
      period,
      generated_at: new Date().toISOString(),
      partner_id: partnerId,
      performance_score: score.score,
      summary,
    };
  }

  /**
   * Export Report as CSV string
   */
  static generateCSVReport(reportData) {
    const { period, generated_at, partner_id, performance_score, summary } = reportData;

    const headers = [
      'Period',
      'Generated At',
      'Partner ID',
      'Performance Score',
      'Completed Orders',
      'Cancelled Orders',
      'Acceptance Rate (%)',
      'Completion Rate (%)',
      'Average Rating',
      'Total Distance (km)',
      'Online Hours',
      'Active Hours',
      'Idle Hours',
      'Earnings ($)',
      'Tips ($)',
      'Bonuses ($)',
      'Total Earnings ($)',
      'Avg Earnings / Order ($)',
      'Wallet Growth ($)',
      'Most Active Area',
    ];

    const values = [
      period,
      generated_at,
      partner_id,
      performance_score,
      summary.completed_orders,
      summary.cancelled_orders,
      summary.acceptance_rate,
      summary.completion_rate,
      summary.average_rating,
      summary.total_distance_km,
      summary.total_online_hours,
      summary.active_hours,
      summary.idle_hours,
      summary.earnings,
      summary.tips,
      summary.bonuses,
      summary.total_earnings,
      summary.average_earnings_per_order,
      summary.wallet_growth,
      `"${summary.most_active_area.replace(/"/g, '""')}"`,
    ];

    return `${headers.join(',')}\n${values.join(',')}\n`;
  }

  /**
   * Export Report as PDF buffer using pdfkit
   */
  static generatePDFReport(reportData, res) {
    const { period, generated_at, partner_id, performance_score, summary } = reportData;
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=delivery_report_${period}_${Date.now()}.pdf`);

    doc.pipe(res);

    // Title & Header
    doc.fillColor('#FF6B00').fontSize(22).text('FOODIQ DELIVERY ANALYTICS REPORT', { align: 'center' });
    doc.moveDown(0.5);
    doc.fillColor('#333333').fontSize(12).text(`Report Type: ${period.toUpperCase()} REPORT`, { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date(generated_at).toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // Section 1: Summary Overview
    doc.fillColor('#111827').fontSize(14).text('Performance Overview', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Partner ID: ${partner_id}`);
    doc.text(`Overall Performance Score: ${performance_score} / 100`);
    doc.text(`Average Customer Rating: ${summary.average_rating} / 5.0`);
    doc.text(`Acceptance Rate: ${summary.acceptance_rate}%`);
    doc.text(`Completion Rate: ${summary.completion_rate}%`);
    doc.moveDown(1);

    // Section 2: Order & Activity Metrics
    doc.fillColor('#111827').fontSize(14).text('Delivery & Time Metrics', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Completed Deliveries: ${summary.completed_orders}`);
    doc.text(`Cancelled Deliveries: ${summary.cancelled_orders}`);
    doc.text(`Average Delivery Time: ${summary.average_delivery_time_mins} minutes`);
    doc.text(`Total Distance Covered: ${summary.total_distance_km} km`);
    doc.text(`Total Online Hours: ${summary.total_online_hours} hrs`);
    doc.text(`Active Delivery Hours: ${summary.active_hours} hrs`);
    doc.text(`Idle Hours: ${summary.idle_hours} hrs`);
    doc.text(`Most Active Zone / Area: ${summary.most_active_area}`);
    doc.moveDown(1);

    // Section 3: Financial & Wallet Earnings
    doc.fillColor('#111827').fontSize(14).text('Financial Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#374151');
    doc.text(`Base Delivery Earnings: $${summary.earnings.toFixed(2)}`);
    doc.text(`Tips Earned: $${summary.tips.toFixed(2)}`);
    doc.text(`Incentives & Bonuses: $${summary.bonuses.toFixed(2)}`);
    doc.fillColor('#16A34A').fontSize(12).text(`Total Net Earnings: $${summary.total_earnings.toFixed(2)}`);
    doc.fillColor('#374151').fontSize(11).text(`Average Earnings Per Order: $${summary.average_earnings_per_order.toFixed(2)}`);
    doc.text(`Wallet Growth: $${summary.wallet_growth.toFixed(2)}`);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#9CA3AF').text('Generated automatically by Foodiq Analytics & Intelligence Platform.', { align: 'center' });

    doc.end();
  }

  /**
   * Admin Fleet Analytics summary & tables
   */
  static async getAdminAnalytics(filters) {
    return await AnalyticsModel.getAdminDeliveryAnalytics(filters);
  }

  /**
   * Trigger real-time analytics updates and emit Socket.IO events
   */
  static async triggerAnalyticsUpdate(partnerId, reason = 'data_updated') {
    try {
      if (!partnerId) return;

      const summary = await AnalyticsModel.getPartnerAnalyticsSummary(partnerId, 'this_month');
      const score = await AnalyticsModel.calculatePerformanceScore(partnerId);

      const payload = {
        partner_id: partnerId,
        reason,
        summary,
        score,
        timestamp: new Date().toISOString(),
      };

      const io = getIO();
      if (io) {
        // Emit partner-specific events
        io.to(`delivery_partner_${partnerId}`).emit(DELIVERY_ANALYTICS_UPDATE || 'delivery:analytics:update', payload);
        io.to(`delivery_partner_${partnerId}`).emit(DELIVERY_PERFORMANCE_UPDATE || 'delivery:performance:update', score);
        
        // Emit global admin event
        io.to('admin_room').emit(ADMIN_ANALYTICS_UPDATE || 'admin:analytics:update', payload);
      }
    } catch (err) {
      console.warn('[ANALYTICS SERVICE] Socket update trigger error:', err.message);
    }
  }
}

module.exports = AnalyticsService;
