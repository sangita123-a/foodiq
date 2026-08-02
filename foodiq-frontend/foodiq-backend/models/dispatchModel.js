const { pool } = require('../config/db');

class DispatchModel {
  static async ensureTables() {
    const ddl = `
      CREATE TABLE IF NOT EXISTS dispatch_rules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rule_name VARCHAR(100) NOT NULL UNIQUE DEFAULT 'default_scoring',
          weight_distance DECIMAL(5,2) DEFAULT 25.0,
          weight_gps DECIMAL(5,2) DEFAULT 10.0,
          weight_online_status DECIMAL(5,2) DEFAULT 10.0,
          weight_shift_status DECIMAL(5,2) DEFAULT 10.0,
          weight_kyc DECIMAL(5,2) DEFAULT 10.0,
          weight_fraud_score DECIMAL(5,2) DEFAULT 10.0,
          weight_workload DECIMAL(5,2) DEFAULT 10.0,
          weight_vehicle DECIMAL(5,2) DEFAULT 5.0,
          weight_avg_delivery_time DECIMAL(5,2) DEFAULT 5.0,
          weight_acceptance_rate DECIMAL(5,2) DEFAULT 5.0,
          weight_completion_rate DECIMAL(5,2) DEFAULT 5.0,
          weight_rating DECIMAL(5,2) DEFAULT 10.0,
          weight_geofence DECIMAL(5,2) DEFAULT 10.0,
          weight_traffic_delay DECIMAL(5,2) DEFAULT 5.0,
          weight_estimated_arrival DECIMAL(5,2) DEFAULT 5.0,
          weight_idle_time DECIMAL(5,2) DEFAULT 5.0,
          max_search_radius_km DECIMAL(5,2) DEFAULT 15.0,
          max_active_orders_per_partner INTEGER DEFAULT 2,
          auto_assign_enabled BOOLEAN DEFAULT TRUE,
          max_retry_attempts INTEGER DEFAULT 3,
          reassign_timeout_seconds INTEGER DEFAULT 45,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dispatch_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          dispatch_run_id UUID NOT NULL,
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
          total_score DECIMAL(6,2) NOT NULL,
          scoring_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
          decision_reason TEXT NOT NULL,
          status VARCHAR(40) NOT NULL DEFAULT 'calculated',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dispatch_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          dispatch_run_id UUID NOT NULL UNIQUE,
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          assigned_partner_id UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
          trigger_type VARCHAR(50) DEFAULT 'auto',
          attempt_number INTEGER DEFAULT 1,
          status VARCHAR(40) DEFAULT 'assigned',
          candidates_evaluated INTEGER DEFAULT 0,
          ai_decision_summary TEXT,
          execution_time_ms INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(ddl);
  }

  static async getRules() {
    await this.ensureTables();
    const query = `
      SELECT * FROM dispatch_rules
      WHERE is_active = TRUE
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(query);

    if (rows[0]) {
      return this.mapRuleRow(rows[0]);
    }

    // Default rules fallback
    return {
      id: 'default',
      rule_name: 'default_scoring',
      weight_distance: 25.0,
      weight_gps: 10.0,
      weight_online_status: 10.0,
      weight_shift_status: 10.0,
      weight_kyc: 10.0,
      weight_fraud_score: 10.0,
      weight_workload: 10.0,
      weight_vehicle: 5.0,
      weight_avg_delivery_time: 5.0,
      weight_acceptance_rate: 5.0,
      weight_completion_rate: 5.0,
      weight_rating: 10.0,
      weight_geofence: 10.0,
      weight_traffic_delay: 5.0,
      weight_estimated_arrival: 5.0,
      weight_idle_time: 5.0,
      max_search_radius_km: 15.0,
      max_active_orders_per_partner: 2,
      auto_assign_enabled: true,
      max_retry_attempts: 3,
      reassign_timeout_seconds: 45,
      is_active: true,
    };
  }

  static mapRuleRow(row) {
    return {
      id: row.id,
      rule_name: row.rule_name,
      weight_distance: Number(row.weight_distance ?? 25.0),
      weight_gps: Number(row.weight_gps ?? 10.0),
      weight_online_status: Number(row.weight_online_status ?? 10.0),
      weight_shift_status: Number(row.weight_shift_status ?? 10.0),
      weight_kyc: Number(row.weight_kyc ?? 10.0),
      weight_fraud_score: Number(row.weight_fraud_score ?? 10.0),
      weight_workload: Number(row.weight_workload ?? 10.0),
      weight_vehicle: Number(row.weight_vehicle ?? 5.0),
      weight_avg_delivery_time: Number(row.weight_avg_delivery_time ?? 5.0),
      weight_acceptance_rate: Number(row.weight_acceptance_rate ?? 5.0),
      weight_completion_rate: Number(row.weight_completion_rate ?? 5.0),
      weight_rating: Number(row.weight_rating ?? 10.0),
      weight_geofence: Number(row.weight_geofence ?? 10.0),
      weight_traffic_delay: Number(row.weight_traffic_delay ?? 5.0),
      weight_estimated_arrival: Number(row.weight_estimated_arrival ?? 5.0),
      weight_idle_time: Number(row.weight_idle_time ?? 5.0),
      max_search_radius_km: Number(row.max_search_radius_km ?? 15.0),
      max_active_orders_per_partner: Number(row.max_active_orders_per_partner ?? 2),
      auto_assign_enabled: Boolean(row.auto_assign_enabled ?? true),
      max_retry_attempts: Number(row.max_retry_attempts ?? 3),
      reassign_timeout_seconds: Number(row.reassign_timeout_seconds ?? 45),
      is_active: Boolean(row.is_active ?? true),
    };
  }

  static async updateRules(data) {
    await this.ensureTables();
    const query = `
      INSERT INTO dispatch_rules (
        rule_name, weight_distance, weight_gps, weight_online_status,
        weight_shift_status, weight_kyc, weight_fraud_score, weight_workload,
        weight_vehicle, weight_avg_delivery_time, weight_acceptance_rate,
        weight_completion_rate, weight_rating, weight_geofence, weight_traffic_delay,
        weight_estimated_arrival, weight_idle_time, max_search_radius_km,
        max_active_orders_per_partner, auto_assign_enabled, max_retry_attempts,
        reassign_timeout_seconds, is_active, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, TRUE, CURRENT_TIMESTAMP
      )
      ON CONFLICT (rule_name) DO UPDATE SET
        weight_distance = EXCLUDED.weight_distance,
        weight_gps = EXCLUDED.weight_gps,
        weight_online_status = EXCLUDED.weight_online_status,
        weight_shift_status = EXCLUDED.weight_shift_status,
        weight_kyc = EXCLUDED.weight_kyc,
        weight_fraud_score = EXCLUDED.weight_fraud_score,
        weight_workload = EXCLUDED.weight_workload,
        weight_vehicle = EXCLUDED.weight_vehicle,
        weight_avg_delivery_time = EXCLUDED.weight_avg_delivery_time,
        weight_acceptance_rate = EXCLUDED.weight_acceptance_rate,
        weight_completion_rate = EXCLUDED.weight_completion_rate,
        weight_rating = EXCLUDED.weight_rating,
        weight_geofence = EXCLUDED.weight_geofence,
        weight_traffic_delay = EXCLUDED.weight_traffic_delay,
        weight_estimated_arrival = EXCLUDED.weight_estimated_arrival,
        weight_idle_time = EXCLUDED.weight_idle_time,
        max_search_radius_km = EXCLUDED.max_search_radius_km,
        max_active_orders_per_partner = EXCLUDED.max_active_orders_per_partner,
        auto_assign_enabled = EXCLUDED.auto_assign_enabled,
        max_retry_attempts = EXCLUDED.max_retry_attempts,
        reassign_timeout_seconds = EXCLUDED.reassign_timeout_seconds,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      data.rule_name || 'default_scoring',
      data.weight_distance ?? 25.0,
      data.weight_gps ?? 10.0,
      data.weight_online_status ?? 10.0,
      data.weight_shift_status ?? 10.0,
      data.weight_kyc ?? 10.0,
      data.weight_fraud_score ?? 10.0,
      data.weight_workload ?? 10.0,
      data.weight_vehicle ?? 5.0,
      data.weight_avg_delivery_time ?? 5.0,
      data.weight_acceptance_rate ?? 5.0,
      data.weight_completion_rate ?? 5.0,
      data.weight_rating ?? 10.0,
      data.weight_geofence ?? 10.0,
      data.weight_traffic_delay ?? 5.0,
      data.weight_estimated_arrival ?? 5.0,
      data.weight_idle_time ?? 5.0,
      data.max_search_radius_km ?? 15.0,
      data.max_active_orders_per_partner ?? 2,
      data.auto_assign_enabled ?? true,
      data.max_retry_attempts ?? 3,
      data.reassign_timeout_seconds ?? 45,
    ];

    const { rows } = await pool.query(query, values);
    return this.mapRuleRow(rows[0]);
  }

  static async getReadyOrders() {
    await this.ensureTables();
    const query = `
      SELECT o.id, o.restaurant_id, o.status, o.subtotal, o.total_amount, o.created_at,
             r.name as restaurant_name, r.address as restaurant_address,
             r.image_url as restaurant_image,
             COALESCE(NULLIF(r.address, ''), '12.9716,77.5946') as restaurant_location,
             u.full_name as customer_name, a.street as customer_street, a.city as customer_city,
             a.lat as customer_lat, a.lng as customer_lng
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN addresses a ON a.id = o.delivery_address_id
      WHERE LOWER(o.status) IN ('ready for pickup', 'preparing', 'accepted', 'paid', 'pending')
      ORDER BY o.created_at ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  static async getOrderDetails(orderId) {
    await this.ensureTables();
    const query = `
      SELECT o.id, o.restaurant_id, o.user_id, o.status, o.total_amount, o.delivery_fee, o.created_at,
             r.name as restaurant_name, r.address as restaurant_address,
             COALESCE(r.image_url, '') as restaurant_image,
             u.full_name as customer_name, u.phone_number as customer_phone,
             a.house_no, a.street as customer_street, a.landmark, a.city as customer_city,
             a.lat as customer_lat, a.lng as customer_lng
      FROM orders o
      JOIN restaurants r ON r.id = o.restaurant_id
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN addresses a ON a.id = o.delivery_address_id
      WHERE o.id = $1
    `;
    const { rows } = await pool.query(query, [orderId]);
    if (!rows[0]) return null;

    const order = rows[0];
    return {
      id: order.id,
      restaurant_id: order.restaurant_id,
      restaurant_name: order.restaurant_name,
      restaurant_address: order.restaurant_address,
      restaurant_lat: 12.9716, // Default fallback coord for Bangalore
      restaurant_lng: 77.5946,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_address: [order.house_no, order.customer_street, order.landmark, order.customer_city].filter(Boolean).join(', '),
      customer_lat: order.customer_lat ? Number(order.customer_lat) : 12.9352,
      customer_lng: order.customer_lng ? Number(order.customer_lng) : 77.6245,
      status: order.status,
      total_amount: Number(order.total_amount || 0),
      delivery_fee: Number(order.delivery_fee || 0),
      created_at: order.created_at,
    };
  }

  static async getCandidatePartners() {
    await this.ensureTables();
    // Query delivery_partners joined with users and current workload counts
    const query = `
      SELECT dp.id, dp.full_name, dp.email, dp.phone_number, dp.vehicle_type, dp.vehicle_number,
             dp.current_lat, dp.current_lng, dp.is_available, dp.is_online, dp.is_verified,
             dp.rating, dp.status, dp.wallet_balance, dp.updated_at as last_gps_at,
             COUNT(o.id)::int as active_workload,
             MAX(dl.created_at) as last_completed_at
      FROM delivery_partners dp
      LEFT JOIN orders o ON o.delivery_partner_id = dp.id 
            AND LOWER(o.status) IN ('accepted', 'preparing', 'ready for pickup', 'picked up', 'on the way', 'out for delivery')
      LEFT JOIN delivery_locations dl ON dl.partner_id = dp.id
      WHERE dp.status = 'approved'
      GROUP BY dp.id
    `;
    const { rows } = await pool.query(query);

    return rows.map((dp) => ({
      id: dp.id,
      full_name: dp.full_name || 'Delivery Partner',
      email: dp.email,
      phone_number: dp.phone_number,
      vehicle_type: dp.vehicle_type || 'bike',
      vehicle_number: dp.vehicle_number || 'KA-01-EQ-1001',
      current_lat: dp.current_lat != null ? Number(dp.current_lat) : 12.9720 + (Math.random() - 0.5) * 0.05,
      current_lng: dp.current_lng != null ? Number(dp.current_lng) : 77.5950 + (Math.random() - 0.5) * 0.05,
      is_available: Boolean(dp.is_available ?? true),
      is_online: Boolean(dp.is_online ?? true),
      is_verified: Boolean(dp.is_verified ?? true),
      rating: Number(dp.rating || 4.8),
      active_workload: Number(dp.active_workload || 0),
      last_gps_at: dp.last_gps_at || new Date().toISOString(),
      last_completed_at: dp.last_completed_at || null,
    }));
  }

  static async getPartnerShiftStatus(partnerId) {
    const query = `
      SELECT COUNT(*)::int as active_shifts
      FROM delivery_sync_logs
      WHERE partner_id = $1 AND sync_type = 'shift'
    `;
    const { rows } = await pool.query(query, [partnerId]);
    return Number(rows[0]?.active_shifts || 0) > 0;
  }

  static async getPartnerAnalytics(partnerId) {
    const query = `
      SELECT 
        COALESCE(AVG(average_rating), 4.8)::float as avg_rating,
        COALESCE(AVG(acceptance_rate), 95.0)::float as acceptance_rate,
        COALESCE(AVG(completion_rate), 98.0)::float as completion_rate,
        COALESCE(SUM(orders_completed), 12)::int as total_orders,
        COALESCE(AVG(active_hours * 60 / NULLIF(orders_completed, 0)), 22.5)::float as avg_delivery_time_mins
      FROM delivery_daily_analytics
      WHERE partner_id = $1
    `;
    const { rows } = await pool.query(query, [partnerId]);
    const row = rows[0] || {};
    return {
      avg_rating: Number(row.avg_rating || 4.8),
      acceptance_rate: Number(row.acceptance_rate || 95.0),
      completion_rate: Number(row.completion_rate || 98.0),
      total_orders: Number(row.total_orders || 12),
      avg_delivery_time_mins: Number(row.avg_delivery_time_mins || 22.5),
    };
  }

  static async getPartnerFraudRisk(partnerId) {
    const query = `
      SELECT COALESCE(SUM(risk_score), 0)::int as total_risk
      FROM delivery_sync_logs
      WHERE partner_id = $1 AND entity_type = 'fraud_flag'
    `;
    const { rows } = await pool.query(query, [partnerId]);
    return Math.min(100, Math.max(0, Number(rows[0]?.total_risk || 5)));
  }

  static async createDispatchLog({ dispatch_run_id, order_id, partner_id, total_score, scoring_breakdown, decision_reason, status = 'calculated' }) {
    await this.ensureTables();
    const query = `
      INSERT INTO dispatch_logs (
        dispatch_run_id, order_id, partner_id, total_score, scoring_breakdown, decision_reason, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      dispatch_run_id,
      order_id,
      partner_id || null,
      total_score,
      JSON.stringify(scoring_breakdown || {}),
      decision_reason,
      status,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async createDispatchHistory({ dispatch_run_id, order_id, assigned_partner_id, trigger_type = 'auto', attempt_number = 1, status = 'assigned', candidates_evaluated = 0, ai_decision_summary = '', execution_time_ms = 0 }) {
    await this.ensureTables();
    const query = `
      INSERT INTO dispatch_history (
        dispatch_run_id, order_id, assigned_partner_id, trigger_type, attempt_number,
        status, candidates_evaluated, ai_decision_summary, execution_time_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (dispatch_run_id) DO UPDATE SET
        assigned_partner_id = EXCLUDED.assigned_partner_id,
        status = EXCLUDED.status,
        candidates_evaluated = EXCLUDED.candidates_evaluated,
        ai_decision_summary = EXCLUDED.ai_decision_summary,
        execution_time_ms = EXCLUDED.execution_time_ms,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      dispatch_run_id,
      order_id,
      assigned_partner_id || null,
      trigger_type,
      attempt_number,
      status,
      candidates_evaluated,
      ai_decision_summary,
      execution_time_ms,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async assignOrderToPartner(orderId, partnerId) {
    const query = `
      UPDATE orders
      SET delivery_partner_id = $1,
          status = 'Out for Delivery',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const { rows } = await pool.query(query, [partnerId, orderId]);
    return rows[0];
  }

  static async getHistory({ limit = 50, offset = 0, status, order_id } = {}) {
    await this.ensureTables();
    let whereClause = 'WHERE 1=1';
    const values = [];

    if (status) {
      values.push(status);
      whereClause += ` AND dh.status = $${values.length}`;
    }
    if (order_id) {
      values.push(order_id);
      whereClause += ` AND dh.order_id = $${values.length}`;
    }

    values.push(limit, offset);
    const query = `
      SELECT dh.*, o.total_amount, o.status as order_status, r.name as restaurant_name,
             dp.full_name as partner_name, dp.phone_number as partner_phone, dp.rating as partner_rating
      FROM dispatch_history dh
      JOIN orders o ON o.id = dh.order_id
      JOIN restaurants r ON r.id = o.restaurant_id
      LEFT JOIN delivery_partners dp ON dp.id = dh.assigned_partner_id
      ${whereClause}
      ORDER BY dh.created_at DESC
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `;

    const countQuery = `
      SELECT COUNT(*)::int as total
      FROM dispatch_history dh
      ${whereClause}
    `;

    const [dataRes, countRes] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, values.length - 2)),
    ]);

    return {
      history: dataRes.rows,
      total: Number(countRes.rows[0]?.total || 0),
      limit: Number(limit),
      offset: Number(offset),
    };
  }

  static async getLogs({ dispatch_run_id, order_id, limit = 50 } = {}) {
    await this.ensureTables();
    let whereClause = 'WHERE 1=1';
    const values = [];

    if (dispatch_run_id) {
      values.push(dispatch_run_id);
      whereClause += ` AND dl.dispatch_run_id = $${values.length}`;
    }
    if (order_id) {
      values.push(order_id);
      whereClause += ` AND dl.order_id = $${values.length}`;
    }

    values.push(limit);
    const query = `
      SELECT dl.*, dp.full_name as partner_name, dp.vehicle_type, dp.rating as partner_rating,
             dp.phone_number as partner_phone
      FROM dispatch_logs dl
      LEFT JOIN delivery_partners dp ON dp.id = dl.partner_id
      ${whereClause}
      ORDER BY dl.total_score DESC, dl.created_at DESC
      LIMIT $${values.length}
    `;

    const { rows } = await pool.query(query, values);
    return rows;
  }
}

module.exports = DispatchModel;
