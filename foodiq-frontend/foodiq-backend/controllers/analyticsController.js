const AnalyticsService = require('../services/analyticsService');

class AnalyticsController {
  /**
   * GET /api/delivery/analytics
   */
  static async getDeliveryAnalytics(req, res) {
    try {
      const partnerId = req.user?.partner_id || req.user?.id;
      const range = req.query.range || 'this_month';

      if (!partnerId) {
        return res.status(400).json({ success: false, message: 'Delivery partner ID is required' });
      }

      const analytics = await AnalyticsService.getPartnerAnalytics(partnerId, range);
      return res.json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      console.error('[ANALYTICS CONTROLLER] getDeliveryAnalytics error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve delivery analytics', error: err.message });
    }
  }

  /**
   * GET /api/delivery/analytics/performance
   */
  static async getDeliveryPerformance(req, res) {
    try {
      const partnerId = req.user?.partner_id || req.user?.id;
      if (!partnerId) {
        return res.status(400).json({ success: false, message: 'Delivery partner ID is required' });
      }

      const performance = await AnalyticsService.getPartnerPerformance(partnerId);
      return res.json({
        success: true,
        data: performance,
      });
    } catch (err) {
      console.error('[ANALYTICS CONTROLLER] getDeliveryPerformance error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve performance score', error: err.message });
    }
  }

  /**
   * GET /api/delivery/analytics/history
   */
  static async getDeliveryHistory(req, res) {
    try {
      const partnerId = req.user?.partner_id || req.user?.id;
      const limit = parseInt(req.query.limit || '50', 10);
      const offset = parseInt(req.query.offset || '0', 10);

      if (!partnerId) {
        return res.status(400).json({ success: false, message: 'Delivery partner ID is required' });
      }

      const history = await AnalyticsService.getPartnerHistory(partnerId, limit, offset);
      return res.json({
        success: true,
        data: history,
      });
    } catch (err) {
      console.error('[ANALYTICS CONTROLLER] getDeliveryHistory error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve performance history', error: err.message });
    }
  }

  /**
   * Helper to handle report requests (daily, weekly, monthly)
   */
  static async handleReport(req, res, period) {
    try {
      const partnerId = req.user?.partner_id || req.user?.id;
      const format = (req.query.format || req.query.export || 'json').toLowerCase();

      if (!partnerId) {
        return res.status(400).json({ success: false, message: 'Delivery partner ID is required' });
      }

      const reportData = await AnalyticsService.generateReportData(partnerId, period);

      if (format === 'csv') {
        const csvContent = AnalyticsService.generateCSVReport(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=delivery_report_${period}_${Date.now()}.csv`);
        return res.send(csvContent);
      }

      if (format === 'pdf') {
        return AnalyticsService.generatePDFReport(reportData, res);
      }

      return res.json({
        success: true,
        data: reportData,
      });
    } catch (err) {
      console.error(`[ANALYTICS CONTROLLER] get${period}Report error:`, err);
      return res.status(500).json({ success: false, message: `Failed to generate ${period} report`, error: err.message });
    }
  }

  /**
   * GET /api/delivery/reports/daily
   */
  static async getDailyReport(req, res) {
    return await AnalyticsController.handleReport(req, res, 'daily');
  }

  /**
   * GET /api/delivery/reports/weekly
   */
  static async getWeeklyReport(req, res) {
    return await AnalyticsController.handleReport(req, res, 'weekly');
  }

  /**
   * GET /api/delivery/reports/monthly
   */
  static async getMonthlyReport(req, res) {
    return await AnalyticsController.handleReport(req, res, 'monthly');
  }

  /**
   * GET /api/admin/delivery-analytics
   */
  static async getAdminDeliveryAnalytics(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        limit: parseInt(req.query.limit || '20', 10),
        offset: parseInt(req.query.offset || '0', 10),
      };

      const analytics = await AnalyticsService.getAdminAnalytics(filters);
      return res.json({
        success: true,
        data: analytics,
      });
    } catch (err) {
      console.error('[ANALYTICS CONTROLLER] getAdminDeliveryAnalytics error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve admin delivery analytics', error: err.message });
    }
  }

  /**
   * GET /api/admin/delivery-performance
   */
  static async getAdminDeliveryPerformance(req, res) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        search: req.query.search,
        limit: parseInt(req.query.limit || '50', 10),
        offset: parseInt(req.query.offset || '0', 10),
      };

      const analytics = await AnalyticsService.getAdminAnalytics(filters);
      return res.json({
        success: true,
        data: {
          summary: analytics.summary,
          top_riders: analytics.top_riders,
          worst_performers: analytics.worst_performers,
        },
      });
    } catch (err) {
      console.error('[ANALYTICS CONTROLLER] getAdminDeliveryPerformance error:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve admin delivery performance', error: err.message });
    }
  }
}

module.exports = AnalyticsController;
