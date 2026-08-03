export type TrafficLevel = "low" | "normal" | "heavy" | "severe";

export type DeliveryPriorityType = "express" | "vip" | "cod" | "standard";

export type WaypointType = "pickup" | "dropoff" | "current_location";

export type WaypointStatus = "pending" | "reached" | "completed" | "skipped";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteWaypoint extends LatLng {
  id: string;
  orderId?: string;
  name: string;
  address?: string;
  type: WaypointType;
  sequenceOrder: number;
  status: WaypointStatus;
  estimatedArrival?: string;
  actualArrival?: string;
  slaExpiry?: string;
  priorityScore?: number;
}

export interface OptimizationScore {
  totalScore: number; // 0 - 100
  distanceScore: number;
  timeScore: number;
  fuelScore: number;
  onTimeProbability: number; // 0 - 100%
}

export interface FuelEstimate {
  estimatedLiters: number;
  estimatedCost: number; // INR
  co2Gram: number;
  savingsVsDefault: number; // percentage
}

export interface TurnInstruction {
  instruction: string;
  distanceKm: number;
  durationMin: number;
  type: string;
  location: LatLng;
}

export interface RouteOptimizationMode {
  type: "shortest" | "fastest" | "lowest_traffic" | "fuel_efficient";
  title: string;
  description: string;
}

export interface OptimizedRoute {
  id: string;
  partnerId: string;
  orderIds: string[];
  mode: RouteOptimizationMode["type"];
  waypoints: RouteWaypoint[];
  polyline: string; // encoded or lat-lng points string
  coordinates: LatLng[];
  totalDistanceKm: number;
  totalDurationMin: number;
  trafficLevel: TrafficLevel;
  optimizationScore: OptimizationScore;
  fuelEstimate: FuelEstimate;
  turnInstructions: TurnInstruction[];
  nextStop: RouteWaypoint | null;
  remainingDistanceKm: number;
  remainingDurationMin: number;
  createdAt: string;
  updatedAt: string;
}

export interface RouteHistoryItem {
  id: string;
  partnerId: string;
  routeId: string;
  action: "optimized" | "rerouted" | "completed" | "cancelled" | "deviated";
  reason?: string;
  oldDistanceKm?: number;
  newDistanceKm?: number;
  oldEtaMin?: number;
  newEtaMin?: number;
  optimizationScore?: number;
  fuelEstimate?: number;
  trafficLevel?: TrafficLevel;
  createdAt: string;
}

export interface RouteAnalyticsSummary {
  averageEtaMin: number;
  averageDelayMin: number;
  totalDistanceKm: number;
  totalFuelLiters: number;
  totalFuelCost: number;
  routeEfficiencyPct: number;
  ordersPerHour: number;
  idleTimeMin: number;
  onTimeDeliveryRate: number;
  activeRidersCount: number;
  delayedDeliveriesCount: number;
}

export interface ActiveRiderRoute {
  partnerId: string;
  partnerName: string;
  vehicleType: string;
  phone: string;
  currentLocation: LatLng;
  activeOrdersCount: number;
  currentRoute: OptimizedRoute | null;
  efficiencyScore: number;
  status: "on_route" | "at_pickup" | "at_dropoff" | "idle" | "delayed";
  speedKmH: number;
  lastUpdated: string;
}

export interface RecalculateRouteRequest {
  partnerId: string;
  currentLat: number;
  currentLng: number;
  orderIds: string[];
  reason?: "deviation" | "traffic" | "address_change" | "restaurant_delay" | "new_order" | "manual";
}
