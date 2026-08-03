/**
 * OSRM (Open Source Routing Machine) HTTP client.
 * Uses the public OSRM demo server for driving route calculations.
 * Falls back to Haversine distance when OSRM is unreachable.
 */
const https = require('https');
const http = require('http');
const { log } = require('../utils/logger');

const OSRM_BASE = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const TIMEOUT_MS = Number(process.env.OSRM_TIMEOUT_MS || 5000);

/**
 * Haversine distance in km between two GPS points (fallback).
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Simple HTTP(S) GET with timeout and JSON parsing.
 */
function httpGet(url, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error('OSRM returned non-JSON response'));
        }
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('OSRM request timed out'));
    });
    req.on('error', reject);
  });
}

/**
 * Extract turn-by-turn instructions from OSRM route steps.
 */
function extractTurnInstructions(legs = []) {
  const instructions = [];
  for (const leg of legs) {
    for (const step of (leg.steps || [])) {
      if (step.maneuver && step.distance > 0) {
        instructions.push({
          type: step.maneuver.type || 'turn',
          modifier: step.maneuver.modifier || null,
          name: step.name || '',
          distance_m: Math.round(step.distance),
          duration_s: Math.round(step.duration),
          instruction: formatInstruction(step),
        });
      }
    }
  }
  return instructions;
}

function formatInstruction(step) {
  const m = step.maneuver || {};
  const dir = m.modifier ? m.modifier.replace(/_/g, ' ') : '';
  const name = step.name ? ` onto ${step.name}` : '';
  const dist = step.distance >= 1000
    ? `${(step.distance / 1000).toFixed(1)} km`
    : `${Math.round(step.distance)} m`;

  switch (m.type) {
    case 'depart': return `Head ${dir}${name} for ${dist}`;
    case 'arrive': return `Arrive at destination${name}`;
    case 'turn': return `Turn ${dir}${name} for ${dist}`;
    case 'new name': return `Continue${name} for ${dist}`;
    case 'roundabout': return `Enter roundabout, exit ${dir}${name}`;
    case 'merge': return `Merge ${dir}${name}`;
    case 'fork': return `Take the ${dir} fork${name}`;
    default: return `Continue ${dir}${name} for ${dist}`;
  }
}

/**
 * Get optimal driving route between an array of coordinates.
 * @param {Array<{lat: number, lng: number}>} coordinates - Ordered waypoints
 * @param {Object} opts - { alternatives, steps, overview }
 * @returns {Object} { distance_km, duration_min, polyline, legs, steps, source }
 */
async function getRoute(coordinates, opts = {}) {
  if (!coordinates || coordinates.length < 2) {
    throw new Error('At least 2 coordinates are required for routing');
  }

  const coordStr = coordinates
    .map((c) => `${Number(c.lng)},${Number(c.lat)}`)
    .join(';');

  const alternatives = opts.alternatives ? 'true' : 'false';
  const steps = opts.steps !== false ? 'true' : 'false';
  const overview = opts.overview || 'full';
  const geometries = 'polyline';

  const url = `${OSRM_BASE}/route/v1/driving/${coordStr}?alternatives=${alternatives}&steps=${steps}&overview=${overview}&geometries=${geometries}`;

  try {
    const data = await httpGet(url);

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      log.warn('[osrmClient] OSRM returned no routes, falling back to Haversine', {
        code: data.code,
        message: data.message,
      });
      return buildHaversineFallback(coordinates);
    }

    const route = data.routes[0];
    const alternativeRoutes = (data.routes || []).slice(1).map((r) => ({
      distance_km: Math.round((r.distance / 1000) * 100) / 100,
      duration_min: Math.round((r.duration / 60) * 10) / 10,
      polyline: r.geometry || null,
    }));

    return {
      distance_km: Math.round((route.distance / 1000) * 100) / 100,
      duration_min: Math.round((route.duration / 60) * 10) / 10,
      polyline: route.geometry || null,
      legs: (route.legs || []).map((leg) => ({
        distance_km: Math.round((leg.distance / 1000) * 100) / 100,
        duration_min: Math.round((leg.duration / 60) * 10) / 10,
        summary: leg.summary || '',
      })),
      turn_instructions: extractTurnInstructions(route.legs),
      alternatives: alternativeRoutes,
      source: 'osrm',
    };
  } catch (err) {
    log.warn('[osrmClient] OSRM request failed, falling back to Haversine', {
      error: err.message,
    });
    return buildHaversineFallback(coordinates);
  }
}

/**
 * Get route with alternatives (up to 3 routes).
 */
async function getRouteWithAlternatives(coordinates) {
  return getRoute(coordinates, { alternatives: true });
}

/**
 * Haversine fallback when OSRM is unavailable.
 */
function buildHaversineFallback(coordinates) {
  let totalDistance = 0;
  const legs = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = coordinates[i];
    const b = coordinates[i + 1];
    const d = haversineKm(a.lat, a.lng, b.lat, b.lng);
    totalDistance += d;
    legs.push({
      distance_km: Math.round(d * 100) / 100,
      duration_min: Math.round((d / 22) * 60 * 10) / 10, // assume 22 km/h avg
      summary: '',
    });
  }

  // Peak hour traffic adjustment
  const hour = new Date().getHours();
  const peak = (hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21);
  const trafficFactor = peak ? 1.25 : 1.0;
  const durationMin = Math.round(((totalDistance / 22) * 60 * trafficFactor) * 10) / 10;

  return {
    distance_km: Math.round(totalDistance * 100) / 100,
    duration_min: durationMin,
    polyline: null,
    legs,
    turn_instructions: [],
    alternatives: [],
    source: 'haversine_fallback',
  };
}

/**
 * Calculate point-to-polyline minimum distance (for deviation detection).
 * Uses perpendicular distance from a point to each segment of the polyline.
 * @param {Object} point - { lat, lng }
 * @param {Array<{lat: number, lng: number}>} polylinePoints - Decoded polyline points
 * @returns {number} Minimum distance in meters
 */
function pointToPolylineDistanceMeters(point, polylinePoints) {
  if (!polylinePoints || polylinePoints.length < 2) return Infinity;

  let minDist = Infinity;
  for (let i = 0; i < polylinePoints.length - 1; i++) {
    const a = polylinePoints[i];
    const b = polylinePoints[i + 1];
    const d = pointToSegmentDistanceMeters(point, a, b);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

function pointToSegmentDistanceMeters(p, a, b) {
  const R = 6371000; // Earth radius in meters
  const distAP = haversineKm(a.lat, a.lng, p.lat, p.lng) * 1000;
  const distAB = haversineKm(a.lat, a.lng, b.lat, b.lng) * 1000;
  const distBP = haversineKm(b.lat, b.lng, p.lat, p.lng) * 1000;

  if (distAB === 0) return distAP;

  // Use cross-track distance formula
  const bearingAP = bearing(a.lat, a.lng, p.lat, p.lng);
  const bearingAB = bearing(a.lat, a.lng, b.lat, b.lng);
  const crossTrack = Math.abs(
    Math.asin(Math.sin(distAP / R) * Math.sin(bearingAP - bearingAB)) * R
  );

  // Check if the perpendicular falls within the segment
  const alongTrack = Math.acos(Math.cos(distAP / R) / Math.cos(crossTrack / R)) * R;
  if (alongTrack > distAB) return Math.min(distAP, distBP);

  return crossTrack;
}

function bearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return Math.atan2(y, x);
}

/**
 * Decode an encoded polyline string into an array of { lat, lng }.
 */
function decodePolyline(encoded) {
  if (!encoded) return [];
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

module.exports = {
  getRoute,
  getRouteWithAlternatives,
  haversineKm,
  pointToPolylineDistanceMeters,
  decodePolyline,
  buildHaversineFallback,
};
