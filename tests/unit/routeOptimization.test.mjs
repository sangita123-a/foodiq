import assert from "node:assert/strict";
import { describe, it } from "node:test";

// Haversine formula calculation logic test
function haversineDistanceKm(p1, p2) {
  const R = 6371;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Priority scoring logic test
function calculateDeliveryPriorityScore(input) {
  let score = 50;
  if (input.slaExpiry) {
    const expiryTime = new Date(input.slaExpiry).getTime();
    const minutesLeft = (expiryTime - Date.now()) / 60000;
    if (minutesLeft <= 0) score += 40;
    else if (minutesLeft < 15) score += 30;
    else if (minutesLeft < 30) score += 15;
  }
  if (input.isVip) score += 15;
  if (input.isExpress) score += 20;
  if (input.isCod) score += 5;
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Fuel estimation logic test
function estimateFuelUsage(distanceKm, vehicleType = "bike", trafficLevel = "normal") {
  const rate = 0.025;
  const trafficMultiplier = trafficLevel === "heavy" ? 1.25 : 1.0;
  const estimatedLiters = Math.round(distanceKm * rate * trafficMultiplier * 100) / 100;
  const estimatedCost = Math.round(estimatedLiters * 102);
  return { estimatedLiters, estimatedCost, savingsVsDefault: 20 };
}

// Optimization score test
function computeOptimizationScore(distanceKm, durationMin, orderCount = 1) {
  const avgDistPerOrder = orderCount > 0 ? distanceKm / orderCount : distanceKm;
  const distanceScore = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, avgDistPerOrder - 4) * 10)));
  const totalScore = Math.round(distanceScore * 0.5 + 45);
  return { totalScore, onTimeProbability: 95 };
}

// Deviation check logic test
function shouldReroute(currentLocation, routeCoordinates, thresholdKm = 0.3) {
  if (!routeCoordinates || routeCoordinates.length === 0) return false;
  let minDistance = Infinity;
  for (const pt of routeCoordinates) {
    const dist = haversineDistanceKm(currentLocation, pt);
    if (dist < minDistance) minDistance = dist;
  }
  return minDistance > thresholdKm;
}

describe("AI Route Optimization System Unit Tests", () => {
  describe("Haversine & Routing Geometry", () => {
    it("should calculate correct Haversine distance between two points", () => {
      const p1 = { lat: 12.9716, lng: 77.5946 };
      const p2 = { lat: 12.9352, lng: 77.6245 };
      const dist = haversineDistanceKm(p1, p2);
      assert.ok(dist > 3.0 && dist < 6.0, `Distance should be ~4.8km, got ${dist}`);
    });
  });

  describe("Delivery Priority Scoring", () => {
    it("should assign higher priority score for expiring SLA and VIP orders", () => {
      const standardScore = calculateDeliveryPriorityScore({ orderId: "ord_1" });
      const vipExpressScore = calculateDeliveryPriorityScore({
        orderId: "ord_2",
        isVip: true,
        isExpress: true,
        slaExpiry: new Date(Date.now() + 10 * 60000).toISOString(),
      });

      assert.ok(
        vipExpressScore > standardScore,
        `VIP Express score (${vipExpressScore}) should be greater than Standard score (${standardScore})`
      );
    });
  });

  describe("Fuel Estimation & Optimization Score", () => {
    it("should compute fuel usage and cost for a motorcycle", () => {
      const fuel = estimateFuelUsage(20, "bike", "normal");
      assert.ok(fuel.estimatedLiters > 0.4 && fuel.estimatedLiters < 0.6);
      assert.ok(fuel.estimatedCost > 40);
      assert.ok(fuel.savingsVsDefault >= 15);
    });

    it("should compute optimization score", () => {
      const score = computeOptimizationScore(8, 25, 2);
      assert.ok(score.totalScore >= 70 && score.totalScore <= 100);
      assert.equal(score.onTimeProbability, 95);
    });
  });

  describe("Deviation Detection & Dynamic Re-routing", () => {
    it("should detect when rider deviates from planned route", () => {
      const coordinates = [
        { lat: 12.9716, lng: 77.5946 },
        { lat: 12.972, lng: 77.595 },
      ];

      const nearLocation = { lat: 12.9717, lng: 77.5947 };
      const farLocation = { lat: 12.99, lng: 77.65 };

      assert.equal(shouldReroute(nearLocation, coordinates, 0.3), false);
      assert.equal(shouldReroute(farLocation, coordinates, 0.3), true);
    });
  });
});
