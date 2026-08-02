/**
 * Geo Zone calculations and spatial math for polygon & circle delivery zones.
 */

// Haversine distance in meters between two lat/lng points
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Ray-casting algorithm for checking if a point (lat, lng) is inside a polygon
// polygon: Array of { lat, lng } or [[lng, lat]] / [[lat, lng]]
function isPointInPolygon(lat, lng, polygonCoordinates) {
  if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length < 3) {
    return false;
  }

  // Normalize polygon points to [{lat, lng}]
  const points = polygonCoordinates.map((pt) => {
    if (Array.isArray(pt)) {
      // GeoJSON standard is [lng, lat]
      return { lat: Number(pt[1]), lng: Number(pt[0]) };
    }
    return { lat: Number(pt.lat ?? pt.latitude), lng: Number(pt.lng ?? pt.longitude) };
  });

  let inside = false;
  const x = Number(lng);
  const y = Number(lat);

  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].lng;
    const yi = points[i].lat;
    const xj = points[j].lng;
    const yj = points[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

// Check if point is inside a circle zone
function isPointInCircle(lat, lng, centerLat, centerLng, radiusKm) {
  if (centerLat == null || centerLng == null || radiusKm == null) return false;
  const distMeters = haversineDistanceMeters(Number(lat), Number(lng), Number(centerLat), Number(centerLng));
  return distMeters <= Number(radiusKm) * 1000;
}

// Check if point is inside zone (handles polygon & circle zone_type)
function isPointInZone(lat, lng, zone) {
  if (!zone || !zone.is_active) return false;

  if (zone.zone_type === 'circle') {
    return isPointInCircle(lat, lng, zone.center_latitude, zone.center_longitude, zone.radius_km);
  }

  // polygon zone type
  const poly = typeof zone.polygon === 'string' ? JSON.parse(zone.polygon) : zone.polygon;
  // Handle GeoJSON format or array of points
  const coords = poly?.coordinates?.[0] || poly;
  return isPointInPolygon(lat, lng, coords);
}

// Calculate shortest distance in meters from a point to polygon perimeter segments or circle edge
function distanceToZoneBoundaryMeters(lat, lng, zone) {
  if (!zone) return Infinity;

  const pointLat = Number(lat);
  const pointLng = Number(lng);

  if (zone.zone_type === 'circle') {
    const distToCenter = haversineDistanceMeters(pointLat, pointLng, Number(zone.center_latitude), Number(zone.center_longitude));
    const radiusMeters = Number(zone.radius_km) * 1000;
    return Math.abs(distToCenter - radiusMeters);
  }

  // Polygon boundary distance: minimum distance to all line segments
  const poly = typeof zone.polygon === 'string' ? JSON.parse(zone.polygon) : zone.polygon;
  const coords = (poly?.coordinates?.[0] || poly || []).map((pt) => {
    if (Array.isArray(pt)) return { lat: Number(pt[1]), lng: Number(pt[0]) };
    return { lat: Number(pt.lat ?? pt.latitude), lng: Number(pt.lng ?? pt.longitude) };
  });

  if (coords.length < 2) return Infinity;

  let minDistance = Infinity;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];

    // Distance to segment p1-p2
    const d = distanceToSegmentMeters(pointLat, pointLng, p1.lat, p1.lng, p2.lat, p2.lng);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  return minDistance;
}

// Distance from point to line segment (p1, p2) in meters
function distanceToSegmentMeters(lat, lng, lat1, lng1, lat2, lng2) {
  // Approximate conversion to Cartesian coords in meters around (lat, lng)
  const degToMetersY = 111000;
  const degToMetersX = 111000 * Math.cos((lat * Math.PI) / 180);

  const px = lng * degToMetersX;
  const py = lat * degToMetersY;
  const x1 = lng1 * degToMetersX;
  const y1 = lat1 * degToMetersY;
  const x2 = lng2 * degToMetersX;
  const y2 = lat2 * degToMetersY;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.hypot(px - projX, py - projY);
}

module.exports = {
  haversineDistanceMeters,
  isPointInPolygon,
  isPointInCircle,
  isPointInZone,
  distanceToZoneBoundaryMeters,
};
