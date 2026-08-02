import test from "node:test";
import assert from "node:assert/strict";

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function computeCandidateScore(partner, order, rules) {
  const distanceKm = haversineDistance(
    partner.current_lat,
    partner.current_lng,
    order.restaurant_lat,
    order.restaurant_lng
  );

  const isOnline = Boolean(partner.is_online);
  const isKyc = Boolean(partner.is_verified);
  const isWithinRadius = distanceKm <= (rules.max_search_radius_km || 15.0);
  const isUnderWorkloadCap = (partner.active_workload || 0) < (rules.max_active_orders_per_partner || 2);
  const isEligible = isOnline && isKyc && isWithinRadius && isUnderWorkloadCap;

  const s_distance = Math.max(0, Math.min(100, 100 - (distanceKm / (rules.max_search_radius_km || 15.0)) * 100));
  const s_gps = partner.gps_fresh ? 100 : 50;
  const s_online = isOnline ? 100 : 0;
  const s_shift = partner.in_shift ? 100 : 40;
  const s_kyc = isKyc ? 100 : 0;
  const s_fraud = Math.max(0, Math.min(100, 100 - (partner.fraud_risk || 0)));
  const s_workload = Math.max(0, Math.min(100, 100 - ((partner.active_workload || 0) / 2) * 100));
  const s_vehicle = partner.vehicle_type === 'bike' ? 100 : 80;
  const s_avg_delivery_time = 85;
  const s_acceptance_rate = partner.acceptance_rate || 95;
  const s_completion_rate = partner.completion_rate || 98;
  const s_rating = (partner.rating / 5.0) * 100;
  const s_geofence = distanceKm <= 5 ? 100 : 70;
  const s_traffic_delay = 90;
  const s_estimated_arrival = 90;
  const s_idle_time = Math.min(100, 30 + (partner.idle_mins || 10) * 2);

  const weights = {
    distance: rules.weight_distance || 25.0,
    gps: rules.weight_gps || 10.0,
    online_status: rules.weight_online_status || 10.0,
    shift_status: rules.weight_shift_status || 10.0,
    kyc: rules.weight_kyc || 10.0,
    fraud_score: rules.weight_fraud_score || 10.0,
    workload: rules.weight_workload || 10.0,
    vehicle: rules.weight_vehicle || 5.0,
    avg_delivery_time: rules.weight_avg_delivery_time || 5.0,
    acceptance_rate: rules.weight_acceptance_rate || 5.0,
    completion_rate: rules.weight_completion_rate || 5.0,
    rating: rules.weight_rating || 10.0,
    geofence: rules.weight_geofence || 10.0,
    traffic_delay: rules.weight_traffic_delay || 5.0,
    estimated_arrival: rules.weight_estimated_arrival || 5.0,
    idle_time: rules.weight_idle_time || 5.0,
  };

  const totalWeightSum = Object.values(weights).reduce((a, b) => a + b, 0);

  const weightedScoreSum =
    s_distance * weights.distance +
    s_gps * weights.gps +
    s_online * weights.online_status +
    s_shift * weights.shift_status +
    s_kyc * weights.kyc +
    s_fraud * weights.fraud_score +
    s_workload * weights.workload +
    s_vehicle * weights.vehicle +
    s_avg_delivery_time * weights.avg_delivery_time +
    s_acceptance_rate * weights.acceptance_rate +
    s_completion_rate * weights.completion_rate +
    s_rating * weights.rating +
    s_geofence * weights.geofence +
    s_traffic_delay * weights.traffic_delay +
    s_estimated_arrival * weights.estimated_arrival +
    s_idle_time * weights.idle_time;

  const total_score = Number((totalWeightSum > 0 ? weightedScoreSum / totalWeightSum : 0).toFixed(2));

  return { is_eligible: isEligible, total_score, distanceKm };
}

test("AI Dispatch Weighted Scoring Engine Unit Tests", async (t) => {
  const defaultRules = {
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
  };

  const sampleOrder = {
    id: "ord-100",
    restaurant_lat: 12.9716,
    restaurant_lng: 77.5946,
  };

  await t.test("calculates higher score for closer partner", () => {
    const partnerA = {
      id: "p1",
      current_lat: 12.9720,
      current_lng: 77.5950,
      is_online: true,
      is_verified: true,
      rating: 4.9,
      active_workload: 0,
      gps_fresh: true,
      in_shift: true,
    };

    const partnerB = {
      id: "p2",
      current_lat: 12.9100,
      current_lng: 77.5200,
      is_online: true,
      is_verified: true,
      rating: 4.2,
      active_workload: 0,
      gps_fresh: true,
      in_shift: true,
    };

    const scoreA = computeCandidateScore(partnerA, sampleOrder, defaultRules);
    const scoreB = computeCandidateScore(partnerB, sampleOrder, defaultRules);

    assert.equal(scoreA.is_eligible, true);
    assert.equal(scoreB.is_eligible, true);
    assert.ok(scoreA.total_score > scoreB.total_score, "Partner closer to restaurant should achieve higher total score");
  });

  await t.test("disqualifies offline or unverified partners", () => {
    const offlinePartner = {
      id: "p3",
      current_lat: 12.9720,
      current_lng: 77.5950,
      is_online: false,
      is_verified: true,
      rating: 5.0,
    };

    const unverifiedPartner = {
      id: "p4",
      current_lat: 12.9720,
      current_lng: 77.5950,
      is_online: true,
      is_verified: false,
      rating: 5.0,
    };

    const scoreOffline = computeCandidateScore(offlinePartner, sampleOrder, defaultRules);
    const scoreUnverified = computeCandidateScore(unverifiedPartner, sampleOrder, defaultRules);

    assert.equal(scoreOffline.is_eligible, false, "Offline partner must be marked ineligible");
    assert.equal(scoreUnverified.is_eligible, false, "Unverified KYC partner must be marked ineligible");
  });

  await t.test("disqualifies partner exceeding search radius", () => {
    const farPartner = {
      id: "p5",
      current_lat: 13.5000,
      current_lng: 78.5000,
      is_online: true,
      is_verified: true,
      rating: 5.0,
    };

    const res = computeCandidateScore(farPartner, sampleOrder, defaultRules);
    assert.equal(res.is_eligible, false, "Partner outside max radius must be ineligible");
  });

  await t.test("ranks candidates correctly and picks winner", () => {
    const candidates = [
      { id: "p1", current_lat: 12.9720, current_lng: 77.5950, is_online: true, is_verified: true, rating: 4.9 },
      { id: "p2", current_lat: 12.9750, current_lng: 77.5980, is_online: true, is_verified: true, rating: 4.1 },
      { id: "p3", current_lat: 12.9720, current_lng: 77.5950, is_online: false, is_verified: true, rating: 5.0 },
    ];

    const scored = candidates
      .map((c) => ({ id: c.id, ...computeCandidateScore(c, sampleOrder, defaultRules) }))
      .filter((c) => c.is_eligible)
      .sort((a, b) => b.total_score - a.total_score);

    assert.equal(scored.length, 2, "Only online & eligible partners should remain");
    assert.equal(scored[0].id, "p1", "Highest scoring candidate should win rank 1");
  });
});
