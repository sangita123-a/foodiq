/**
 * Unit tests for Geo-fencing & Delivery Zones Logic
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  isPointInPolygon,
  isPointInCircle,
  isPointInZone,
  distanceToZoneBoundaryMeters,
  isValidCoordinate,
  getNearestZone,
} = require("../../foodiq-frontend/foodiq-backend/services/geoZoneService.js");

describe("Geo-fencing & Delivery Zones Logic", () => {
  const polygonPoints = [
    { lat: 12.9716, lng: 77.5946 },
    { lat: 12.9800, lng: 77.5946 },
    { lat: 12.9800, lng: 77.6100 },
    { lat: 12.9716, lng: 77.6100 },
  ];

  const polygonZone = {
    id: "zone-1",
    name: "Central Zone",
    zone_type: "polygon",
    is_active: true,
    polygon: polygonPoints,
  };

  const circleZone = {
    id: "zone-2",
    name: "Airport Circle",
    zone_type: "circle",
    is_active: true,
    center_latitude: 12.9716,
    center_longitude: 77.5946,
    radius_km: 2.0, // 2km
  };

  it("correctly detects point inside polygon using ray-casting", () => {
    // Point inside polygon
    const inside = isPointInPolygon(12.9750, 77.6000, polygonPoints);
    assert.strictEqual(inside, true);

    // Point outside polygon
    const outside = isPointInPolygon(13.0000, 77.7000, polygonPoints);
    assert.strictEqual(outside, false);
  });

  it("correctly detects point inside circle using Haversine distance", () => {
    // Center point (0m away)
    assert.strictEqual(isPointInCircle(12.9716, 77.5946, 12.9716, 77.5946, 2.0), true);

    // Point ~1km away (inside 2km circle)
    assert.strictEqual(isPointInCircle(12.9800, 77.5946, 12.9716, 77.5946, 2.0), true);

    // Point ~10km away (outside 2km circle)
    assert.strictEqual(isPointInCircle(13.0500, 77.5946, 12.9716, 77.5946, 2.0), false);
  });

  it("evaluates zone membership via isPointInZone", () => {
    assert.strictEqual(isPointInZone(12.9750, 77.6000, polygonZone), true);
    assert.strictEqual(isPointInZone(12.9716, 77.5946, circleZone), true);

    const inactiveZone = { ...polygonZone, is_active: false };
    assert.strictEqual(isPointInZone(12.9750, 77.6000, inactiveZone), false);
  });

  it("calculates boundary distance correctly for circle zone", () => {
    // Distance from center 12.9716, 77.5946 to radius 2000m
    const distAtCenter = distanceToZoneBoundaryMeters(12.9716, 77.5946, circleZone);
    assert.strictEqual(Math.round(distAtCenter), 2000);
  });

  it("validates GPS coordinates and rejects spoofed/out-of-range values", () => {
    assert.strictEqual(isValidCoordinate(12.9716, 77.5946), true);
    assert.strictEqual(isValidCoordinate(90, 180), true);
    assert.strictEqual(isValidCoordinate(-90, -180), true);
    assert.strictEqual(isValidCoordinate(91, 77.5946), false);
    assert.strictEqual(isValidCoordinate(12.9716, 181), false);
    assert.strictEqual(isValidCoordinate(null, 77.5946), false);
    assert.strictEqual(isValidCoordinate(NaN, 77.5946), false);
  });

  it("finds the nearest zone among several candidates", () => {
    const farCircle = { ...circleZone, id: "zone-far", center_latitude: 13.5, center_longitude: 78.2 };

    // Point inside the polygon zone should report 0m distance and select that zone.
    const insideResult = getNearestZone(12.9750, 77.6000, [farCircle, polygonZone]);
    assert.strictEqual(insideResult.zone.id, "zone-1");
    assert.strictEqual(insideResult.distance_meters, 0);

    // Point far from everything should still resolve to the closer of the two zones.
    const outsideResult = getNearestZone(12.9716, 77.5946, [farCircle, circleZone]);
    assert.strictEqual(outsideResult.zone.id, "zone-2");

    assert.strictEqual(getNearestZone(12.9716, 77.5946, []), null);
  });
});
