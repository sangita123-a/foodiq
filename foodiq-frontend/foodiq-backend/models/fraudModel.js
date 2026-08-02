const { pool } = require('../config/db');

class FraudModel {
  static async createCase({ partner_id, order_id, fraud_type, risk_score, severity, reason, gps_data, device_data, status = 'pending' }) {
    const query = `
      INSERT INTO fraud_cases 
        (partner_id, order_id, fraud_type, risk_score, severity, reason, gps_data, device_data, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      partner_id || null,
      order_id || null,
      fraud_type,
      risk_score,
      severity,
      reason,
      JSON.stringify(gps_data || {}),
      JSON.stringify(device_data || {}),
      status
    ];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async createLog({ case_id, event, details }) {
    const query = `
      INSERT INTO fraud_logs (case_id, event, details)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [case_id || null, event, JSON.stringify(details || {})];
    const res = await pool.query(query, values);
    return res.rows[0];
  }

  static async getPartnerCases(partner_id, limit = 50) {
    const query = `
      SELECT * FROM fraud_cases
      WHERE partner_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const res = await pool.query(query, [partner_id, limit]);
    return res.rows;
  }

  static async getPartnerCurrentRiskScore(partner_id) {
    // Calculate total cumulative active risk score in the last 7 days
    const query = `
      SELECT COALESCE(SUM(risk_score), 0) as current_score
      FROM fraud_cases
      WHERE partner_id = $1 
        AND status IN ('pending', 'under_review', 'blocked', 'suspended')
        AND created_at >= NOW() - INTERVAL '7 days'
    `;
    const res = await pool.query(query, [partner_id]);
    const rawScore = parseInt(res.rows[0]?.current_score || '0', 10);
    return Math.min(100, Math.max(0, rawScore));
  }

  static async getPartnerFraudStatus(partner_id) {
    const score = await this.getPartnerCurrentRiskScore(partner_id);
    let severity = 'Low';
    if (score >= 81) severity = 'Critical';
    else if (score >= 61) severity = 'High';
    else if (score >= 31) severity = 'Medium';

    // Get active restriction status if any
    const activeCaseRes = await pool.query(
      `SELECT * FROM fraud_cases 
       WHERE partner_id = $1 AND status IN ('blocked', 'suspended', 'under_review')
       ORDER BY created_at DESC LIMIT 1`,
      [partner_id]
    );

    const activeCase = activeCaseRes.rows[0] || null;

    return {
      partner_id,
      risk_score: score,
      severity,
      is_blocked: score >= 61 || activeCase?.status === 'blocked',
      is_suspended: score >= 81 || activeCase?.status === 'suspended',
      restriction_status: activeCase ? activeCase.status : 'active',
      active_case: activeCase
    };
  }

  static async getAllCases({ risk_level, partner_id, order_id, reason, status, limit = 50, offset = 0 }) {
    let whereClauses = [];
    let values = [];
    let idx = 1;

    if (risk_level) {
      whereClauses.push(`fc.severity = $${idx++}`);
      values.push(risk_level);
    }
    if (partner_id) {
      whereClauses.push(`fc.partner_id = $${idx++}`);
      values.push(partner_id);
    }
    if (order_id) {
      whereClauses.push(`fc.order_id = $${idx++}`);
      values.push(order_id);
    }
    if (reason) {
      whereClauses.push(`fc.reason ILIKE $${idx++}`);
      values.push(`%${reason}%`);
    }
    if (status) {
      whereClauses.push(`fc.status = $${idx++}`);
      values.push(status);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        fc.*,
        u.full_name as partner_name,
        u.email as partner_email,
        u.phone_number as partner_phone,
        rb.full_name as resolved_by_name
      FROM fraud_cases fc
      LEFT JOIN users u ON fc.partner_id = u.id
      LEFT JOIN users rb ON fc.resolved_by = rb.id
      ${whereStr}
      ORDER BY fc.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    values.push(limit, offset);
    const res = await pool.query(query, values);
    return res.rows;
  }

  static async getCaseById(case_id) {
    const query = `
      SELECT 
        fc.*,
        u.full_name as partner_name,
        u.email as partner_email,
        u.phone_number as partner_phone,
        rb.full_name as resolved_by_name
      FROM fraud_cases fc
      LEFT JOIN users u ON fc.partner_id = u.id
      LEFT JOIN users rb ON fc.resolved_by = rb.id
      WHERE fc.id = $1
    `;
    const res = await pool.query(query, [case_id]);
    if (!res.rows[0]) return null;

    // Fetch associated logs
    const logsRes = await pool.query(
      `SELECT * FROM fraud_logs WHERE case_id = $1 ORDER BY created_at ASC`,
      [case_id]
    );

    return {
      ...res.rows[0],
      logs: logsRes.rows
    };
  }

  static async updateCaseStatus(case_id, { status, resolved_by, resolution_notes }) {
    const resolvedAt = ['resolved', 'dismissed'].includes(status) ? new Date() : null;
    const query = `
      UPDATE fraud_cases
      SET status = $1,
          resolved_by = COALESCE($2, resolved_by),
          resolved_at = CASE WHEN $3::timestamp IS NOT NULL THEN $3::timestamp ELSE resolved_at END
      WHERE id = $4
      RETURNING *
    `;
    const res = await pool.query(query, [status, resolved_by || null, resolvedAt, case_id]);
    const updatedCase = res.rows[0];

    if (updatedCase) {
      await this.createLog({
        case_id,
        event: `STATUS_CHANGE_${status.toUpperCase()}`,
        details: { resolved_by, notes: resolution_notes || '' }
      });
    }

    return updatedCase;
  }

  static async getRules() {
    const res = await pool.query(`SELECT * FROM fraud_rules ORDER BY rule_name ASC`);
    return res.rows;
  }

  static async updateRule(id, { threshold, enabled }) {
    const query = `
      UPDATE fraud_rules
      SET threshold = COALESCE($1, threshold),
          enabled = COALESCE($2, enabled)
      WHERE id = $3
      RETURNING *
    `;
    const res = await pool.query(query, [threshold, enabled, id]);
    return res.rows[0];
  }
}

module.exports = FraudModel;
