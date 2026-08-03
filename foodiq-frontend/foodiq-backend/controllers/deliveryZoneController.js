const { pool } = require('../config/db');
const { emitZoneChanged } = require('../socket/emitters');
const { ok, fail } = require('../utils/respond');
const { log } = require('../utils/logger');
const {
  isPointInZone,
  distanceToZoneBoundaryMeters,
  getNearestZone,
  isValidCoordinate,
} = require('../services/geoZoneService');

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ADMIN CONTROLLER ACTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 */

// POST /api/admin/delivery-zones
async function createZone(req, res) {
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
      priority = 0,
    } = req.body;

    const polyJson = polygon ? (typeof polygon === 'string' ? polygon : JSON.stringify(polygon)) : null;
    const createdBy = req.user?.id || null;

    const result = await pool.query(
      `INSERT INTO delivery_zones (
        name, city, state, country, polygon, center_latitude, center_longitude, radius_km, zone_type, is_active, priority, created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $12)
      RETURNING *`,
      [
        name,
        city,
        state || null,
        country,
        polyJson,
        center_latitude != null ? Number(center_latitude) : null,
        center_longitude != null ? Number(center_longitude) : null,
        radius_km != null ? Number(radius_km) : null,
        zone_type,
        is_active,
        Number(priority) || 0,
        createdBy,
      ]
    );

    const zone = result.rows[0];
    emitZoneChanged({ action: 'created', zone });

    return ok(res, 'Delivery zone created successfully', zone, 201);
  } catch (err) {
    log.error('[deliveryZoneController] createZone error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to create delivery zone', err);
  }
}

// GET /api/admin/delivery-zones
async function getZones(req, res) {
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
       ORDER BY z.priority DESC, z.created_at DESC
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
    log.error('[deliveryZoneController] getZones error', { error: err.message });
    return fail(res, 500, 'Failed to fetch delivery zones', err);
  }
}

// PATCH /api/admin/delivery-zones/:id
async function updateZone(req, res) {
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
      priority,
    } = req.body;

    const existing = await pool.query(`SELECT id FROM delivery_zones WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return fail(res, 404, 'Delivery zone not found');
    }

    const polyJson = polygon ? (typeof polygon === 'string' ? polygon : JSON.stringify(polygon)) : null;
    const updatedBy = req.user?.id || null;

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
        priority = COALESCE($11, priority),
        updated_by = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
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
        priority !== undefined ? Number(priority) : null,
        updatedBy,
        id,
      ]
    );

    const updatedZone = result.rows[0];
    emitZoneChanged({ action: 'updated', zone: updatedZone });

    return ok(res, 'Delivery zone updated successfully', updatedZone);
  } catch (err) {
    log.error('[deliveryZoneController] updateZone error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to update delivery zone', err);
  }
}

// DELETE /api/admin/delivery-zones/:id
async function deleteZone(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM delivery_zones WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return fail(res, 404, 'Delivery zone not found');
    }

    emitZoneChanged({ action: 'deleted', zone_id: id });

    return ok(res, 'Delivery zone deleted successfully', { success: true, deleted_id: id });
  } catch (err) {
    log.error('[deliveryZoneController] deleteZone error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to delete delivery zone', err);
  }
}

// POST /api/admin/delivery-zones/:id/assign-partner
async function assignPartner(req, res) {
  try {
    const { id: zone_id } = req.params;
    const { partner_id } = req.body;
    const assigned_by = req.user?.id || null;

    const zoneCheck = await pool.query(`SELECT id, name FROM delivery_zones WHERE id = $1`, [zone_id]);
    if (zoneCheck.rows.length === 0) {
      return fail(res, 404, 'Delivery zone not found');
    }

    const result = await pool.query(
      `INSERT INTO delivery_partner_zones (partner_id, zone_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (partner_id, zone_id) DO UPDATE SET assigned_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [partner_id, zone_id, assigned_by]
    );

    emitZoneChanged({ action: 'assigned', zone: zoneCheck.rows[0], partner_id });

    return ok(res, 'Partner assigned to delivery zone successfully', result.rows[0]);
  } catch (err) {
    if (err.code === '23503') {
      return fail(res, 400, 'Invalid delivery partner — that partner does not exist', err);
    }
    log.error('[deliveryZoneController] assignPartner error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to assign partner', err);
  }
}

// DELETE /api/admin/delivery-zones/:id/remove-partner
async function removePartner(req, res) {
  try {
    const { id: zone_id } = req.params;
    const { partner_id } = req.body;

    const result = await pool.query(
      `DELETE FROM delivery_partner_zones WHERE zone_id = $1 AND partner_id = $2 RETURNING *`,
      [zone_id, partner_id]
    );

    if (result.rows.length === 0) {
      return fail(res, 404, 'Partner zone assignment not found');
    }

    emitZoneChanged({ action: 'partner_removed', zone_id, partner_id });

    return ok(res, 'Partner removed from delivery zone successfully', { success: true });
  } catch (err) {
    log.error('[deliveryZoneController] removePartner error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to remove partner', err);
  }
}

// GET /api/admin/delivery-zones/:id/partners - Riders currently assigned to a zone
async function getZonePartners(req, res) {
  try {
    const { id: zone_id } = req.params;
    const result = await pool.query(
      `SELECT dp.id, dp.full_name, dp.email, dp.phone_number, dp.is_online, dpz.assigned_at
       FROM delivery_partner_zones dpz
       JOIN delivery_partners dp ON dp.id = dpz.partner_id
       WHERE dpz.zone_id = $1
       ORDER BY dpz.assigned_at DESC`,
      [zone_id]
    );
    return ok(res, 'Zone partners fetched', result.rows);
  } catch (err) {
    log.error('[deliveryZoneController] getZonePartners error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch zone partners', err);
  }
}

// GET /api/admin/delivery-zones/violations
async function getZoneViolations(req, res) {
  try {
    const { partner_id, zone_id, resolved, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = ['1=1'];
    const params = [];
    if (partner_id) {
      params.push(partner_id);
      where.push(`v.partner_id = $${params.length}`);
    }
    if (zone_id) {
      params.push(zone_id);
      where.push(`v.zone_id = $${params.length}`);
    }
    if (resolved !== undefined) {
      params.push(resolved === 'true');
      where.push(`v.resolved = $${params.length}`);
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM delivery_zone_violations v WHERE ${where.join(' AND ')}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    const dataParams = [...params, Number(limit), offset];
    const dataRes = await pool.query(
      `SELECT v.*, dp.full_name AS partner_name, dp.phone_number AS partner_phone, z.name AS zone_name
       FROM delivery_zone_violations v
       LEFT JOIN delivery_partners dp ON dp.id = v.partner_id
       LEFT JOIN delivery_zones z ON z.id = v.zone_id
       WHERE ${where.join(' AND ')}
       ORDER BY v.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    return ok(res, 'Zone violations fetched', {
      violations: dataRes.rows,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    log.error('[deliveryZoneController] getZoneViolations error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch zone violations', err);
  }
}

// PATCH /api/admin/delivery-zones/violations/:id/resolve
async function resolveViolation(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE delivery_zone_violations SET resolved = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      return fail(res, 404, 'Violation record not found');
    }
    return ok(res, 'Violation marked as resolved', result.rows[0]);
  } catch (err) {
    log.error('[deliveryZoneController] resolveViolation error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to resolve violation', err);
  }
}

// GET /api/admin/delivery-zones/live-riders
async function getLiveRiders(req, res) {
  try {
    const { rows: riders } = await pool.query(
      `SELECT dp.id, dp.full_name, dp.phone_number, dp.current_lat, dp.current_lng, dp.is_online, dp.is_available, dp.updated_at
       FROM delivery_partners dp
       WHERE dp.is_online = TRUE AND dp.current_lat IS NOT NULL AND dp.current_lng IS NOT NULL
       ORDER BY dp.updated_at DESC`
    );

    const { rows: allZones } = await pool.query(`SELECT * FROM delivery_zones WHERE is_active = TRUE`);
    const partnerIds = riders.map((r) => r.id);
    const { rows: assignments } = await pool.query(
      `SELECT partner_id, zone_id FROM delivery_partner_zones WHERE partner_id = ANY($1::uuid[])`,
      [partnerIds]
    );

    const assignedZoneIdsByPartner = new Map();
    assignments.forEach((a) => {
      if (!assignedZoneIdsByPartner.has(a.partner_id)) assignedZoneIdsByPartner.set(a.partner_id, []);
      assignedZoneIdsByPartner.get(a.partner_id).push(a.zone_id);
    });

    const liveRiders = riders.map((rider) => {
      const assignedIds = assignedZoneIdsByPartner.get(rider.id) || [];
      const assignedZones = allZones.filter((z) => assignedIds.includes(z.id));
      let inZone = false;
      let currentZone = null;
      for (const zone of assignedZones) {
        if (isPointInZone(rider.current_lat, rider.current_lng, zone)) {
          inZone = true;
          currentZone = zone;
          break;
        }
      }
      return {
        partner_id: rider.id,
        full_name: rider.full_name,
        phone_number: rider.phone_number,
        lat: Number(rider.current_lat),
        lng: Number(rider.current_lng),
        is_available: rider.is_available,
        last_updated: rider.updated_at,
        assigned_zones_count: assignedZones.length,
        in_zone: assignedZones.length === 0 ? null : inZone,
        current_zone: currentZone,
      };
    });

    return ok(res, 'Live riders fetched', { riders: liveRiders });
  } catch (err) {
    log.error('[deliveryZoneController] getLiveRiders error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch live riders', err);
  }
}

// GET /api/admin/delivery-zones/heatmap
async function getZoneHeatmap(req, res) {
  try {
    const { hours = 24 } = req.query;
    const hoursNum = Math.min(168, Math.max(1, Number(hours) || 24));

    const { rows: activityPoints } = await pool.query(
      `SELECT ROUND(latitude::numeric, 3) AS lat, ROUND(longitude::numeric, 3) AS lng, COUNT(*)::int AS weight
       FROM delivery_locations
       WHERE created_at >= NOW() - ($1 || ' hours')::interval
       GROUP BY 1, 2
       ORDER BY weight DESC
       LIMIT 500`,
      [hoursNum]
    );

    const { rows: violationPoints } = await pool.query(
      `SELECT ROUND(latitude::numeric, 3) AS lat, ROUND(longitude::numeric, 3) AS lng, COUNT(*)::int AS weight
       FROM delivery_zone_violations
       WHERE created_at >= NOW() - ($1 || ' hours')::interval AND latitude IS NOT NULL AND longitude IS NOT NULL
       GROUP BY 1, 2
       ORDER BY weight DESC
       LIMIT 500`,
      [hoursNum]
    );

    return ok(res, 'Zone heatmap data fetched', {
      activity_points: activityPoints,
      violation_points: violationPoints,
      window_hours: hoursNum,
    });
  } catch (err) {
    log.error('[deliveryZoneController] getZoneHeatmap error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch zone heatmap', err);
  }
}

// GET /api/admin/delivery-zones/:id/analytics
async function getZoneAnalytics(req, res) {
  try {
    const { id } = req.params;

    const zoneRes = await pool.query(`SELECT * FROM delivery_zones WHERE id = $1`, [id]);
    if (zoneRes.rows.length === 0) {
      return fail(res, 404, 'Delivery zone not found');
    }
    const zone = zoneRes.rows[0];

    const assignedRes = await pool.query(
      `SELECT dp.id, dp.full_name, dp.current_lat, dp.current_lng, dp.is_online
       FROM delivery_partner_zones dpz
       JOIN delivery_partners dp ON dp.id = dpz.partner_id
       WHERE dpz.zone_id = $1`,
      [id]
    );
    const assignedPartners = assignedRes.rows;

    const activeNow = assignedPartners.filter(
      (p) => p.is_online && p.current_lat != null && p.current_lng != null && isPointInZone(p.current_lat, p.current_lng, zone)
    ).length;

    const violationsRes = await pool.query(
      `SELECT violation_type, COUNT(*)::int AS count
       FROM delivery_zone_violations
       WHERE zone_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY violation_type`,
      [id]
    );

    return ok(res, 'Zone analytics fetched', {
      zone,
      assigned_riders_count: assignedPartners.length,
      active_riders_now: activeNow,
      violations_last_30_days: violationsRes.rows,
    });
  } catch (err) {
    log.error('[deliveryZoneController] getZoneAnalytics error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch zone analytics', err);
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DELIVERY PARTNER CONTROLLER ACTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 */

// GET /api/delivery/zones - List assigned zones for authenticated rider
async function getAssignedZones(req, res) {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return fail(res, 401, 'Partner authentication required');
    }

    const result = await pool.query(
      `SELECT z.*, dpz.assigned_at
       FROM delivery_zones z
       INNER JOIN delivery_partner_zones dpz ON dpz.zone_id = z.id
       WHERE dpz.partner_id = $1 AND z.is_active = TRUE
       ORDER BY z.priority DESC, z.name ASC`,
      [partnerId]
    );

    return ok(res, 'Assigned delivery zones fetched', result.rows);
  } catch (err) {
    log.error('[deliveryZoneController] getAssignedZones error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch assigned zones', err);
  }
}

// GET /api/delivery/current-zone - Detect current zone for rider based on GPS
async function getCurrentZone(req, res) {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return fail(res, 401, 'Partner authentication required');
    }

    const { latitude, longitude } = req.query;
    let lat = latitude != null && latitude !== '' ? Number(latitude) : null;
    let lng = longitude != null && longitude !== '' ? Number(longitude) : null;

    if (!isValidCoordinate(lat, lng)) {
      // Fall back to the partner's last known GPS ping persisted from the live location stream.
      const partnerRes = await pool.query(
        `SELECT current_lat, current_lng FROM delivery_partners WHERE id = $1`,
        [partnerId]
      );
      const row = partnerRes.rows[0];
      lat = row?.current_lat != null ? Number(row.current_lat) : null;
      lng = row?.current_lng != null ? Number(row.current_lng) : null;
    }

    if (!isValidCoordinate(lat, lng)) {
      return fail(res, 400, 'Latitude and longitude are required to evaluate current zone. Enable location access and try again.');
    }

    // Fetch partner's assigned zones
    const assignedRes = await pool.query(
      `SELECT z.*
       FROM delivery_zones z
       INNER JOIN delivery_partner_zones dpz ON dpz.zone_id = z.id
       WHERE dpz.partner_id = $1 AND z.is_active = TRUE
       ORDER BY z.priority DESC`,
      [partnerId]
    );
    const assignedZones = assignedRes.rows;

    let inAssignedZone = false;
    let currentZone = null;
    for (const zone of assignedZones) {
      if (isPointInZone(lat, lng, zone)) {
        inAssignedZone = true;
        currentZone = zone;
        break;
      }
    }

    const nearest = !inAssignedZone && assignedZones.length > 0 ? getNearestZone(lat, lng, assignedZones) : null;
    const minDistanceToBoundary = inAssignedZone ? 0 : (nearest?.distance_meters ?? Infinity);

    let warningLevel = 'none';
    if (!inAssignedZone && assignedZones.length > 0) {
      if (minDistanceToBoundary >= 300) {
        warningLevel = 'second_warning';
      } else if (minDistanceToBoundary >= 100) {
        warningLevel = 'first_warning';
      }
    }

    // Business rule: inside an assigned zone -> eligible for orders. Unassigned riders remain
    // unrestricted (mirrors the existing getAllowedOrders fallback for partners with no zone).
    const ordersEligible = assignedZones.length === 0 ? true : inAssignedZone;

    return ok(res, 'Current zone status fetched', {
      in_zone: inAssignedZone,
      current_zone: currentZone,
      nearest_zone: nearest?.zone || null,
      distance_to_boundary_meters: Number.isFinite(minDistanceToBoundary) ? Math.round(minDistanceToBoundary) : null,
      warning_level: warningLevel,
      assigned_zones_count: assignedZones.length,
      orders_eligible: ordersEligible,
    });
  } catch (err) {
    log.error('[deliveryZoneController] getCurrentZone error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch current zone', err);
  }
}

// GET /api/delivery/zones/nearby - Nearby active zones regardless of assignment
async function getNearbyZones(req, res) {
  try {
    const partnerId = req.deliveryPartner?.id || req.user?.id;
    if (!partnerId) {
      return fail(res, 401, 'Partner authentication required');
    }

    const { latitude, longitude, radius_km = 10 } = req.query;
    let lat = latitude != null && latitude !== '' ? Number(latitude) : null;
    let lng = longitude != null && longitude !== '' ? Number(longitude) : null;

    if (!isValidCoordinate(lat, lng)) {
      const partnerRes = await pool.query(
        `SELECT current_lat, current_lng FROM delivery_partners WHERE id = $1`,
        [partnerId]
      );
      const row = partnerRes.rows[0];
      lat = row?.current_lat != null ? Number(row.current_lat) : null;
      lng = row?.current_lng != null ? Number(row.current_lng) : null;
    }

    if (!isValidCoordinate(lat, lng)) {
      return fail(res, 400, 'Latitude and longitude are required to find nearby zones.');
    }

    const radiusKm = Math.max(0.1, Number(radius_km) || 10);
    const radiusMeters = radiusKm * 1000;

    const { rows: allZones } = await pool.query(
      `SELECT * FROM delivery_zones WHERE is_active = TRUE ORDER BY priority DESC`
    );

    const nearby = allZones
      .map((zone) => {
        const inside = isPointInZone(lat, lng, zone);
        const distance = inside ? 0 : distanceToZoneBoundaryMeters(lat, lng, zone);
        return { ...zone, distance_meters: Math.round(distance), is_inside: inside };
      })
      .filter((z) => z.is_inside || z.distance_meters <= radiusMeters)
      .sort((a, b) => a.distance_meters - b.distance_meters);

    return ok(res, 'Nearby delivery zones fetched', { zones: nearby, radius_km: radiusKm });
  } catch (err) {
    log.error('[deliveryZoneController] getNearbyZones error', { error: err.message });
    return fail(res, err.status || 500, err.message || 'Failed to fetch nearby zones', err);
  }
}

// GET /api/delivery/allowed-orders - List orders inside partner's assigned zones
async function getAllowedOrders(req, res) {
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

    // Fetch unassigned orders available for pickup.
    // NOTE: `restaurants` only has current_lat/current_lng (no plain latitude/longitude column),
    // and an order's drop-off coordinates live on the joined `addresses` row, not on `orders` itself.
    const ordersRes = await pool.query(
      `SELECT o.*, r.name AS restaurant_name, r.address AS restaurant_address,
              r.current_lat AS restaurant_lat, r.current_lng AS restaurant_lng,
              a.lat AS delivery_lat, a.lng AS delivery_lng
       FROM orders o
       LEFT JOIN restaurants r ON o.restaurant_id = r.id
       LEFT JOIN addresses a ON o.delivery_address_id = a.id
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
      const delivLat = order.delivery_lat;
      const delivLng = order.delivery_lng;

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
    log.error('[deliveryZoneController] getAllowedOrders error', { error: err.message });
    return fail(res, 500, 'Failed to fetch allowed orders', err);
  }
}

module.exports = {
  createZone,
  getZones,
  updateZone,
  deleteZone,
  assignPartner,
  removePartner,
  getZonePartners,
  getZoneViolations,
  resolveViolation,
  getLiveRiders,
  getZoneHeatmap,
  getZoneAnalytics,
  getAssignedZones,
  getCurrentZone,
  getNearbyZones,
  getAllowedOrders,
};
