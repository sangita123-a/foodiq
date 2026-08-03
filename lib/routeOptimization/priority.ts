import { RouteWaypoint } from "./types";

export interface PriorityInput {
  orderId: string;
  slaExpiry?: string | Date;
  customerPriority?: boolean;
  isVip?: boolean;
  isCod?: boolean;
  isExpress?: boolean;
  orderAmount?: number;
  createdAt?: string | Date;
}

/**
 * Calculates a priority score (0 to 100) for an order or waypoint.
 * Higher score means the order should be prioritized earlier in the route sequence.
 */
export function calculateDeliveryPriorityScore(input: PriorityInput): number {
  let score = 50; // Base score

  // 1. SLA Expiry check (Urgency)
  if (input.slaExpiry) {
    const expiryTime = new Date(input.slaExpiry).getTime();
    const now = Date.now();
    const minutesLeft = (expiryTime - now) / 60000;

    if (minutesLeft <= 0) {
      score += 40; // Overdue SLA — highest priority
    } else if (minutesLeft < 15) {
      score += 30; // Expiring soon (<15 min)
    } else if (minutesLeft < 30) {
      score += 15; // Moderately urgent (<30 min)
    } else if (minutesLeft > 60) {
      score -= 10; // Plenty of time
    }
  }

  // 2. VIP Customer Priority
  if (input.isVip) {
    score += 15;
  } else if (input.customerPriority) {
    score += 10;
  }

  // 3. Express Delivery
  if (input.isExpress) {
    score += 20;
  }

  // 4. Cash on Delivery (COD) — slight priority to ensure cash collection on time
  if (input.isCod) {
    score += 5;
  }

  // 5. Order Amount weight (high value orders get slight boost)
  if (input.orderAmount && input.orderAmount > 1000) {
    score += 5;
  }

  // 6. Wait time / Order age
  if (input.createdAt) {
    const createdTime = new Date(input.createdAt).getTime();
    const waitingMinutes = (Date.now() - createdTime) / 60000;
    if (waitingMinutes > 45) {
      score += 15;
    } else if (waitingMinutes > 30) {
      score += 10;
    }
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

/**
 * Sorts waypoints taking into account dependency rules:
 * - Pickups MUST happen before Dropoffs for the same order
 * - Higher priority scores come earlier when feasible
 */
export function prioritizeWaypoints(waypoints: RouteWaypoint[]): RouteWaypoint[] {
  // Sort dropoffs by priority score descending
  const result = [...waypoints];

  result.sort((a, b) => {
    // Pickups take precedence over dropoffs when at the start
    if (a.type === "pickup" && b.type === "dropoff") {
      if (a.orderId === b.orderId) return -1; // Same order: pickup first
    }
    if (a.type === "dropoff" && b.type === "pickup") {
      if (a.orderId === b.orderId) return 1; // Same order: pickup first
    }

    const scoreA = a.priorityScore ?? 50;
    const scoreB = b.priorityScore ?? 50;
    return scoreB - scoreA;
  });

  // Ensure validity constraint: No dropoff before its corresponding pickup
  const visitedOrders = new Set<string>();
  const validOrdered: RouteWaypoint[] = [];

  // Separate pickups and dropoffs
  const pickups = result.filter((w) => w.type === "pickup");
  const dropoffs = result.filter((w) => w.type === "dropoff");
  const others = result.filter((w) => w.type !== "pickup" && w.type !== "dropoff");

  // Push non-order waypoints (e.g. current location) first
  validOrdered.push(...others);

  // Push all pickups first (or interleaved legally)
  for (const p of pickups) {
    validOrdered.push(p);
    if (p.orderId) visitedOrders.add(p.orderId);
  }

  // Then push dropoffs
  for (const d of dropoffs) {
    validOrdered.push(d);
  }

  // Re-index sequenceOrder
  return validOrdered.map((wp, idx) => ({
    ...wp,
    sequenceOrder: idx + 1,
  }));
}
