const { pool } = require('../config/db');
const { getIO } = require('../socket');
const EVENTS = require('../socket/events');
const {
  isPointInZone,
  distanceToZoneBoundaryMeters,
} = require('../services/geoZoneService');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN CONTROLLER ACTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 */

// POST /api/admin/delivery-zones
async function createZone(req, res, next) {
  try {
    const {
      name,
      city,
      state,
      country = 'India',
      polygon,
      center_latitude,
      center_longitude,
      radius_km,
      zone_type = 'polygon',
      is_active = true,
    } = req.body;

    const polyJson = polygon ? (typeof polygon === 'string' ? polygon : JSON.stringify(polygon)) : null;

    const result = await pool.query(
      `INSERT INTO delivery_zones (
        name, city, state, country, polygon, center_latitude, center_longitude, radius_km, zone_type, is_active
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        name,
        city,
        state || null,
        country,
        polyJson,
        center_latitude ? Number(center_latitude) : null,
        center_longitude ? Number(center_longitude) : null,
        radius_km ? Number(radius_km) : null,
        zone_type,
        is_active,
      ]
    );

    const zone = result.rows[0];

    // Emit live update to admin room
    try {
      const io = getIO();
      if (io) {
        io.to('admin_live').emit(EVENTS.DELIVERY_ZONE_CHANGED, {
          action: 'created',
          zone,
        });
      }
    } catch {
      /* ignore */
    }

    return res.status(201).json({
      success: true,
      message: 'Delivery zone created successfully',
      data: zone,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/delivery-zones
async function getZones(req, res, next) {
  try {
    const { city, is_active, search, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereConditions = [];
    let params = [];
    let paramIdx = 1;

    if (city) {
      whereConditions.push(`city ILIKE $${paramIdx++}`);
      params.push(`%${city}%`);
    }

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramIdx++}`);
      params.push(is_active === 'true');
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIdx} OR city ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM delivery_zones ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const queryParams = [...params, Number(limit), offset];
    const dataRes = await pool.query(
      `SELECT z.*,
         COALESCE(
           (SELECT COUNT(*) FROM delivery_partner_zones dpz WHERE dpz.zone_id = z.id), 0
         )::int AS assigned_partners_count
       FROM delivery_zones z
       ${whereClause}
       ORDER BY z.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      queryParams
    );

    return res.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/delivery-zones/:id
async function updateZone(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      city,
      state,
      country,
      polygon,
      center_latitude,
      center_longitude,
      radius_km,
      zone_type,
      is_active,
    } = req.body;

    const existing = await pool.query(`SELECT * FROM delivery_zones WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery zone not found',
      });
    }

    const polyJson = polygon ? (typeof polygon === 'string' ? polygon : JSON.stringify(polygon)) : null;

    const result = await pool.query(
      `UPDATE delivery_zones SET
        name = COALESCE($1, name),
        city = COALESCE($2, city),
        state = COALESCE($3, state),
        country = COALESCE($4, country),
        polygon = COALESCE($5::jsonb, polygon),
        center_latitude = COALESCE($6, center_latitude),
        center_longitude = COALESCE($7, center_longitude),
        radius_km = COALESCE($8, radius_km),
        zone_type = COALESCE($9, zone_type),
        is_active = COALESCE($10, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        name,
        city,
        state,
        country,
        polyJson,
        center_latitude !== undefined ? Number(center_latitude) : null,
        center_longitude !== undefined ? Number(center_longitude) : null,
        radius_km !== undefined ? Number(radius_km) : null,
        zone_type,
        is_active,
        id,
      ]
    );

    const updatedZone = result.rows[0];

    try {
      const io = getIO();
      if (io) {
        io.to('admin_live').emit(EVENTS.DELIVERY_ZONE_CHANGED, {
          action: 'updated',
          zone: updatedZone,
        });
      }
    } catch {
      /* ignore */
    }

    return res.json({
      success: true,
      message: 'Delivery zone updated successfully',
      data: updatedZone,
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/delivery-zones/:id
async function deleteZone(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM delivery_zones WHERE id = $1 RETURNING *`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery zone not found',
      });
    }

    try {
      const io = getIO();
      if (io) {
        io.to('admin_live').emit(EVENTS.DELIVERY_ZONE_CHANGED, {
          action: 'deleted',
          zone_id: id,
        });
      }
    } catch {
      /* ignore */
    }

    return res.json({
      success: true,
      message: 'Delivery zone deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/delivery-zones/:id/assign-partner
async function assignPartner(req, res, next) {
  try {
    const { id: zone_id } = req.params;
    const { partner_id } = req.body;
    const assigned_by = req.user?.id || null;

    const zoneCheck = await pool.query(`SELECT id FROM delivery_zones WHERE id = $1`, [zone_id]);
    if (zoneCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Delivery zone not found' });
    }

    const result = await pool.query(
      `INSERT INTO delivery_partner_zones (partner_id, zone_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (partner_id, zone_id) DO UPDATE SET assigned_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [partner_id, zone_id, assigned_by]
    );

    return res.json({
      success: true,
      message: 'Partner assigned to delivery zone successfully',
      data: result.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/delivery-zones/:id/remove-partner
async function removePartner(req, res, next) {
  try {
    const { id: zone_id } = req.params;
    const { partner_id } = req.body;

    const result = await pool.query(
      `DELETE FROM delivery_partner_zones WHERE zone_id = $1 AND partner_id = $2 RETURNING *`,
      [zone_id, partner_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partner zone assignment not found',
      });
    }

    return res.json({
      success: true,
      message: 'Partner removed from delivery zone successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELIVERY PARTNER CONTROLLER ACTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 */

// GET /api/delivery/zones - List assigned zones for authenticated rider
async function getAssignedZones(req, res, next) {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return res.status(401).json({ success: false, message: 'Partner authentication required' });
    }

    const result = await pool.query(
      `SELECT z.*, dpz.assigned_at
       FROM delivery_zones z
       INNER JOIN delivery_partner_zones dpz ON dpz.zone_id = z.id
       WHERE dpz.partner_id = $1 AND z.is_active = TRUE
       ORDER BY z.name ASC`,
      [partnerId]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/delivery/current-zone - Detect current zone for rider based on GPS
async function getCurrentZone(req, res, next) {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    const { latitude, longitude } = req.query;

    const lat = latitude ? Number(latitude) : req.deliveryPartner?.current_lat;
    const lng = longitude ? Number(longitude) : req.deliveryPartner?.current_lng;

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required to evaluate current zone',
      });
    }

    // Fetch partner's assigned zones
    const assignedRes = await pool.query(
      `SELECT z.*
       FROM delivery_zones z
       INNER JOIN delivery_partner_zones dpz ON dpz.zone_id = z.id
       WHERE dpz.partner_id = $1 AND z.is_active = TRUE`,
      [partnerId]
    );

    const assignedZones = assignedRes.rows;

    let inAssignedZone = false;
    let currentZone = null;
    let minDistanceToBoundary = Infinity;

    for (const zone of assignedZones) {
      const inside = isPointInZone(lat, lng, zone);
      const dist = distanceToZoneBoundaryMeters(lat, lng, zone);
      if (inside) {
        inAssignedZone = true;
        currentZone = zone;
        minDistanceToBoundary = dist;
        break;
      } else if (dist < minDistanceToBoundary) {
        minDistanceToBoundary = dist;
      }
    }

    // Determine warning status based on distance outside assigned zone
    let warningLevel = 'none';
    if (!inAssignedZone) {
      if (minDistanceToBoundary >= 300) {
        warningLevel = 'second_warning';
      } else if (minDistanceToBoundary >= 100) {
        warningLevel = 'first_warning';
      }
    }

    return res.json({
      success: true,
      data: {
        in_zone: inAssignedZone,
        current_zone: currentZone,
        distance_to_boundary_meters: Math.round(minDistanceToBoundary),
        warning_level: warningLevel,
        assigned_zones_count: assignedZones.length,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/delivery/allowed-orders - List orders inside partner's assigned zones
async function getAllowedOrders(req, res, next) {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;

    // Get partner's active assigned zones
    const zonesRes = await pool.query(
      `SELECT z.*
       FROM delivery_zones z
       INNER JOIN delivery_partner_zones dpz ON dpz.zone_id = z.id
       WHERE dpz.partner_id = $1 AND z.is_active = TRUE`,
      [partnerId]
    );

    const assignedZones = zonesRes.rows;

    // Fetch unassigned orders available for pickup
    const ordersRes = await pool.query(
      `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.latitude as restaurant_lat, r.longitude as restaurant_lng
       FROM orders o
       LEFT JOIN restaurants r ON o.restaurant_id = r.id
       WHERE o.status IN ('ready_for_pickup', 'accepted', 'preparing')
         AND (o.delivery_partner_id IS NULL OR o.delivery_partner_id = $1)
       ORDER BY o.created_at DESC`,
      [partnerId]
    );

    const allOrders = ordersRes.rows;

    // If partner has no assigned zones, allow viewing all orders (fallback / admin unassigned mode)
    if (assignedZones.length === 0) {
      return res.json({
        success: true,
        data: allOrders,
        filter_applied: false,
      });
    }

    // Filter orders whose restaurant or delivery location is inside at least 1 assigned zone
    const allowedOrders = allOrders.filter((order) => {
      const restLat = order.restaurant_lat;
      const restLng = order.restaurant_lng;
      const delivLat = order.delivery_latitude;
      const delivLng = order.delivery_longitude;

      return assignedZones.some((zone) => {
        const restIn = restLat != null && restLng != null && isPointInZone(restLat, restLng, zone);
        const delivIn = delivLat != null && delivLng != null && isPointInZone(delivLat, delivLng, zone);
        return restIn || delivIn;
      });
    });

    return res.json({
      success: true,
      data: allowedOrders,
      filter_applied: true,
      assigned_zones_count: assignedZones.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createZone,
  getZones,
  updateZone,
  deleteZone,
  assignPartner,
  removePartner,
  getAssignedZones,
  getCurrentZone,
  getAllowedOrders,
};
