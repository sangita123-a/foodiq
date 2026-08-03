import { NextResponse } from "next/server";
import { routeEngine } from "@/lib/routeOptimization/engine";
import { LatLng, RouteWaypoint } from "@/lib/routeOptimization/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get("partner_id") || "partner_demo_1";
    const orderIdsStr = searchParams.get("order_ids") || "";
    const mode = (searchParams.get("mode") || "fastest") as any;

    const orderIds = orderIdsStr
      ? orderIdsStr.split(",").map((s) => s.trim()).filter(Boolean)
      : ["ord_101", "ord_102"];

    // Default partner starting position (Bangalore city center or dynamic)
    const currentLocation: LatLng = {
      lat: parseFloat(searchParams.get("lat") || "12.9716"),
      lng: parseFloat(searchParams.get("lng") || "77.5946"),
    };

    // Generate waypoints for demo/active orders
    const waypoints: Array<Omit<RouteWaypoint, "sequenceOrder" | "status">> = [
      {
        id: "wp_rest_1",
        orderId: orderIds[0] || "ord_101",
        name: "Spice Garden Restaurant",
        address: "Indiranagar 100ft Rd, Bengaluru",
        type: "pickup",
        lat: currentLocation.lat + 0.008,
        lng: currentLocation.lng + 0.005,
        priorityScore: 75,
      },
      {
        id: "wp_cust_1",
        orderId: orderIds[0] || "ord_101",
        name: "Customer: Rahul S.",
        address: "5th Block Koramangala, Bengaluru",
        type: "dropoff",
        lat: currentLocation.lat + 0.022,
        lng: currentLocation.lng + 0.015,
        priorityScore: 80,
        slaExpiry: new Date(Date.now() + 25 * 60000).toISOString(),
      },
    ];

    if (orderIds.length > 1) {
      waypoints.push(
        {
          id: "wp_rest_2",
          orderId: orderIds[1],
          name: "Biryani House",
          address: "Koramangala 4th Block, Bengaluru",
          type: "pickup",
          lat: currentLocation.lat + 0.012,
          lng: currentLocation.lng + 0.011,
          priorityScore: 70,
        },
        {
          id: "wp_cust_2",
          orderId: orderIds[1],
          name: "Customer: Ananya M. (VIP)",
          address: "HSR Layout Sector 1, Bengaluru",
          type: "dropoff",
          lat: currentLocation.lat + 0.035,
          lng: currentLocation.lng + 0.028,
          priorityScore: 92,
          slaExpiry: new Date(Date.now() + 18 * 60000).toISOString(),
        }
      );
    }

    const optimizedRoute = await routeEngine.optimizeRoute({
      partnerId,
      currentLocation,
      waypoints,
      mode,
      trafficLevel: "normal",
    });

    return NextResponse.json({
      success: true,
      data: optimizedRoute,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to calculate route" },
      { status: 500 }
    );
  }
}
