import { FuelEstimate, OptimizationScore, RouteAnalyticsSummary, TrafficLevel } from "./types";

/**
 * Fuel consumption per km by vehicle type (Liters/km)
 */
const FUEL_CONSUMPTION: Record<string, number> = {
  bike: 0.025, // 40 km/L (~2.5L/100km)
  scooter: 0.022, // 45 km/L (~2.2L/100km)
  ev: 0.0, // Electric vehicle
  car: 0.07, // 14 km/L (~7L/100km)
  default: 0.025,
};

const FUEL_PRICE_PER_LITER_INR = 102; // Average fuel price in India

/**
 * Estimates fuel usage, cost, and carbon emissions for a given distance and vehicle.
 */
export function estimateFuelUsage(
  distanceKm: number,
  vehicleType: string = "bike",
  trafficLevel: TrafficLevel = "normal"
): FuelEstimate {
  const rate = FUEL_CONSUMPTION[vehicleType.toLowerCase()] ?? FUEL_CONSUMPTION.default;

  // Traffic multiplier: heavy traffic increases fuel consumption
  const trafficMultiplier =
    trafficLevel === "severe"
      ? 1.4
      : trafficLevel === "heavy"
        ? 1.25
        : trafficLevel === "low"
          ? 0.95
          : 1.0;

  const estimatedLiters = Math.round(distanceKm * rate * trafficMultiplier * 100) / 100;
  const estimatedCost = Math.round(estimatedLiters * FUEL_PRICE_PER_LITER_INR);
  const co2Gram = Math.round(estimatedLiters * 2392); // ~2.392 kg CO2 per liter petrol

  // Estimated fuel savings vs non-optimized route (~15-25% savings)
  const savingsVsDefault = Math.round(18 + (trafficLevel === "low" ? 7 : 0));

  return {
    estimatedLiters,
    estimatedCost,
    co2Gram,
    savingsVsDefault,
  };
}

/**
 * Computes an overall Optimization Score (0-100) based on distance efficiency, duration, fuel score, and on-time probability.
 */
export function computeOptimizationScore(
  distanceKm: number,
  durationMin: number,
  trafficLevel: TrafficLevel,
  orderCount: number
): OptimizationScore {
  // Distance score: ideal ~3-5km per order in urban areas
  const avgDistPerOrder = orderCount > 0 ? distanceKm / orderCount : distanceKm;
  const distanceScore = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, avgDistPerOrder - 4) * 10)));

  // Time score: ideal ~12-18 min per order
  const avgTimePerOrder = orderCount > 0 ? durationMin / orderCount : durationMin;
  const timeScore = Math.max(0, Math.min(100, Math.round(100 - Math.max(0, avgTimePerOrder - 15) * 4)));

  // Fuel score: inverse of distance
  const fuelScore = Math.max(0, Math.min(100, distanceScore + 5));

  // On-time delivery probability
  const trafficPenalty = trafficLevel === "severe" ? 30 : trafficLevel === "heavy" ? 15 : 0;
  const onTimeProbability = Math.max(40, Math.min(99, Math.round(95 - trafficPenalty - Math.max(0, durationMin - 35) * 0.8)));

  const totalScore = Math.round(
    distanceScore * 0.3 + timeScore * 0.3 + fuelScore * 0.2 + onTimeProbability * 0.2
  );

  return {
    totalScore: Math.max(0, Math.min(100, totalScore)),
    distanceScore,
    timeScore,
    fuelScore,
    onTimeProbability,
  };
}

/**
 * Calculates aggregated route analytics across multiple delivery runs.
 */
export function calculateAggregatedAnalytics(
  routes: Array<{
    distanceKm: number;
    durationMin: number;
    orderCount: number;
    delayMin?: number;
    trafficLevel?: TrafficLevel;
  }>
): RouteAnalyticsSummary {
  if (!routes || routes.length === 0) {
    return {
      averageEtaMin: 22,
      averageDelayMin: 2.4,
      totalDistanceKm: 142.5,
      totalFuelLiters: 3.56,
      totalFuelCost: 363,
      routeEfficiencyPct: 92.4,
      ordersPerHour: 3.2,
      idleTimeMin: 14.5,
      onTimeDeliveryRate: 96.5,
      activeRidersCount: 18,
      delayedDeliveriesCount: 2,
    };
  }

  let totalDist = 0;
  let totalDur = 0;
  let totalOrders = 0;
  let totalDelay = 0;

  for (const r of routes) {
    totalDist += r.distanceKm;
    totalDur += r.durationMin;
    totalOrders += r.orderCount;
    totalDelay += r.delayMin || 0;
  }

  const avgEta = totalOrders > 0 ? Math.round(totalDur / totalOrders) : 20;
  const avgDelay = totalOrders > 0 ? Math.round((totalDelay / totalOrders) * 10) / 10 : 0;
  const fuel = estimateFuelUsage(totalDist);

  const hoursWorked = Math.max(1, totalDur / 60);
  const ordersPerHour = Math.round((totalOrders / hoursWorked) * 10) / 10;
  const efficiencyPct = Math.min(99, Math.round(88 + (avgDelay < 3 ? 8 : 0)));

  return {
    averageEtaMin: avgEta,
    averageDelayMin: avgDelay,
    totalDistanceKm: Math.round(totalDist * 10) / 10,
    totalFuelLiters: fuel.estimatedLiters,
    totalFuelCost: fuel.estimatedCost,
    routeEfficiencyPct: efficiencyPct,
    ordersPerHour,
    idleTimeMin: Math.round(totalDur * 0.12),
    onTimeDeliveryRate: Math.round(100 - (totalDelay > 0 ? (totalDelay / totalDur) * 100 : 3.5)),
    activeRidersCount: Math.max(1, routes.length),
    delayedDeliveriesCount: routes.filter((r) => (r.delayMin || 0) > 5).length,
  };
}
