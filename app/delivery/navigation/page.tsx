"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Navigation,
  MapPin,
  Clock,
  Gauge,
  Wifi,
  WifiOff,
  Zap,
  RefreshCw,
  TrendingUp,
  Fuel,
  ShieldCheck,
  AlertTriangle,
  Compass,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import {
  useAssignedOrders,
  useDeliveryDashboard,
  useDeliveryRoute,
} from "@/hooks/useDeliveryData";
import { useDeliveryLiveTracking } from "@/hooks/useDeliveryLiveTracking";
import { useRouteOptimization } from "@/hooks/useRouteOptimization";
import { RouteOptimizationMode } from "@/lib/routeOptimization/types";

const UnifiedTrackingMap = dynamic(() => import("@/components/tracking/UnifiedTrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] md:h-[460px] rounded-3xl border border-border bg-section animate-pulse" />
  ),
});

export default function DeliveryNavigationPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const { data: assigned } = useAssignedOrders();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [optMode, setOptMode] = useState<RouteOptimizationMode["type"]>("fastest");

  const activeId = selectedId || assigned?.[0]?.id || null;
  const activeOrder = assigned?.find((o) => o.id === activeId) || assigned?.[0] || null;
  const online = Boolean(dashboard?.is_online);

  const { data: fallbackRoute } = useDeliveryRoute(activeId);
  const { position, distanceKm: liveDistance, etaMinutes: liveEta, geoError, connected, offline } = useDeliveryLiveTracking({
    orderId: activeId,
    enabled: online && Boolean(activeId),
  });

  const orderIds = useMemo(() => (assigned || []).map((o) => o.id), [assigned]);

  const { route: aiRoute, isOptimizing, triggerRecalculate } = useRouteOptimization(
    orderIds,
    position ? { lat: position.lat, lng: position.lng } : null,
    optMode
  );

  const restaurantPoint = useMemo(
    () =>
      activeOrder
        ? { lat: activeOrder.restaurant.lat, lng: activeOrder.restaurant.lng, label: activeOrder.restaurant.name }
        : null,
    [activeOrder]
  );

  const customerPoint = useMemo(
    () => (activeOrder ? { lat: activeOrder.customer.lat, lng: activeOrder.customer.lng, label: "Drop-off" } : null),
    [activeOrder]
  );

  const riderPoint = position
    ? { lat: position.lat, lng: position.lng, label: "You" }
    : fallbackRoute
      ? { lat: fallbackRoute.partner_location.lat, lng: fallbackRoute.partner_location.lng, label: "You" }
      : null;

  const distance = liveDistance ?? aiRoute?.remainingDistanceKm ?? fallbackRoute?.distance_km ?? null;
  const eta = liveEta ?? aiRoute?.remainingDurationMin ?? fallbackRoute?.duration_min ?? null;

  const stage = String(activeOrder?.assignment_status || activeOrder?.order_status || "").toLowerCase();
  const pickedUp = ["picked_up", "on_the_way", "out_for_delivery", "near_customer"].some((s) => stage.includes(s));

  const navigateUrl = useMemo(() => {
    if (fallbackRoute) return pickedUp ? fallbackRoute.google_maps_dropoff_url : fallbackRoute.google_maps_pickup_url;
    const dest = pickedUp ? customerPoint : restaurantPoint;
    if (!dest) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
  }, [fallbackRoute, pickedUp, customerPoint, restaurantPoint]);

  const trafficLevel = aiRoute?.trafficLevel || "normal";
  const trafficBadgeColor =
    trafficLevel === "severe"
      ? "bg-red-100 text-red-700 border-red-200"
      : trafficLevel === "heavy"
        ? "bg-amber-100 text-amber-700 border-amber-200"
        : trafficLevel === "low"
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-blue-100 text-blue-700 border-blue-200";

  return (
    <DeliveryShell title="Navigation" online={online}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary fill-primary" /> AI Smart Navigation
          </h1>
          <p className="text-sm text-gray-text mt-1">
            Dynamic AI route optimization, traffic updates, multi-stop order sequencing & live GPS tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
              connected && !offline
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {connected && !offline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {offline ? "Offline" : connected ? "Live tracking" : "Reconnecting…"}
          </div>
          <button
            type="button"
            onClick={() => triggerRecalculate("manual")}
            disabled={isOptimizing}
            className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-1.5 rounded-full bg-primary text-white hover:bg-primary-hover shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isOptimizing ? "animate-spin" : ""}`} />
            {isOptimizing ? "Optimizing…" : "Recalculate Route"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Orders & Optimization Options */}
        <div className="lg:col-span-1 space-y-4">
          {/* Optimization Mode Selector */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-gray-text mb-3">AI Optimization Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "fastest", label: "Fastest", icon: Zap },
                  { id: "shortest", label: "Shortest", icon: Compass },
                  { id: "lowest_traffic", label: "Traffic Bypass", icon: AlertTriangle },
                  { id: "fuel_efficient", label: "Eco Fuel", icon: Fuel },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setOptMode(m.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    optMode === m.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-white text-gray-text hover:bg-section"
                  }`}
                >
                  <m.icon className="w-4 h-4 shrink-0" />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <h2 className="text-lg font-black text-foreground">Active Deliveries</h2>
          {(assigned || []).map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full text-left border rounded-2xl p-4 transition-colors ${
                activeId === order.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-white hover:bg-section"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground">{order.restaurant.name}</p>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Stop 1
                </span>
              </div>
              <p className="text-xs text-gray-text mt-1 line-clamp-2">{order.customer.address}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-xs">
                <span className="font-semibold text-gray-500">₹{order.total_amount}</span>
                <Link
                  href={`/delivery/orders/${order.id}`}
                  className="font-bold text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Details →
                </Link>
              </div>
            </button>
          ))}

          {!assigned?.length && (
            <p className="text-sm text-gray-text bg-white border border-border rounded-2xl p-6 text-center shadow-sm">
              Accept an order to start live navigation.
            </p>
          )}

          {geoError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{geoError}. Enable location access for live GPS.</span>
            </div>
          )}

          {/* Turn-by-Turn Instructions */}
          {aiRoute?.turnInstructions && aiRoute.turnInstructions.length > 0 && (
            <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-gray-text mb-3">Turn-by-Turn Directions</p>
              <div className="space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {aiRoute.turnInstructions.map((turn, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs pb-2 border-b border-border/40 last:border-0 last:pb-0">
                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{turn.instruction}</p>
                      <p className="text-[11px] text-gray-text mt-0.5">
                        {turn.distanceKm} km · ~{turn.durationMin} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Map & Metrics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-primary" /> Distance
              </p>
              <p className="text-lg font-black text-foreground mt-0.5">
                {distance != null ? `${Number(distance).toFixed(1)} km` : "—"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" /> ETA
              </p>
              <p className="text-lg font-black text-primary mt-0.5">{eta != null ? `${eta} min` : "—"}</p>
            </div>

            <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                <Gauge className="w-3 h-3 text-primary" /> Speed
              </p>
              <p className="text-lg font-black text-foreground mt-0.5">
                {position?.speed != null ? `${Math.round(position.speed * 3.6)} km/h` : "25 km/h"}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" /> Traffic
              </p>
              <span className={`inline-block text-xs font-black px-2.5 py-0.5 rounded-full border mt-1 capitalize ${trafficBadgeColor}`}>
                {trafficLevel}
              </span>
            </div>
          </div>

          {/* AI Optimization Efficiency Card */}
          {aiRoute && (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                  {aiRoute.optimizationScore.totalScore}%
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">AI Route Efficiency Score</p>
                  <p className="text-[11px] text-gray-text">
                    Fuel Saved: ~{aiRoute.fuelEstimate.savingsVsDefault}% ({aiRoute.fuelEstimate.estimatedLiters} L)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-200">
                  {aiRoute.optimizationScore.onTimeProbability}% On-Time Confidence
                </span>
              </div>
            </div>
          )}

          {/* Unified Interactive Map */}
          <UnifiedTrackingMap
            restaurant={restaurantPoint}
            customer={customerPoint}
            rider={riderPoint}
            polyline={aiRoute?.polyline}
            waypoints={aiRoute?.waypoints}
            heightClass="h-[340px] md:h-[460px]"
          />

          {/* Next Stop Indicator & Action Buttons */}
          <div className="bg-white border border-border rounded-2xl p-4 space-y-3 shadow-sm">
            {aiRoute?.nextStop && (
              <div className="flex items-center justify-between bg-section rounded-xl p-3 border border-border">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-primary">Next Stop</p>
                  <p className="text-sm font-black text-foreground">{aiRoute.nextStop.name}</p>
                </div>
                <span className="text-xs font-bold text-gray-600 bg-white px-2.5 py-1 rounded-lg border">
                  {aiRoute.nextStop.type === "pickup" ? "Pickup" : "Drop-off"}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => triggerRecalculate("manual")}
                disabled={isOptimizing}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-extrabold border border-primary text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                Optimize Route Sequence
              </button>

              <a
                href={navigateUrl || undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!navigateUrl}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-black text-white transition-all shadow-button ${
                  navigateUrl ? "bg-primary hover:bg-primary-hover" : "bg-gray-300 pointer-events-none"
                }`}
              >
                <Navigation className="w-5 h-5" />
                Launch Google Maps ({pickedUp ? "Customer" : "Restaurant"})
              </a>
            </div>
          </div>
        </div>
      </div>
    </DeliveryShell>
  );
}
