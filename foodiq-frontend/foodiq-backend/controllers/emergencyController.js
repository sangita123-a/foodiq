const { pool } = require('../config/db');
const { validationResult } = require('express-validator');
const { writeAudit } = require('../services/auditService');
const {
  emitEmergencyNew,
  emitEmergencyUpdate,
  emitEmergencyResolved,
  emitEmergencyCancelled,
} = require('../socket/emitters');

const fail = (res, status, message, error = {}) =>
  res.status(status).json({ success: false, message, error });

/**
 * Helper to fetch full emergency details with delivery partner, order, restaurant, and customer info.
 */
async function fetchEmergencyById(id) {
  const { rows } = await pool.query(
    `SELECT
       e.*,
       dp.full_name AS partner_name,
       dp.phone_number AS partner_phone,
       dp.vehicle_type,
       dp.vehicle_number,
       dp.profile_photo AS partner_photo,
       o.order_number,
       o.status AS order_status,
       o.total_amount AS order_total,
       o.delivery_address AS customer_address,
       u.full_name AS customer_name,
       u.phone_number AS customer_phone,
       r.name AS restaurant_name,
       r.phone AS restaurant_phone,
       r.address AS restaurant_address,
       r.latitude AS restaurant_lat,
       r.longitude AS restaurant_lng,
       rb.full_name AS resolver_name
     FROM delivery_emergencies e
     JOIN delivery_partners dp ON e.partner_id = dp.id
     LEFT JOIN orders o ON e.order_id = o.id
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN restaurants r ON o.restaurant_id = r.id
     LEFT JOIN users rb ON e.resolved_by = rb.id
     WHERE e.id = $1`,
    [id]
  );
  return rows[0] || null;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * DELIVERY PARTNER CONTROLLERS
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * POST /api/delivery/emergency
 * Create a new emergency SOS alert.
 * Business rules:
 * - Delivery partner only.
 * - Only 1 active emergency allowed.
 * - Current active assigned order linked automatically.
 * - Instant socket emission + admin notification.
 */
const createEmergency = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, 400, 'Validation failed', errors.array());
    }

    const partnerId = req.deliveryPartner.id;
    const {
      reason,
      description,
      latitude,
      longitude,
      accuracy,
      battery_level,
      network_type,
      device_info,
    } = req.body;

    // Check if partner already has an ACTIVE emergency
    const activeCheck = await pool.query(
      `SELECT id FROM delivery_emergencies WHERE partner_id = $1 AND status = 'active' LIMIT 1`,
      [partnerId]
    );

    if (activeCheck.rows.length > 0) {
      return fail(
        res,
        400,
        'Active emergency already exists. Resolve or cancel current emergency before creating another.',
        { active_emergency_id: activeCheck.rows[0].id }
      );
    }

    // Automatically link partner's active order (status in assigned/reached_restaurant/picked_up/out_for_delivery)
    const activeOrderQuery = await pool.query(
      `SELECT id FROM orders
       WHERE delivery_partner_id = $1
         AND status IN ('Assigned', 'Reached Restaurant', 'Picked Up', 'Out for Delivery', 'on_the_way')
       ORDER BY updated_at DESC LIMIT 1`,
      [partnerId]
    );
    const orderId = activeOrderQuery.rows[0]?.id || null;

    // Also update partner's latest GPS in delivery_partners table
    await pool.query(
      `UPDATE delivery_partners
       SET current_lat = $1, current_lng = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [latitude, longitude, partnerId]
    );

    // Insert delivery emergency
    const insertRes = await pool.query(
      `INSERT INTO delivery_emergencies (
         partner_id, order_id, latitude, longitude, accuracy,
         battery_level, network_type, device_info, reason, description, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, 'active')
       RETURNING id`,
      [
        partnerId,
        orderId,
        latitude,
        longitude,
        accuracy || null,
        battery_level != null ? Number(battery_level) : null,
        network_type || null,
        JSON.stringify(device_info || {}),
        reason,
        description || null,
      ]
    );

    const emergencyId = insertRes.rows[0].id;
    const emergencyDetails = await fetchEmergencyById(emergencyId);

    // Socket emission to admin room & partner room
    emitEmergencyNew(emergencyDetails);

    // Audit log
    await writeAudit({
      userId: partnerId,
      role: 'delivery_partner',
      action: 'sos_emergency_created',
      category: 'emergency',
      resourceType: 'delivery_emergency',
      resourceId: emergencyId,
      status: 'success',
      message: `Emergency SOS reported: ${reason}`,
      req,
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'SOS Emergency alert broadcasted successfully to administrators.',
      data: emergencyDetails,
    });
  } catch (error) {
    console.error('[EmergencyController] createEmergency error:', error);
    return fail(res, 500, 'Failed to process emergency alert', error.message);
  }
};

/**
 * GET /api/delivery/emergency/active
 * Returns current active emergency for delivery partner.
 */
const getActiveEmergency = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const { rows } = await pool.query(
      `SELECT id FROM delivery_emergencies WHERE partner_id = $1 AND status = 'active' LIMIT 1`,
      [partnerId]
    );

    if (rows.length === 0) {
      return res.json({ success: true, data: null });
    }

    const details = await fetchEmergencyById(rows[0].id);
    return res.json({ success: true, data: details });
  } catch (error) {
    console.error('[EmergencyController] getActiveEmergency error:', error);
    return fail(res, 500, 'Failed to fetch active emergency', error.message);
  }
};

/**
 * GET /api/delivery/emergency/history
 * Returns paginated emergency history for delivery partner.
 */
const getEmergencyHistory = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM delivery_emergencies WHERE partner_id = $1`,
      [partnerId]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const { rows } = await pool.query(
      `SELECT
         e.*,
         o.order_number,
         o.status AS order_status
       FROM delivery_emergencies e
       LEFT JOIN orders o ON e.order_id = o.id
       WHERE e.partner_id = $1
       ORDER BY e.created_at DESC
       LIMIT $2 OFFSET $3`,
      [partnerId, limit, offset]
    );

    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[EmergencyController] getEmergencyHistory error:', error);
    return fail(res, 500, 'Failed to fetch emergency history', error.message);
  }
};

/**
 * PATCH /api/delivery/emergency/cancel
 * Delivery partner cancels active emergency.
 */
const cancelEmergency = async (req, res) => {
  try {
    const partnerId = req.deliveryPartner.id;
    const activeRes = await pool.query(
      `SELECT id FROM delivery_emergencies WHERE partner_id = $1 AND status = 'active' LIMIT 1`,
      [partnerId]
    );

    if (activeRes.rows.length === 0) {
      return fail(res, 404, 'No active emergency found to cancel');
    }

    const emergencyId = activeRes.rows[0].id;
    await pool.query(
      `UPDATE delivery_emergencies
       SET status = 'cancelled', resolved_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [emergencyId]
    );

    const updatedDetails = await fetchEmergencyById(emergencyId);
    emitEmergencyCancelled(updatedDetails);

    await writeAudit({
      userId: partnerId,
      role: 'delivery_partner',
      action: 'sos_emergency_cancelled',
      category: 'emergency',
      resourceType: 'delivery_emergency',
      resourceId: emergencyId,
      status: 'success',
      message: 'Delivery partner cancelled emergency alert',
      req,
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Emergency request cancelled',
      data: updatedDetails,
    });
  } catch (error) {
    console.error('[EmergencyController] cancelEmergency error:', error);
    return fail(res, 500, 'Failed to cancel emergency', error.message);
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
 * ADMIN CONTROLLERS
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/emergencies
 * List emergencies with search, filters (status, reason), and pagination.
 */
const getAdminEmergencies = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '15', 10)));
    const offset = (page - 1) * limit;

    const { status, reason, search } = req.query;
    const whereConditions = [];
    const params = [];
    let pIdx = 1;

    if (status) {
      whereConditions.push(`e.status = $${pIdx++}`);
      params.push(status);
    }
    if (reason) {
      whereConditions.push(`e.reason = $${pIdx++}`);
      params.push(reason);
    }
    if (search) {
      whereConditions.push(
        `(dp.full_name ILIKE $${pIdx} OR dp.phone_number ILIKE $${pIdx} OR o.order_number ILIKE $${pIdx})`
      );
      params.push(`%${search}%`);
      pIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*)
      FROM delivery_emergencies e
      JOIN delivery_partners dp ON e.partner_id = dp.id
      LEFT JOIN orders o ON e.order_id = o.id
      ${whereClause}
    `;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    const listQuery = `
      SELECT
        e.*,
        dp.full_name AS partner_name,
        dp.phone_number AS partner_phone,
        dp.vehicle_type,
        dp.vehicle_number,
        o.order_number,
        o.status AS order_status
      FROM delivery_emergencies e
      JOIN delivery_partners dp ON e.partner_id = dp.id
      LEFT JOIN orders o ON e.order_id = o.id
      ${whereClause}
      ORDER BY
        CASE WHEN e.status = 'active' THEN 0 ELSE 1 END,
        e.created_at DESC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(listQuery, params);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[EmergencyController] getAdminEmergencies error:', error);
    return fail(res, 500, 'Failed to fetch emergency list', error.message);
  }
};

/**
 * GET /api/admin/emergencies/:id
 * Detailed emergency information for Admin dashboard view.
 */
const getAdminEmergencyById = async (req, res) => {
  try {
    const { id } = req.params;
    const details = await fetchEmergencyById(id);

    if (!details) {
      return fail(res, 404, 'Emergency record not found');
    }

    return res.json({ success: true, data: details });
  } catch (error) {
    console.error('[EmergencyController] getAdminEmergencyById error:', error);
    return fail(res, 500, 'Failed to fetch emergency details', error.message);
  }
};

/**
 * PATCH /api/admin/emergencies/:id/resolve
 * Admin marks emergency as resolved.
 */
const resolveAdminEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const existing = await pool.query(
      `SELECT id, status FROM delivery_emergencies WHERE id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return fail(res, 404, 'Emergency record not found');
    }

    if (existing.rows[0].status === 'resolved') {
      return fail(res, 400, 'Emergency is already resolved');
    }

    await pool.query(
      `UPDATE delivery_emergencies
       SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1
       WHERE id = $2`,
      [adminId, id]
    );

    const updatedDetails = await fetchEmergencyById(id);
    emitEmergencyResolved(updatedDetails);

    await writeAudit({
      userId: adminId,
      role: 'admin',
      action: 'sos_emergency_resolved',
      category: 'emergency',
      resourceType: 'delivery_emergency',
      resourceId: id,
      status: 'success',
      message: `Emergency #${id} marked as resolved by admin`,
      req,
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Emergency resolved successfully',
      data: updatedDetails,
    });
  } catch (error) {
    console.error('[EmergencyController] resolveAdminEmergency error:', error);
    return fail(res, 500, 'Failed to resolve emergency', error.message);
  }
};

/**
 * PATCH /api/admin/emergencies/:id/escalate
 * Admin escalates emergency (e.g. alerts senior management/emergency services).
 */
const escalateAdminEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const existing = await fetchEmergencyById(id);
    if (!existing) {
      return fail(res, 404, 'Emergency record not found');
    }

    const updatedDetails = {
      ...existing,
      escalated: true,
      escalated_at: new Date().toISOString(),
    };

    emitEmergencyUpdate(updatedDetails);

    await writeAudit({
      userId: adminId,
      role: 'admin',
      action: 'sos_emergency_escalated',
      category: 'emergency',
      resourceType: 'delivery_emergency',
      resourceId: id,
      status: 'success',
      message: `Emergency #${id} escalated to priority alert`,
      req,
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Emergency alert escalated to highest priority',
      data: updatedDetails,
    });
  } catch (error) {
    console.error('[EmergencyController] escalateAdminEmergency error:', error);
    return fail(res, 500, 'Failed to escalate emergency', error.message);
  }
};

module.exports = {
  createEmergency,
  getActiveEmergency,
  getEmergencyHistory,
  cancelEmergency,
  getAdminEmergencies,
  getAdminEmergencyById,
  resolveAdminEmergency,
  escalateAdminEmergency,
};
