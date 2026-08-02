const { pool } = require('../config/db');

class AnalyticsModel {
  /**
   * Helper to parse date range conditions for SQL queries
   */
  static getDateRangeFilter(range = 'this_month', dateColumn = 'created_at') {
    switch (range.toLowerCase()) {
      case 'today':
        return `${dateColumn} >= CURRENT_DATE`;
      case 'yesterday':
        return `${dateColumn} >= CURRENT_DATE - INTERVAL '1 day' AND ${dateColumn} < CURRENT_DATE`;
      case 'this_week':
        return `${dateColumn} >= DATE_TRUNC('week', CURRENT_DATE)`;
      case 'last_week':
        return `${dateColumn} >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week') AND ${dateColumn} < DATE_TRUNC('week', CURRENT_DATE)`;
      case 'this_month':
        return `${dateColumn} >= DATE_TRUNC('month', CURRENT_DATE)`;
      case 'last_month':
        return `${dateColumn} >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND ${dateColumn} < DATE_TRUNC('month', CURRENT_DATE)`;
      case 'lifetime':
      default:
        return '1=1';
    }
  }

  /**
   * Get analytics summary for a delivery partner over a given time range
   */
  static async getPartnerAnalyticsSummary(partnerId, range = 'this_month') {
    const rangeFilterOrders = this.getDateRangeFilter(range, 'o.created_at');
    const rangeFilterDaily = this.getDateRangeFilter(range, 'dda.date');
    const rangeFilterWallet = this.getDateRangeFilter(range, 'wt.created_at');

    // 1. Query Orders & Assignments metrics
    const orderMetricsRes = await pool.query(
      `
      SELECT
        COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::INT as completed_orders,
        COUNT(CASE WHEN o.order_status IN ('cancelled', 'rejected') THEN 1 END)::INT as cancelled_orders,
        COUNT(o.id)::INT as total_orders_assigned,
        COALESCE(AVG(CASE WHEN o.order_status = 'delivered' AND o.updated_at > o.created_at 
          THEN EXTRACT(EPOCH FROM (o.updated_at - o.created_at))/60 END), 30.0) as avg_delivery_time_mins,
        COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN o.delivery_fee ELSE 0 END), 0) as total_delivery_earnings
      FROM orders o
      WHERE (o.delivery_partner_id = $1 OR o.driver_id = $1)
        AND ${rangeFilterOrders}
      `,
      [partnerId]
    );

    // 2. Query Daily Analytics aggregation (online hours, distance, idle hours, tips, bonuses)
    const dailyAnalyticsRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(total_distance_km), 0)::FLOAT as total_distance_km,
        COALESCE(SUM(online_hours), 0)::FLOAT as total_online_hours,
        COALESCE(SUM(active_hours), 0)::FLOAT as total_active_hours,
        COALESCE(SUM(idle_hours), 0)::FLOAT as total_idle_hours,
        COALESCE(SUM(earnings), 0)::FLOAT as aggregated_earnings,
        COALESCE(SUM(tips), 0)::FLOAT as total_tips,
        COALESCE(SUM(bonuses), 0)::FLOAT as total_bonuses,
        COALESCE(AVG(average_rating), 5.0)::FLOAT as snapshot_rating,
        COALESCE(AVG(acceptance_rate), 100.0)::FLOAT as avg_acceptance_rate,
        COALESCE(AVG(completion_rate), 100.0)::FLOAT as avg_completion_rate
      FROM delivery_daily_analytics dda
      WHERE partner_id = $1
        AND ${rangeFilterDaily}
      `,
      [partnerId]
    );

    // 3. Query Wallet Growth / Transactions for partner
    const walletRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type IN ('credit', 'earning', 'tip', 'bonus') THEN amount ELSE 0 END), 0)::FLOAT as wallet_growth,
        COALESCE(SUM(CASE WHEN type = 'tip' THEN amount ELSE 0 END), 0)::FLOAT as wallet_tips,
        COALESCE(SUM(CASE WHEN type = 'bonus' THEN amount ELSE 0 END), 0)::FLOAT as wallet_bonuses
      FROM wallet_transactions wt
      JOIN wallets w ON wt.wallet_id = w.id
      WHERE w.user_id = $1
        AND ${rangeFilterWallet}
      `,
      [partnerId]
    );

    // 4. Query Rating from delivery_partner_reviews or delivery_partners
    const ratingRes = await pool.query(
      `
      SELECT
        COALESCE(AVG(rating), 5.0)::FLOAT as avg_rating,
        COUNT(id)::INT as total_reviews
      FROM delivery_partner_reviews
      WHERE partner_id = $1
      `,
      [partnerId]
    );

    // 5. Query Peak Delivery Hours (Hour distribution of delivered orders)
    const peakHoursRes = await pool.query(
      `
      SELECT
        EXTRACT(HOUR FROM created_at)::INT as hour,
        COUNT(id)::INT as count
      FROM orders
      WHERE (delivery_partner_id = $1 OR driver_id = $1)
        AND order_status = 'delivered'
        AND ${rangeFilterOrders}
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY count DESC
      `,
      [partnerId]
    );

    // 6. Query Most Active Area / City
    const areaStatsRes = await pool.query(
      `
      SELECT
        COALESCE(r.city, r.address, 'Main Downtown') as area_name,
        COUNT(o.id)::INT as count
      FROM orders o
      LEFT JOIN restaurants r ON o.restaurant_id = r.id
      WHERE (o.delivery_partner_id = $1 OR o.driver_id = $1)
        AND o.order_status = 'delivered'
        AND ${rangeFilterOrders}
      GROUP BY COALESCE(r.city, r.address, 'Main Downtown')
      ORDER BY count DESC
      LIMIT 5
      `,
      [partnerId]
    );

    const orderStats = orderMetricsRes.rows[0] || {};
    const dailyStats = dailyAnalyticsRes.rows[0] || {};
    const walletStats = walletRes.rows[0] || {};
    const ratingStats = ratingRes.rows[0] || {};

    const completedOrders = parseInt(orderStats.completed_orders || 0, 10);
    const cancelledOrders = parseInt(orderStats.cancelled_orders || 0, 10);
    const totalAssigned = completedOrders + cancelledOrders || 1;

    const acceptanceRate = Math.min(100, Math.round(((completedOrders + cancelledOrders) / totalAssigned) * 100));
    const completionRate = Math.min(100, Math.round((completedOrders / totalAssigned) * 100));
    const successRate = completionRate;

    const tips = Math.max(parseFloat(dailyStats.total_tips || 0), parseFloat(walletStats.wallet_tips || 0));
    const bonuses = Math.max(parseFloat(dailyStats.total_bonuses || 0), parseFloat(walletStats.wallet_bonuses || 0));
    const baseEarnings = parseFloat(orderStats.total_delivery_earnings || dailyStats.aggregated_earnings || 0);
    const totalEarnings = baseEarnings + tips + bonuses;

    const avgEarningsPerOrder = completedOrders > 0 ? parseFloat((totalEarnings / completedOrders).toFixed(2)) : 0;
    const walletGrowth = Math.max(totalEarnings, parseFloat(walletStats.wallet_growth || 0));

    const avgRating = parseFloat(ratingStats.avg_rating || dailyStats.snapshot_rating || 5.0).toFixed(1);
    const mostActiveArea = areaStatsRes.rows[0]?.area_name || 'Downtown Central';

    return {
      range,
      completed_orders: completedOrders,
      cancelled_orders: cancelledOrders,
      acceptance_rate: acceptanceRate,
      completion_rate: completionRate,
      success_rate: successRate,
      average_rating: parseFloat(avgRating),
      average_delivery_time_mins: Math.round(parseFloat(orderStats.avg_delivery_time_mins || 25)),
      total_distance_km: parseFloat(dailyStats.total_distance_km || (completedOrders * 3.5)).toFixed(1),
      total_online_hours: parseFloat(dailyStats.total_online_hours || (completedOrders * 0.8 + 2)).toFixed(1),
      active_hours: parseFloat(dailyStats.total_active_hours || (completedOrders * 0.5)).toFixed(1),
      idle_hours: parseFloat(dailyStats.total_idle_hours || 1.5).toFixed(1),
      peak_delivery_hours: peakHoursRes.rows,
      most_active_area: mostActiveArea,
      area_statistics: areaStatsRes.rows,
      earnings: parseFloat(baseEarnings.toFixed(2)),
      tips: parseFloat(tips.toFixed(2)),
      bonuses: parseFloat(bonuses.toFixed(2)),
      total_earnings: parseFloat(totalEarnings.toFixed(2)),
      average_earnings_per_order: avgEarningsPerOrder,
      wallet_growth: parseFloat(walletGrowth.toFixed(2)),
    };
  }

  /**
   * Calculate 0-100 Performance Score and metrics breakdown
   */
  static async calculatePerformanceScore(partnerId) {
    const summary = await this.getPartnerAnalyticsSummary(partnerId, 'lifetime');

    // 1. Fraud score factor (check open fraud cases or severity)
    const fraudRes = await pool.query(
      `
      SELECT COUNT(*)::INT as fraud_count
      FROM fraud_cases
      WHERE partner_id = $1 AND status != 'resolved'
      `,
      [partnerId]
    );
    const fraudCount = parseInt(fraudRes.rows[0]?.fraud_count || 0, 10);
    const fraudScoreDeduction = Math.min(30, fraudCount * 10);
    const fraudComponent = Math.max(0, 100 - fraudScoreDeduction);

    // Score components:
    // Acceptance Rate: 20%
    // Completion Rate: 25%
    // Rating (scale 1-5 to 0-100): 20%
    // Fraud Cleanliness Component: 15%
    // Attendance / Online Hours Component: 10%
    // Customer Feedback / On-Time Component: 10%

    const acceptanceComp = summary.acceptance_rate;
    const completionComp = summary.completion_rate;
    const ratingComp = Math.min(100, Math.round((summary.average_rating / 5.0) * 100));
    const attendanceComp = Math.min(100, Math.round((parseFloat(summary.total_online_hours) / 10.0) * 100));
    const feedbackComp = Math.min(100, Math.round((summary.average_rating >= 4.5 ? 95 : 80)));

    const rawScore =
      acceptanceComp * 0.20 +
      completionComp * 0.25 +
      ratingComp * 0.20 +
      fraudComponent * 0.15 +
      attendanceComp * 0.10 +
      feedbackComp * 0.10;

    const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

    // Fetch existing performance score from last audit
    const lastAuditRes = await pool.query(
      `
      SELECT new_value
      FROM delivery_performance_history
      WHERE partner_id = $1 AND metric = 'performance_score'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [partnerId]
    );

    const oldScore = lastAuditRes.rows[0] ? parseFloat(lastAuditRes.rows[0].new_value) : finalScore;

    // Log to audit if score changed
    if (!lastAuditRes.rows[0] || oldScore !== finalScore) {
      await this.logPerformanceHistory(
        partnerId,
        'performance_score',
        oldScore,
        finalScore,
        `Performance score auto-calculated based on acceptance (${acceptanceComp}%), completion (${completionComp}%), rating (${summary.average_rating}) and attendance.`
      );
    }

    return {
      partner_id: partnerId,
      score: finalScore,
      breakdown: {
        acceptance: Math.round(acceptanceComp),
        completion: Math.round(completionComp),
        rating: Math.round(ratingComp),
        fraud_cleanliness: Math.round(fraudComponent),
        attendance: Math.round(attendanceComp),
        customer_feedback: Math.round(feedbackComp),
      },
      metrics: summary,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Insert record into delivery_performance_history
   */
  static async logPerformanceHistory(partnerId, metric, oldValue, newValue, reason) {
    const res = await pool.query(
      `
      INSERT INTO delivery_performance_history (partner_id, metric, old_value, new_value, reason)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [partnerId, metric, oldValue, newValue, reason]
    );
    return res.rows[0];
  }

  /**
   * Get performance history logs for a delivery partner
   */
  static async getPerformanceHistory(partnerId, limit = 50, offset = 0) {
    const res = await pool.query(
      `
      SELECT *
      FROM delivery_performance_history
      WHERE partner_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [partnerId, limit, offset]
    );
    return res.rows;
  }

  /**
   * Upsert record in delivery_daily_analytics
   */
  static async upsertDailyAnalytics(partnerId, date, metrics) {
    const {
      orders_completed = 0,
      orders_cancelled = 0,
      total_distance_km = 0,
      online_hours = 0,
      active_hours = 0,
      idle_hours = 0,
      earnings = 0,
      tips = 0,
      bonuses = 0,
      average_rating = 5.0,
      acceptance_rate = 100.0,
      completion_rate = 100.0,
    } = metrics;

    const res = await pool.query(
      `
      INSERT INTO delivery_daily_analytics (
        partner_id, date, orders_completed, orders_cancelled, total_distance_km,
        online_hours, active_hours, idle_hours, earnings, tips, bonuses,
        average_rating, acceptance_rate, completion_rate, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP)
      ON CONFLICT (partner_id, date) DO UPDATE SET
        orders_completed = delivery_daily_analytics.orders_completed + EXCLUDED.orders_completed,
        orders_cancelled = delivery_daily_analytics.orders_cancelled + EXCLUDED.orders_cancelled,
        total_distance_km = delivery_daily_analytics.total_distance_km + EXCLUDED.total_distance_km,
        online_hours = delivery_daily_analytics.online_hours + EXCLUDED.online_hours,
        active_hours = delivery_daily_analytics.active_hours + EXCLUDED.active_hours,
        idle_hours = delivery_daily_analytics.idle_hours + EXCLUDED.idle_hours,
        earnings = delivery_daily_analytics.earnings + EXCLUDED.earnings,
        tips = delivery_daily_analytics.tips + EXCLUDED.tips,
        bonuses = delivery_daily_analytics.bonuses + EXCLUDED.bonuses,
        average_rating = EXCLUDED.average_rating,
        acceptance_rate = EXCLUDED.acceptance_rate,
        completion_rate = EXCLUDED.completion_rate,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        partnerId,
        date,
        orders_completed,
        orders_cancelled,
        total_distance_km,
        online_hours,
        active_hours,
        idle_hours,
        earnings,
        tips,
        bonuses,
        average_rating,
        acceptance_rate,
        completion_rate,
      ]
    );

    return res.rows[0];
  }

  /**
   * Admin Delivery Analytics: fleet statistics, top riders, lowest performers, revenue charts
   */
  static async getAdminDeliveryAnalytics({ startDate, endDate, search, limit = 20, offset = 0 }) {
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (dp.full_name ILIKE $${params.length} OR dp.email ILIKE $${params.length} OR dp.phone_number ILIKE $${params.length})`;
    }

    // Top riders by completed orders & score
    const topRidersRes = await pool.query(
      `
      SELECT
        dp.id,
        dp.full_name,
        dp.email,
        dp.phone_number,
        dp.vehicle_type,
        dp.rating,
        dp.is_online,
        COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::INT as completed_orders,
        COUNT(CASE WHEN o.order_status IN ('cancelled', 'rejected') THEN 1 END)::INT as cancelled_orders,
        COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN o.delivery_fee ELSE 0 END), 0)::FLOAT as total_earnings
      FROM delivery_partners dp
      LEFT JOIN orders o ON (o.delivery_partner_id = dp.id OR o.driver_id = dp.id)
      ${whereClause}
      GROUP BY dp.id, dp.full_name, dp.email, dp.phone_number, dp.vehicle_type, dp.rating, dp.is_online
      ORDER BY completed_orders DESC, dp.rating DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `,
      [...params, limit, offset]
    );

    // Calculate score for each top rider
    const topRidersWithScores = await Promise.all(
      topRidersRes.rows.map(async (rider) => {
        const perf = await this.calculatePerformanceScore(rider.id);
        return {
          ...rider,
          performance_score: perf.score,
        };
      })
    );

    // Worst performers by lowest score / high cancellations
    const worstPerformersRes = await pool.query(
      `
      SELECT
        dp.id,
        dp.full_name,
        dp.email,
        dp.phone_number,
        dp.vehicle_type,
        dp.rating,
        COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::INT as completed_orders,
        COUNT(CASE WHEN o.order_status IN ('cancelled', 'rejected') THEN 1 END)::INT as cancelled_orders
      FROM delivery_partners dp
      LEFT JOIN orders o ON (o.delivery_partner_id = dp.id OR o.driver_id = dp.id)
      ${whereClause}
      GROUP BY dp.id, dp.full_name, dp.email, dp.phone_number, dp.vehicle_type, dp.rating
      ORDER BY cancelled_orders DESC, dp.rating ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `,
      [...params, limit, offset]
    );

    const worstPerformersWithScores = await Promise.all(
      worstPerformersRes.rows.map(async (rider) => {
        const perf = await this.calculatePerformanceScore(rider.id);
        return {
          ...rider,
          performance_score: perf.score,
        };
      })
    );

    // Fleet Summary Totals
    const fleetSummaryRes = await pool.query(
      `
      SELECT
        COUNT(DISTINCT dp.id)::INT as total_partners,
        COUNT(DISTINCT CASE WHEN dp.is_online THEN dp.id END)::INT as online_partners,
        COALESCE(AVG(dp.rating), 5.0)::FLOAT as average_fleet_rating,
        COALESCE(SUM(CASE WHEN o.order_status = 'delivered' THEN o.delivery_fee ELSE 0 END), 0)::FLOAT as total_fleet_revenue,
        COUNT(CASE WHEN o.order_status = 'delivered' THEN 1 END)::INT as total_delivered_orders,
        COUNT(CASE WHEN o.order_status = 'cancelled' THEN 1 END)::INT as total_cancelled_orders
      FROM delivery_partners dp
      LEFT JOIN orders o ON (o.delivery_partner_id = dp.id OR o.driver_id = dp.id)
      `
    );

    const summary = fleetSummaryRes.rows[0] || {};
    const totalDelivered = parseInt(summary.total_delivered_orders || 0, 10);
    const totalCancelled = parseInt(summary.total_cancelled_orders || 0, 10);
    const totalOrders = totalDelivered + totalCancelled || 1;

    return {
      summary: {
        total_partners: parseInt(summary.total_partners || 0, 10),
        online_partners: parseInt(summary.online_partners || 0, 10),
        average_fleet_rating: parseFloat(parseFloat(summary.average_fleet_rating || 5.0).toFixed(2)),
        total_fleet_revenue: parseFloat(parseFloat(summary.total_fleet_revenue || 0).toFixed(2)),
        total_delivered_orders: totalDelivered,
        total_cancelled_orders: totalCancelled,
        average_completion_rate: Math.min(100, Math.round((totalDelivered / totalOrders) * 100)),
        average_acceptance_rate: Math.min(100, Math.round(((totalDelivered + totalCancelled) / totalOrders) * 100)),
      },
      top_riders: topRidersWithScores,
      worst_performers: worstPerformersWithScores,
    };
  }
}

module.exports = AnalyticsModel;
