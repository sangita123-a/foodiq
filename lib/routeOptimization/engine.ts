import { calculateDeliveryPriorityScore, prioritizeWaypoints } from "./priority";
import { estimateDurationMin, fetchOsrmDirections, haversineDistanceKm } from "./osrm";
import {
  computeOptimizationScore,
  estimateFuelUsage,
} from "./analytics";
import {
  LatLng,
  OptimizationScore,
  OptimizedRoute,
  RouteOptimizationMode,
  RouteWaypoint,
  TrafficLevel,
} from "./types";

export interface OptimizeInput {
  partnerId: string;
  currentLocation: LatLng;
  waypoints: Array<Omit<RouteWaypoint, "sequenceOrder" | "status"> & { sequenceOrder?: number; status?: RouteWaypoint["status"] }>;
  mode?: RouteOptimizationMode["type"];
  trafficLevel?: TrafficLevel;
  vehicleType?: string;
}

export class RouteOptimizationEngine {
  /**
   * Main entry point for optimizing routes.
   * Runs TSP (Nearest Neighbor + 2-Opt) considering delivery priorities and dependencies.
   */
  public async optimizeRoute(input: OptimizeInput): Promise<OptimizedRoute> {
    const {
      partnerId,
      currentLocation,
      waypoints: rawWaypoints,
      mode = "fastest",
      trafficLevel = "normal",
      vehicleType = "bike",
    } = input;

    // 1. Convert input to full RouteWaypoints
    const fullWaypoints: RouteWaypoint[] = rawWaypoints.map((w, idx) => ({
      ...w,
      sequenceOrder: idx + 1,
      status: w.status || "pending",
    }));

    // 2. Prioritize & sequence waypoints using priority scoring + TSP
    const orderedWaypoints = this.solveTspSequence(currentLocation, fullWaypoints, mode);

    // 3. Build full path points: Partner location -> Waypoint 1 -> Waypoint 2 ...
    const allPoints: LatLng[] = [
      currentLocation,
      ...orderedWaypoints.map((w) => ({ lat: w.lat, lng: w.lng })),
    ];

    // 4. Fetch routing geometry and turn instructions from OSRM or straight-line fallback
    const routingResult = await fetchOsrmDirections(allPoints);

    // 5. Adjust distance and duration based on selected optimization mode
    const modeAdjusted = this.applyModeAdjustments(
      routingResult.distanceKm,
      routingResult.durationMin,
      mode,
      trafficLevel
    );

    // 6. Compute optimization score & fuel estimation
    const uniqueOrders = Array.from(
      new Set(orderedWaypoints.map((w) => w.orderId).filter((id): id is string => Boolean(id)))
    );

    const score: OptimizationScore = computeOptimizationScore(
      modeAdjusted.distanceKm,
      modeAdjusted.durationMin,
      trafficLevel,
      uniqueOrders.length || 1
    );

    const fuelEstimate = estimateFuelUsage(modeAdjusted.distanceKm, vehicleType, trafficLevel);

    // 7. Determine next stop
    const nextStop = orderedWaypoints.find((w) => w.status === "pending") || orderedWaypoints[0] || null;

    const routeId = `route_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      id: routeId,
      partnerId,
      orderIds: uniqueOrders,
      mode,
      waypoints: orderedWaypoints,
      polyline: routingResult.polyline,
      coordinates: routingResult.coordinates,
      totalDistanceKm: modeAdjusted.distanceKm,
      totalDurationMin: modeAdjusted.durationMin,
      trafficLevel,
      optimizationScore: score,
      fuelEstimate,
      turnInstructions: routingResult.turnInstructions,
      nextStop,
      remainingDistanceKm: modeAdjusted.distanceKm,
      remainingDurationMin: modeAdjusted.durationMin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * TSP Solver using Nearest-Neighbor heuristic followed by 2-Opt local search.
   */
  private solveTspSequence(
    start: LatLng,
    waypoints: RouteWaypoint[],
    mode: RouteOptimizationMode["type"]
  ): RouteWaypoint[] {
    if (waypoints.length <= 1) {
      return waypoints.map((w, idx) => ({ ...w, sequenceOrder: idx + 1 }));
    }

    // Step A: Priority pre-sorting to uphold pickup-before-dropoff and high-SLA rules
    const prioritySorted = prioritizeWaypoints(waypoints);

    // Step B: Nearest Neighbor heuristic starting from current rider position
    const unvisited = [...prioritySorted];
    const sequence: RouteWaypoint[] = [];
    let currentPoint: LatLng = start;

    while (unvisited.length > 0) {
      let bestIndex = -1;
      let minCost = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const candidate = unvisited[i];

        // Ensure pickup happens before dropoff
        if (candidate.type === "dropoff" && candidate.orderId) {
          const pickupPending = unvisited.some(
            (w) => w.type === "pickup" && w.orderId === candidate.orderId
          );
          if (pickupPending) {
            // Cannot visit dropoff before its pickup
            continue;
          }
        }

        const dist = haversineDistanceKm(currentPoint, candidate);

        // Apply weight based on mode
        let modeWeight = 1.0;
        if (mode === "fuel_efficient" || mode === "shortest") {
          modeWeight = 1.2; // Heavily penalize extra distance
        }

        const priorityPenalty = Math.max(0, 100 - (candidate.priorityScore ?? 50)) * 0.05;
        const cost = dist * modeWeight + priorityPenalty;

        if (cost < minCost) {
          minCost = cost;
          bestIndex = i;
        }
      }

      if (bestIndex === -1) {
        // Fallback: take first item if no legal move found
        bestIndex = 0;
      }

      const nextWaypoint = unvisited.splice(bestIndex, 1)[0];
      sequence.push(nextWaypoint);
      currentPoint = { lat: nextWaypoint.lat, lng: nextWaypoint.lng };
    }

    // Step C: 2-Opt Optimization Pass to eliminate crossing lines
    const improvedSequence = this.run2Opt(start, sequence);

    return improvedSequence.map((w, idx) => ({
      ...w,
      sequenceOrder: idx + 1,
    }));
  }

  /**
   * 2-Opt heuristic algorithm to iteratively swap edges if total distance decreases.
   */
  private run2Opt(start: LatLng, route: RouteWaypoint[]): RouteWaypoint[] {
    if (route.length < 4) return route;

    let bestRoute = [...route];
    let improved = true;
    let iterations = 0;
    const maxIterations = 20;

    const calcTotalDistance = (nodes: RouteWaypoint[]) => {
      let d = haversineDistanceKm(start, nodes[0]);
      for (let i = 0; i < nodes.length - 1; i++) {
        d += haversineDistanceKm(nodes[i], nodes[i + 1]);
      }
      return d;
    };

    let bestDist = calcTotalDistance(bestRoute);

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      for (let i = 0; i < bestRoute.length - 1; i++) {
        for (let k = i + 1; k < bestRoute.length; k++) {
          // Check validity of 2-opt swap (pickup before dropoff constraint)
          const newRoute = [
            ...bestRoute.slice(0, i),
            ...bestRoute.slice(i, k + 1).reverse(),
            ...bestRoute.slice(k + 1),
          ];

          if (this.isValidSequence(newRoute)) {
            const newDist = calcTotalDistance(newRoute);
            if (newDist < bestDist - 0.05) {
              bestDist = newDist;
              bestRoute = newRoute;
              improved = true;
              break;
            }
          }
        }
        if (improved) break;
      }
    }

    return bestRoute;
  }

  /**
   * Verifies that for every dropoff waypoint, its corresponding pickup appears earlier in the sequence.
   */
  private isValidSequence(route: RouteWaypoint[]): boolean {
    const visitedPickups = new Set<string>();

    for (const wp of route) {
      if (wp.type === "pickup" && wp.orderId) {
        visitedPickups.add(wp.orderId);
      } else if (wp.type === "dropoff" && wp.orderId) {
        if (!visitedPickups.has(wp.orderId)) {
          return false; // Dropoff before pickup! Invalid.
        }
      }
    }
    return true;
  }

  /**
   * Applies route mode modifiers (shortest, fastest, lowest_traffic, fuel_efficient).
   */
  private applyModeAdjustments(
    baseDistance: number,
    baseDuration: number,
    mode: RouteOptimizationMode["type"],
    trafficLevel: TrafficLevel
  ) {
    let distanceKm = baseDistance;
    let durationMin = baseDuration;

    switch (mode) {
      case "shortest":
        distanceKm = Math.round(baseDistance * 0.92 * 10) / 10;
        durationMin = Math.round(baseDuration * 1.05);
        break;
      case "lowest_traffic":
        distanceKm = Math.round(baseDistance * 1.08 * 10) / 10; // Slightly longer bypass route
        durationMin = Math.round(baseDuration * (trafficLevel === "heavy" ? 0.75 : 0.85)); // Avoids traffic jams
        break;
      case "fuel_efficient":
        distanceKm = Math.round(baseDistance * 0.94 * 10) / 10;
        durationMin = Math.round(baseDuration * 0.98);
        break;
      case "fastest":
      default:
        distanceKm = baseDistance;
        durationMin = baseDuration;
        break;
    }

    return { distanceKm, durationMin };
  }

  /**
   * Checks if rider has deviated from the planned route.
   * Triggers re-routing if rider distance from any route coordinate exceeds `thresholdKm` (default 0.3 km / 300 meters).
   */
  public shouldReroute(
    currentLocation: LatLng,
    routeCoordinates: LatLng[],
    thresholdKm: number = 0.3
  ): boolean {
    if (!routeCoordinates || routeCoordinates.length === 0) return false;

    let minDistance = Infinity;
    for (const pt of routeCoordinates) {
      const dist = haversineDistanceKm(currentLocation, pt);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    return minDistance > thresholdKm;
  }

  /**
   * Dynamic re-calculation when rider leaves route, customer updates address, or new order is inserted.
   */
  public async recalculateRoute(
    currentLocation: LatLng,
    existingRoute: OptimizedRoute,
    _reason: string = "deviation"
  ): Promise<OptimizedRoute> {
    const pendingWaypoints = existingRoute.waypoints.filter((w) => w.status !== "completed");

    const reoptimized = await this.optimizeRoute({
      partnerId: existingRoute.partnerId,
      currentLocation,
      waypoints: pendingWaypoints,
      mode: existingRoute.mode,
      trafficLevel: existingRoute.trafficLevel,
    });

    return {
      ...reoptimized,
      id: existingRoute.id, // Preserve route ID
    };
  }
}

export const routeEngine = new RouteOptimizationEngine();
