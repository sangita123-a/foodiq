/**
 * AI Route Optimization Engine — enterprise-grade multi-algorithm route optimizer.
 *
 * Algorithms: nearest-neighbor → 2-opt improvement → priority-weighted reordering
 * Routing:    OSRM (primary) → Haversine fallback
 * Storage:    optimized_routes, route_waypoints, route_history tables
 */
const { pool } = require('../config/db');
const { log } = require('../utils/logger');
const osrm = require('./osrmClient');

// ── Fuel constants ──────────────────────────────────────────────────────
const FUEL_KM_PER_LITER = {
  bike: 25,
  bicycle: 0, // no fuel
  scooter: 30,
  car: 12,
  ev: 0, // electric
};

// ── Haversine (kept for backward compat with old callers) ───────────
const dist = (a, b) => {
  const dx = Number(a.lat) - Number(b.lat);
  const dy = Number(a.lng) - Number(b.lng);
  return Math.sqrt(dx * dx + dy * dy);
};

// ── Priority scoring weights ────────────────────────────────────────
const PRIORITY_WEIGHTS = {
  sla_expiry: 0.40,
  customer_priority: 0.20,
  vip_express: 0.20,
  cod: 0.10,
  distance: 0.10,
};

// ── Traffic level from hour ─────────────────────────────────────────
function getTrafficLevel(now = new Date()) {
  const h = now.getHours();
  if ((h >= 8 && h <= 10) || (h >= 12 && h <= 14) || (h >= 18 && h <= 21)) return 'heavy';
  if ((h >= 7 && h <= 11) || (h >= 17 && h <= 22)) return 'moderate';
  return 'light';
}

function trafficMultiplier(level) {
  if (level === 'heavy') return 1.35;
  if (level === 'moderate') return 1.15;
  return 1.0;
}

// ── Nearest-Neighbor VRP heuristic ──────────────────────────────────
function nearestNeighborOrder(depot, stops) {
  if (!stops.length) return { order: [], totalDist: 0 };
  const remaining = [...stops];
  const order = [];
  let current = depot;
  let total = 0;

  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    remaining.forEach((s, i) => {
      const d = osrm.haversineKm(current.lat, current.lng, s.lat, s.lng);
      if (d < bestD) { bestD = d; bestIdx = i; }
    });
    const next = remaining.splice(bestIdx, 1)[0];
    total += bestD;
    order.push(next);
    current = next;
  }
  return { order, totalDist: total };
}

// ── 2-opt improvement ───────────────────────────────────────────────
function twoOptImprove(stops) {
  if (stops.length < 4) return stops;
  let improved = [...stops];
  let better = true;

  while (better) {
    better = false;
    for (let i = 1; i < improved.length - 2; i++) {
      for (let j = i + 1; j < improved.length - 1; j++) {
        const d1 =
          osrm.haversineKm(improved[i - 1].lat, improved[i - 1].lng, improved[i].lat, improved[i].lng) +
          osrm.haversineKm(improved[j].lat, improved[j].lng, improved[j + 1].lat, improved[j + 1].lng);
        const d2 =
          osrm.haversineKm(improved[i - 1].lat, improved[i - 1].lng, improved[j].lat, improved[j].lng) +
          osrm.haversineKm(improved[i].lat, improved[i].lng, improved[j + 1].lat, improved[j + 1].lng);
        if (d2 < d1) {
          const reversed = improved.slice(i, j + 1).reverse();
          improved = [...improved.slice(0, i), ...reversed, ...improved.slice(j + 1)];
          better = true;
        }
      }
    }
  }
  return improved;
}

// ── Priority-weighted reordering ────────────────────────────────────
function priorityWeightedScore(stop, depot) {
  let score = 0;
  // SLA expiry: orders closer to deadline get higher priority
  if (stop.sla_deadline) {
    const minsLeft = (new Date(stop.sla_deadline) - new Date()) / 60000;
    score += PRIORITY_WEIGHTS.sla_expiry * Math.max(0, 100 - minsLeft);
  }
  // VIP / Express
  if (stop.is_express || stop.is_vip) {
    score += PRIORITY_WEIGHTS.vip_express * 80;
  }
  // COD
  if (stop.payment_method === 'cod' || stop.payment_method === 'cash') {
    score += PRIORITY_WEIGHTS.cod * 60;
  }
  // Distance (closer = higher priority)
  const d = osrm.haversineKm(depot.lat, depot.lng, stop.lat, stop.lng);
  score += PRIORITY_WEIGHTS.distance * Math.max(0, 100 - d * 10);

  return score;
}

// ── Fuel estimation ─────────────────────────────────────────────────
function estimateFuel(distanceKm, vehicleType = 'bike') {
  const kpl = FUEL_KM_PER_LITER[String(vehicleType).toLowerCase()] || 25;
  if (kpl === 0) return 0;
  return Math.round((distanceKm / kpl) * 1000) / 1000;
}

// ── Route quality score (0-100) ─────────────────────────────────────
function computeOptimizationScore({ distanceKm, durationMin, stops, trafficLevel }) {
  let score = 100;
  // Penalize long routes
  const avgDistPerStop = stops > 0 ? distanceKm / stops : distanceKm;
  if (avgDistPerStop > 5) score -= Math.min(20, (avgDistPerStop - 5) * 4);
  // Penalize heavy traffic
  if (trafficLevel === 'heavy') score -= 15;
  else if (trafficLevel === 'moderate') score -= 5;
  // Penalize long durations
  const avgTimePerStop = stops > 0 ? durationMin / stops : durationMin;
  if (avgTimePerStop > 20) score -= Math.min(20, (avgTimePerStop - 20) * 2);
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

// ══════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ══════════════════════════════════════════════════════════════════════

/**
 * Foundation nearest-neighbor (backward-compatible export).
 */
const optimizeRoute = ({ depot, stops = [] }) => {
  if (!depot || !stops.length) {
    return { order: [], total_distance: 0, algorithm: 'nearest_neighbor' };
  }
  const { order, totalDist } = nearestNeighborOrder(depot, stops);
  return {
    order: order.map((s) => s.id),
    stops: order,
    total_distance: Math.round(totalDist * 10000) / 10000,
    algorithm: 'nearest_neighbor',
  };
};

/**
 * Core AI route optimizer.
 * @param {string} partnerId - Delivery partner UUID
 * @param {string[]} orderIds - Array of order UUIDs to optimize route for
 * @param {Object} opts - { routeType: 'fastest'|'shortest'|'fuel_efficient' }
 */
async function computeOptimizedRoute(partnerId, orderIds = [], opts = {}) {
  const routeType = opts.routeType || 'fastest';
  const now = new Date();
  const trafficLevel = getTrafficLevel(now);

  // 1. Fetch partner location
  const { rows: partnerRows } = await pool.query(
    `SELECT id, current_lat, current_lng, vehicle_type FROM delivery_partners WHERE id = $1`,
    [partnerId]
  );
  if (!partnerRows.length) throw Object.assign(new Error('Partner not found'), { status: 404 });
  const partner = partnerRows[0];
  const depot = {
    lat: Number(partner.current_lat || 0),
    lng: Number(partner.current_lng || 0),
  };

  // 2. Fetch order locations
  let effectiveOrderIds = orderIds;
  if (!effectiveOrderIds.length) {
    const { rows: assigned } = await pool.query(
      `SELECT DISTINCT o.id FROM orders o
       LEFT JOIN order_tracking ot ON ot.order_id = o.id
       WHERE (o.delivery_partner_id = $1 OR ot.delivery_partner_id = $1)
         AND LOWER(o.status) NOT IN ('delivered', 'cancelled', 'rejected')
       ORDER BY o.created_at ASC`,
      [partnerId]
    );
    effectiveOrderIds = assigned.map((r) => r.id);
  }

  if (!effectiveOrderIds.length) {
    return {
      success: true,
      route: null,
      message: 'No active orders to optimize',
    };
  }

  const { rows: orderRows } = await pool.query(
    `SELECT o.id, o.status, o.payment_method, o.delivery_mode, o.created_at,
            o.scheduled_for,
            r.lat AS restaurant_lat, r.lng AS restaurant_lng, r.name AS restaurant_name,
            a.lat AS customer_lat, a.lng AS customer_lng, a.full_address AS customer_address,
            ot.current_status AS tracking_status
     FROM orders o
     JOIN restaurants r ON r.id = o.restaurant_id
     LEFT JOIN addresses a ON a.id = o.delivery_address_id
     LEFT JOIN order_tracking ot ON ot.order_id = o.id
     WHERE o.id = ANY($1)`,
    [effectiveOrderIds]
  );

  // 3. Build stop list
  const stops = orderRows.map((o) => {
    const stage = String(o.tracking_status || o.status || '').toLowerCase();
    const pickedUp = ['picked_up', 'on_the_way', 'out_for_delivery'].some((s) => stage.includes(s));
    const target = pickedUp
      ? { lat: Number(o.customer_lat), lng: Number(o.customer_lng) }
      : { lat: Number(o.restaurant_lat), lng: Number(o.restaurant_lng) };
    return {
      id: o.id,
      ...target,
      label: pickedUp ? (o.customer_address || 'Customer') : (o.restaurant_name || 'Restaurant'),
      waypoint_type: pickedUp ? 'delivery' : 'pickup',
      is_express: o.delivery_mode === 'Express',
      is_vip: false,
      payment_method: o.payment_method,
      sla_deadline: o.scheduled_for || new Date(new Date(o.created_at).getTime() + 45 * 60000),
    };
  });

  // 4. Multi-algorithm optimization
  let optimizedStops;
  let algorithm = 'nearest_neighbor';

  // Step A: Nearest-neighbor
  const { order: nnOrder } = nearestNeighborOrder(depot, stops);
  optimizedStops = nnOrder;

  // Step B: 2-opt improvement
  if (optimizedStops.length >= 4) {
    optimizedStops = [depot, ...twoOptImprove(optimizedStops)];
    optimizedStops.shift(); // remove depot from stop list
    algorithm = '2opt_improved';
  }

  // Step C: Priority weighting (sort top stops by urgency)
  if (optimizedStops.length >= 2) {
    optimizedStops.sort((a, b) => priorityWeightedScore(b, depot) - priorityWeightedScore(a, depot));
    algorithm = 'priority_weighted_2opt';
  }

  // 5. Get OSRM route for the optimized sequence
  const routeCoords = [depot, ...optimizedStops];
  const osrmResult = await osrm.getRoute(routeCoords);

  // Apply traffic multiplier
  const adjustedDuration = Math.round(osrmResult.duration_min * trafficMultiplier(trafficLevel) * 10) / 10;

  // 6. Fuel estimation
  const fuelEstimate = estimateFuel(osrmResult.distance_km, partner.vehicle_type);

  // 7. Optimization score
  const optimizationScore = computeOptimizationScore({
    distanceKm: osrmResult.distance_km,
    durationMin: adjustedDuration,
    stops: optimizedStops.length,
    trafficLevel,
  });

  // 8. Deactivate previous routes for this partner
  await pool.query(
    `UPDATE optimized_routes SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE partner_id = $1 AND is_active = TRUE`,
    [partnerId]
  );

  // 9. Persist optimized route
  const { rows: routeInsert } = await pool.query(
    `INSERT INTO optimized_routes
       (partner_id, order_id, algorithm, route_type, origin_lat, origin_lng,
        destination_lat, destination_lng, distance_km, duration_min,
        fuel_estimate_liters, traffic_level, optimization_score, polyline,
        waypoints, turn_instructions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING id`,
    [
      partnerId,
      effectiveOrderIds[0], // primary order
      algorithm,
      routeType,
      depot.lat, depot.lng,
      optimizedStops[optimizedStops.length - 1]?.lat || 0,
      optimizedStops[optimizedStops.length - 1]?.lng || 0,
      osrmResult.distance_km,
      adjustedDuration,
      fuelEstimate,
      trafficLevel,
      optimizationScore,
      osrmResult.polyline,
      JSON.stringify(optimizedStops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.label, type: s.waypoint_type }))),
      JSON.stringify(osrmResult.turn_instructions || []),
    ]
  );

  const routeId = routeInsert[0].id;

  // 10. Persist waypoints
  let cumulativeEta = 0;
  for (let i = 0; i < optimizedStops.length; i++) {
    const s = optimizedStops[i];
    const prev = i === 0 ? depot : optimizedStops[i - 1];
    const legDist = osrmResult.legs?.[i]?.distance_km ?? osrm.haversineKm(prev.lat, prev.lng, s.lat, s.lng);
    const legTime = osrmResult.legs?.[i]?.duration_min ?? Math.round((legDist / 22) * 60 * 10) / 10;
    cumulativeEta += legTime;

    await pool.query(
      `INSERT INTO route_waypoints (route_id, order_id, sequence_order, waypoint_type, lat, lng, address, eta_minutes, distance_from_prev_km)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [routeId, s.id, i + 1, s.waypoint_type, s.lat, s.lng, s.label, Math.round(cumulativeEta * 10) / 10, Math.round(legDist * 100) / 100]
    );
  }

  // 11. Record history
  await pool.query(
    `INSERT INTO route_history
       (partner_id, order_ids, algorithm, route_type, total_distance_km, total_duration_min,
        fuel_estimate_liters, optimization_score, traffic_level, waypoint_count, polyline)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      partnerId,
      effectiveOrderIds,
      algorithm,
      routeType,
      osrmResult.distance_km,
      adjustedDuration,
      fuelEstimate,
      optimizationScore,
      trafficLevel,
      optimizedStops.length,
      osrmResult.polyline,
    ]
  );

  log.info('[routeOptimization] Route optimized', {
    partnerId,
    algorithm,
    orders: effectiveOrderIds.length,
    distance_km: osrmResult.distance_km,
    duration_min: adjustedDuration,
    score: optimizationScore,
    source: osrmResult.source,
  });

  return {
    success: true,
    route: {
      id: routeId,
      algorithm,
      route_type: routeType,
      distance_km: osrmResult.distance_km,
      duration_min: adjustedDuration,
      fuel_estimate_liters: fuelEstimate,
      traffic_level: trafficLevel,
      optimization_score: optimizationScore,
      polyline: osrmResult.polyline,
      waypoints: optimizedStops.map((s, i) => ({
        sequence: i + 1,
        order_id: s.id,
        lat: s.lat,
        lng: s.lng,
        label: s.label,
        type: s.waypoint_type,
        eta_minutes: osrmResult.legs?.[i]?.duration_min || null,
        distance_km: osrmResult.legs?.[i]?.distance_km || null,
      })),
      turn_instructions: osrmResult.turn_instructions || [],
      alternatives: osrmResult.alternatives || [],
      source: osrmResult.source,
      partner_location: depot,
    },
  };
}

/**
 * Recalculate route for a partner (triggered by deviation, new order, etc).
 */
async function recalculateRoute(partnerId, reason = 'manual') {
  log.info('[routeOptimization] Recalculating route', { partnerId, reason });

  // Increment recalculation count on existing route
  await pool.query(
    `UPDATE optimized_routes SET recalculation_count = recalculation_count + 1, updated_at = CURRENT_TIMESTAMP
     WHERE partner_id = $1 AND is_active = TRUE`,
    [partnerId]
  );

  // Record deviation in history
  if (reason === 'deviation') {
    await pool.query(
      `UPDATE route_history SET deviation_detected = TRUE, recalculation_reason = $1
       WHERE partner_id = $2 AND created_at = (
         SELECT MAX(created_at) FROM route_history WHERE partner_id = $2
       )`,
      [reason, partnerId]
    );
  }

  const result = await computeOptimizedRoute(partnerId, [], { routeType: 'fastest' });

  if (result.route) {
    // Record recalculation reason in new history entry
    await pool.query(
      `UPDATE route_history SET recalculation_reason = $1
       WHERE partner_id = $2 AND created_at = (
         SELECT MAX(created_at) FROM route_history WHERE partner_id = $2
       )`,
      [reason, partnerId]
    );
  }

  return result;
}

/**
 * Check if a rider has deviated from their planned route.
 * Returns { deviated, distance_m } 
 */
async function checkDeviation(partnerId, currentLat, currentLng) {
  const { rows } = await pool.query(
    `SELECT polyline FROM optimized_routes WHERE partner_id = $1 AND is_active = TRUE ORDER BY created_at DESC LIMIT 1`,
    [partnerId]
  );

  if (!rows.length || !rows[0].polyline) {
    return { deviated: false, distance_m: 0, hasRoute: false };
  }

  const polylinePoints = osrm.decodePolyline(rows[0].polyline);
  const distance_m = osrm.pointToPolylineDistanceMeters(
    { lat: Number(currentLat), lng: Number(currentLng) },
    polylinePoints
  );

  const DEVIATION_THRESHOLD_M = Number(process.env.ROUTE_DEVIATION_THRESHOLD_M || 500);

  return {
    deviated: distance_m > DEVIATION_THRESHOLD_M,
    distance_m: Math.round(distance_m),
    threshold_m: DEVIATION_THRESHOLD_M,
    hasRoute: true,
  };
}

/**
 * Get route analytics for a partner or all partners (admin).
 */
async function getRouteAnalytics({ partnerId = null, days = 7 } = {}) {
  const partnerFilter = partnerId ? 'AND rh.partner_id = $2' : '';
  const params = [days];
  if (partnerId) params.push(partnerId);

  const { rows } = await pool.query(
    `SELECT
       COUNT(*) AS total_routes,
       COALESCE(AVG(total_distance_km), 0) AS avg_distance_km,
       COALESCE(AVG(total_duration_min), 0) AS avg_duration_min,
       COALESCE(AVG(fuel_estimate_liters), 0) AS avg_fuel_liters,
       COALESCE(AVG(optimization_score), 0) AS avg_optimization_score,
       COALESCE(AVG(waypoint_count), 0) AS avg_waypoints,
       COUNT(CASE WHEN deviation_detected THEN 1 END) AS deviation_count,
       COALESCE(SUM(total_distance_km), 0) AS total_distance_km,
       COALESCE(SUM(fuel_estimate_liters), 0) AS total_fuel_liters,
       COUNT(DISTINCT partner_id) AS unique_partners
     FROM route_history rh
     WHERE rh.created_at >= CURRENT_TIMESTAMP - MAKE_INTERVAL(days => $1)
       ${partnerFilter}`,
    params
  );

  const stats = rows[0] || {};

  // Calculate efficiency: (optimal distance / actual distance) * 100
  const efficiency = stats.total_routes > 0
    ? Math.min(100, Math.round(Number(stats.avg_optimization_score) * 10) / 10)
    : 0;

  return {
    period_days: days,
    total_routes: Number(stats.total_routes),
    avg_distance_km: Math.round(Number(stats.avg_distance_km) * 100) / 100,
    avg_duration_min: Math.round(Number(stats.avg_duration_min) * 10) / 10,
    avg_fuel_liters: Math.round(Number(stats.avg_fuel_liters) * 1000) / 1000,
    avg_optimization_score: Math.round(Number(stats.avg_optimization_score) * 10) / 10,
    avg_waypoints: Math.round(Number(stats.avg_waypoints) * 10) / 10,
    deviation_count: Number(stats.deviation_count),
    total_distance_km: Math.round(Number(stats.total_distance_km) * 100) / 100,
    total_fuel_liters: Math.round(Number(stats.total_fuel_liters) * 100) / 100,
    unique_partners: Number(stats.unique_partners),
    route_efficiency_pct: efficiency,
  };
}

/**
 * Get active routes for admin dashboard.
 */
async function getActiveRoutes() {
  const { rows } = await pool.query(
    `SELECT
       ort.id AS route_id,
       ort.partner_id,
       dp.full_name AS partner_name,
       dp.vehicle_type,
       dp.current_lat AS partner_lat,
       dp.current_lng AS partner_lng,
       ort.algorithm,
       ort.route_type,
       ort.distance_km,
       ort.duration_min,
       ort.fuel_estimate_liters,
       ort.traffic_level,
       ort.optimization_score,
       ort.polyline,
       ort.waypoints,
       ort.recalculation_count,
       ort.created_at,
       ort.updated_at
     FROM optimized_routes ort
     JOIN delivery_partners dp ON dp.id = ort.partner_id
     WHERE ort.is_active = TRUE
     ORDER BY ort.created_at DESC
     LIMIT 100`
  );
  return rows;
}

module.exports = {
  optimizeRoute,
  dist,
  computeOptimizedRoute,
  recalculateRoute,
  checkDeviation,
  getRouteAnalytics,
  getActiveRoutes,
  getTrafficLevel,
  estimateFuel,
  computeOptimizationScore,
  nearestNeighborOrder,
  twoOptImprove,
};
