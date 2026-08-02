const crypto = require('crypto');
const DispatchModel = require('../models/dispatchModel');

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
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

class DispatchEngineService {
  /**
   * Evaluates all candidate delivery partners for an order and auto-assigns top rank candidate.
   */
  static async evaluateOrderDispatch({ orderId, triggerType = 'auto', attemptNumber = 1 }) {
    const startTime = Date.now();
    const dispatchRunId = crypto.randomUUID();

    // 1. Fetch Order details
    const order = await DispatchModel.getOrderDetails(orderId);
    if (!order) {
      throw new Error(`Order with ID '${orderId}' not found`);
    }

    // 2. Fetch Active Dispatch Rules
    const rules = await DispatchModel.getRules();

    // 3. Fetch Candidate Delivery Partners
    const candidates = await DispatchModel.getCandidatePartners();

    if (!candidates || candidates.length === 0) {
      const summary = 'No delivery partners found in system';
      await DispatchModel.createDispatchHistory({
        dispatch_run_id: dispatchRunId,
        order_id: orderId,
        assigned_partner_id: null,
        trigger_type: triggerType,
        attempt_number: attemptNumber,
        status: 'no_partners_available',
        candidates_evaluated: 0,
        ai_decision_summary: summary,
        execution_time_ms: Date.now() - startTime,
      });

      return {
        dispatch_run_id: dispatchRunId,
        order_id: orderId,
        status: 'no_partners_available',
        summary,
        assigned_partner: null,
        ranked_candidates: [],
        execution_time_ms: Date.now() - startTime,
      };
    }

    // 4. Score each candidate partner using 16 factors
    const scoredCandidates = await Promise.all(
      candidates.map(async (partner) => {
        return await this.scorePartner(partner, order, rules);
      })
    );

    // Filter partners that meet hard eligibility requirements (online & KYC)
    const eligibleCandidates = scoredCandidates
      .filter((c) => c.is_eligible)
      .sort((a, b) => b.total_score - a.total_score);

    // All scored candidates sorted for audit logs
    const allScoredSorted = [...scoredCandidates].sort((a, b) => b.total_score - a.total_score);

    // Save individual scoring logs to dispatch_logs table
    await Promise.all(
      allScoredSorted.map((c) =>
        DispatchModel.createDispatchLog({
          dispatch_run_id: dispatchRunId,
          order_id: orderId,
          partner_id: c.partner.id,
          total_score: c.total_score,
          scoring_breakdown: c.scoring_breakdown,
          decision_reason: c.decision_reason,
          status: c.is_eligible ? (eligibleCandidates[0]?.partner.id === c.partner.id ? 'assigned' : 'calculated') : 'disqualified',
        })
      )
    );

    const winner = eligibleCandidates[0] || null;
    let assignmentStatus = 'no_eligible_partners';
    let summary = 'No online, KYC-verified partners were eligible within search radius.';

    if (winner && rules.auto_assign_enabled) {
      await DispatchModel.assignOrderToPartner(orderId, winner.partner.id);
      assignmentStatus = 'assigned';
      summary = `Auto-assigned top AI ranked partner ${winner.partner.full_name} (Score: ${winner.total_score.toFixed(1)}/100, Dist: ${winner.scoring_breakdown.raw_metrics.distance_km.toFixed(2)}km, ETA: ${winner.scoring_breakdown.raw_metrics.eta_minutes}m). Rationale: ${winner.decision_reason}`;
    } else if (winner) {
      assignmentStatus = 'ranked_only';
      summary = `Top partner calculated: ${winner.partner.full_name} (Score: ${winner.total_score.toFixed(1)}/100). Auto-assignment disabled by rules.`;
    }

    const executionTimeMs = Date.now() - startTime;

    // Record summary in dispatch_history
    await DispatchModel.createDispatchHistory({
      dispatch_run_id: dispatchRunId,
      order_id: orderId,
      assigned_partner_id: winner ? winner.partner.id : null,
      trigger_type: triggerType,
      attempt_number: attemptNumber,
      status: assignmentStatus,
      candidates_evaluated: candidates.length,
      ai_decision_summary: summary,
      execution_time_ms: executionTimeMs,
    });

    return {
      dispatch_run_id: dispatchRunId,
      order_id: orderId,
      status: assignmentStatus,
      summary,
      assigned_partner: winner
        ? {
            id: winner.partner.id,
            full_name: winner.partner.full_name,
            phone_number: winner.partner.phone_number,
            vehicle_type: winner.partner.vehicle_type,
            rating: winner.partner.rating,
            score: winner.total_score,
            distance_km: winner.scoring_breakdown.raw_metrics.distance_km,
            eta_minutes: winner.scoring_breakdown.raw_metrics.eta_minutes,
            decision_reason: winner.decision_reason,
          }
        : null,
      ranked_candidates: allScoredSorted.map((c) => ({
        partner_id: c.partner.id,
        partner_name: c.partner.full_name,
        vehicle_type: c.partner.vehicle_type,
        rating: c.partner.rating,
        is_eligible: c.is_eligible,
        total_score: c.total_score,
        scoring_breakdown: c.scoring_breakdown,
        decision_reason: c.decision_reason,
      })),
      rules_applied: rules,
      execution_time_ms: executionTimeMs,
    };
  }

  /**
   * Scores a single candidate partner against 16 factors.
   */
  static async scorePartner(partner, order, rules) {
    const [shiftStatus, analytics, fraudRisk] = await Promise.all([
      DispatchModel.getPartnerShiftStatus(partner.id),
      DispatchModel.getPartnerAnalytics(partner.id),
      DispatchModel.getPartnerFraudRisk(partner.id),
    ]);

    // Calculate metrics
    const distanceKm = haversineDistance(
      partner.current_lat,
      partner.current_lng,
      order.restaurant_lat,
      order.restaurant_lng
    );

    const now = Date.now();
    const lastGpsTime = new Date(partner.last_gps_at || now).getTime();
    const gpsAgeMinutes = Math.max(0, (now - lastGpsTime) / 60000);

    const lastCompletedTime = partner.last_completed_at ? new Date(partner.last_completed_at).getTime() : now - 3600000;
    const idleMinutes = Math.max(0, (now - lastCompletedTime) / 60000);

    // Hard eligibility criteria
    const isOnline = Boolean(partner.is_online);
    const isKyc = Boolean(partner.is_verified);
    const isWithinRadius = distanceKm <= (rules.max_search_radius_km || 15.0);
    const isUnderWorkloadCap = partner.active_workload < (rules.max_active_orders_per_partner || 2);
    const isEligible = isOnline && isKyc && isWithinRadius && isUnderWorkloadCap && fraudRisk < 80;

    // 16 Component Scores (0 to 100)
    // 1. Distance to restaurant
    const s_distance = Math.max(0, Math.min(100, 100 - (distanceKm / (rules.max_search_radius_km || 15.0)) * 100));

    // 2. Current GPS location freshness
    const s_gps = Math.max(0, Math.min(100, 100 - gpsAgeMinutes * 10));

    // 3. Online status
    const s_online = isOnline ? 100 : 0;

    // 4. Shift status
    const s_shift = shiftStatus ? 100 : 40;

    // 5. KYC verified
    const s_kyc = isKyc ? 100 : 0;

    // 6. Fraud score (lower risk = higher score)
    const s_fraud = Math.max(0, Math.min(100, 100 - fraudRisk));

    // 7. Current workload
    const s_workload = Math.max(0, Math.min(100, 100 - (partner.active_workload / (rules.max_active_orders_per_partner || 2)) * 100));

    // 8. Vehicle type optimal match
    let s_vehicle = 80;
    if (distanceKm < 3) {
      s_vehicle = partner.vehicle_type === 'cycle' ? 90 : partner.vehicle_type === 'bike' ? 100 : 75;
    } else if (distanceKm > 7) {
      s_vehicle = partner.vehicle_type === 'car' ? 100 : partner.vehicle_type === 'bike' ? 95 : 30;
    } else {
      s_vehicle = partner.vehicle_type === 'bike' ? 100 : 80;
    }

    // 9. Average delivery time
    const s_avg_delivery_time = Math.max(0, Math.min(100, 100 - (analytics.avg_delivery_time_mins - 15) * 3));

    // 10. Acceptance rate
    const s_acceptance_rate = Math.max(0, Math.min(100, analytics.acceptance_rate));

    // 11. Completion rate
    const s_completion_rate = Math.max(0, Math.min(100, analytics.completion_rate));

    // 12. Rating
    const s_rating = Math.max(0, Math.min(100, (partner.rating / 5.0) * 100));

    // 13. Geo-fence
    const s_geofence = distanceKm <= 5 ? 100 : distanceKm <= 10 ? 80 : 50;

    // 14. Traffic delay simulation based on distance and speed
    const estSpeedKmph = partner.vehicle_type === 'car' ? 25 : partner.vehicle_type === 'bike' ? 30 : 15;
    const etaMinutes = Math.round((distanceKm / estSpeedKmph) * 60);
    const s_traffic_delay = Math.max(0, Math.min(100, 100 - etaMinutes * 3));

    // 15. Estimated arrival score
    const s_estimated_arrival = Math.max(0, Math.min(100, 100 - etaMinutes * 4));

    // 16. Idle time balancing (fair driver allocation)
    const s_idle_time = Math.max(0, Math.min(100, 30 + Math.min(70, idleMinutes * 2)));

    // Weighted Score Summation
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

    // Rationale narrative
    let decision_reason = `Partner ${partner.full_name} scored ${total_score}/100. `;
    if (!isOnline) {
      decision_reason += `Disqualified: Partner is offline. `;
    } else if (!isKyc) {
      decision_reason += `Disqualified: Partner KYC not verified. `;
    } else if (!isWithinRadius) {
      decision_reason += `Disqualified: Partner distance (${distanceKm.toFixed(1)}km) exceeds max search radius (${rules.max_search_radius_km}km). `;
    } else if (!isUnderWorkloadCap) {
      decision_reason += `Disqualified: Partner active workload (${partner.active_workload}) at capacity cap (${rules.max_active_orders_per_partner}). `;
    } else {
      decision_reason += `High proximity (${distanceKm.toFixed(1)}km, ETA ${etaMinutes}m), ${partner.rating}⭐ rating, ${partner.active_workload} active orders, ${analytics.completion_rate}% completion rate. `;
    }

    return {
      partner,
      is_eligible: isEligible,
      total_score,
      decision_reason,
      scoring_breakdown: {
        total_score,
        factor_scores: {
          distance: Number(s_distance.toFixed(1)),
          gps: Number(s_gps.toFixed(1)),
          online_status: Number(s_online.toFixed(1)),
          shift_status: Number(s_shift.toFixed(1)),
          kyc: Number(s_kyc.toFixed(1)),
          fraud_score: Number(s_fraud.toFixed(1)),
          workload: Number(s_workload.toFixed(1)),
          vehicle: Number(s_vehicle.toFixed(1)),
          avg_delivery_time: Number(s_avg_delivery_time.toFixed(1)),
          acceptance_rate: Number(s_acceptance_rate.toFixed(1)),
          completion_rate: Number(s_completion_rate.toFixed(1)),
          rating: Number(s_rating.toFixed(1)),
          geofence: Number(s_geofence.toFixed(1)),
          traffic_delay: Number(s_traffic_delay.toFixed(1)),
          estimated_arrival: Number(s_estimated_arrival.toFixed(1)),
          idle_time: Number(s_idle_time.toFixed(1)),
        },
        weights,
        raw_metrics: {
          distance_km: Number(distanceKm.toFixed(2)),
          eta_minutes: etaMinutes,
          gps_age_minutes: Number(gpsAgeMinutes.toFixed(1)),
          idle_minutes: Number(idleMinutes.toFixed(1)),
          active_workload: partner.active_workload,
          fraud_risk_score: fraudRisk,
          rating: partner.rating,
          acceptance_rate: analytics.acceptance_rate,
          completion_rate: analytics.completion_rate,
          vehicle_type: partner.vehicle_type,
        },
      },
    };
  }

  /**
   * Automatic Fallback if a partner declines or assignment is rejected.
   */
  static async fallbackReassign({ orderId, failedPartnerId, reason = 'declined' }) {
    const logs = await DispatchModel.getLogs({ order_id: orderId, limit: 10 });
    const eligibleLogs = logs.filter((l) => l.partner_id !== failedPartnerId && l.status !== 'disqualified');

    if (eligibleLogs.length > 0) {
      const fallbackWinner = eligibleLogs[0];
      await DispatchModel.assignOrderToPartner(orderId, fallbackWinner.partner_id);

      const dispatchRunId = crypto.randomUUID();
      await DispatchModel.createDispatchHistory({
        dispatch_run_id: dispatchRunId,
        order_id: orderId,
        assigned_partner_id: fallbackWinner.partner_id,
        trigger_type: 'fallback',
        attempt_number: 2,
        status: 'reassigned',
        candidates_evaluated: eligibleLogs.length,
        ai_decision_summary: `Fallback reassigned to next best partner ${fallbackWinner.partner_name} after previous partner ${failedPartnerId} ${reason}.`,
        execution_time_ms: 120,
      });

      return {
        success: true,
        order_id: orderId,
        reassigned_partner_id: fallbackWinner.partner_id,
        reason: `Reassigned to fallback candidate ${fallbackWinner.partner_name}`,
      };
    }

    // Re-evaluate from scratch
    return await this.evaluateOrderDispatch({ orderId, triggerType: 'retry', attemptNumber: 2 });
  }
}

module.exports = DispatchEngineService;
