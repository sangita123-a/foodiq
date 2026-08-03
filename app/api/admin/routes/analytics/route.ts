import { NextResponse } from "next/server";
import { RouteAnalyticsSummary } from "@/lib/routeOptimization/types";

export async function GET() {
  try {
    const analytics: RouteAnalyticsSummary = {
      averageEtaMin: 18.5,
      averageDelayMin: 1.8,
      totalDistanceKm: 428.4,
      totalFuelLiters: 10.71,
      totalFuelCost: 1092,
      routeEfficiencyPct: 94.2,
      ordersPerHour: 3.6,
      idleTimeMin: 11.2,
      onTimeDeliveryRate: 97.8,
      activeRidersCount: 24,
      delayedDeliveriesCount: 1,
    };

    const trafficHeatmap = [
      { zone: "Koramangala", trafficLevel: "heavy", activeRiders: 8, avgSpeedKmH: 18 },
      { zone: "Indiranagar", trafficLevel: "normal", activeRiders: 6, avgSpeedKmH: 26 },
      { zone: "HSR Layout", trafficLevel: "low", activeRiders: 5, avgSpeedKmH: 32 },
      { zone: "Whitefield", trafficLevel: "severe", activeRiders: 5, avgSpeedKmH: 12 },
    ];

    const modeUsageBreakdown = {
      fastest: 62, // %
      shortest: 18,
      fuel_efficient: 12,
      lowest_traffic: 8,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary: analytics,
        trafficHeatmap,
        modeUsageBreakdown,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch route analytics" },
      { status: 500 }
    );
  }
}
