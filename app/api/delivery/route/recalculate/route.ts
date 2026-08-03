import { NextResponse } from "next/server";
import { routeEngine } from "@/lib/routeOptimization/engine";
import { LatLng, RecalculateRouteRequest } from "@/lib/routeOptimization/types";

export async function POST(request: Request) {
  try {
    const body: RecalculateRouteRequest = await request.json();

    const { partnerId, currentLat, currentLng, orderIds = [], reason = "manual" } = body;

    if (currentLat == null || currentLng == null) {
      return NextResponse.json(
        { success: false, error: "Missing required lat/lng coordinates" },
        { status: 400 }
      );
    }

    const currentLocation: LatLng = { lat: currentLat, lng: currentLng };

    // Waypoints for recalculation
    const waypoints = [
      {
        id: "wp_recalc_rest",
        orderId: orderIds[0] || "ord_101",
        name: "Restation Point",
        address: "Current Active Pickup",
        type: "pickup" as const,
        lat: currentLat + 0.005,
        lng: currentLng + 0.004,
        priorityScore: 85,
      },
      {
        id: "wp_recalc_cust",
        orderId: orderIds[0] || "ord_101",
        name: "Customer Destination",
        address: "Re-routed Destination",
        type: "dropoff" as const,
        lat: currentLat + 0.018,
        lng: currentLng + 0.012,
        priorityScore: 90,
      },
    ];

    const recalculatedRoute = await routeEngine.optimizeRoute({
      partnerId: partnerId || "partner_demo_1",
      currentLocation,
      waypoints,
      mode: "fastest",
      trafficLevel: reason === "traffic" ? "heavy" : "normal",
    });

    return NextResponse.json({
      success: true,
      message: `Route successfully recalculated (${reason})`,
      data: {
        ...recalculatedRoute,
        recalculateReason: reason,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to recalculate route" },
      { status: 500 }
    );
  }
}
