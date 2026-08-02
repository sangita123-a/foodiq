"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Navigation, MapPin, Clock, Gauge, Wifi, WifiOff } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import {
  useAssignedOrders,
  useDeliveryDashboard,
  useDeliveryRoute,
} from "@/hooks/useDeliveryData";
import { useDeliveryLiveTracking } from "@/hooks/useDeliveryLiveTracking";

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

  const activeId = selectedId || assigned?.[0]?.id || null;
  const activeOrder = assigned?.find((o) => o.id === activeId) || assigned?.[0] || null;
  const online = Boolean(dashboard?.is_online);

  const { data: route } = useDeliveryRoute(activeId);
  const { position, distanceKm, etaMinutes, geoError, connected, offline } = useDeliveryLiveTracking({
    orderId: activeId,
    enabled: online && Boolean(activeId),
  });

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
    : route
      ? { lat: route.partner_location.lat, lng: route.partner_location.lng, label: "You" }
      : null;

  const distance = distanceKm ?? route?.distance_km ?? null;
  const eta = etaMinutes ?? route?.duration_min ?? null;

  const stage = String(activeOrder?.assignment_status || activeOrder?.order_status || "").toLowerCase();
  const pickedUp = ["picked_up", "on_the_way", "out_for_delivery", "near_customer"].some((s) => stage.includes(s));

  const navigateUrl = useMemo(() => {
    if (route) return pickedUp ? route.google_maps_dropoff_url : route.google_maps_pickup_url;
    const dest = pickedUp ? customerPoint : restaurantPoint;
    if (!dest) return null;
    return `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
  }, [route, pickedUp, customerPoint, restaurantPoint]);

  return (
    <DeliveryShell title="Navigation" online={online}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">Live Navigation</h1>
          <p className="text-sm text-gray-text mt-1">
            Google Maps live route, current location, ETA and distance for your active delivery.
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-lg font-black text-foreground">Active Orders</h2>
          {(assigned || []).map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedId(order.id)}
              className={`w-full text-left border rounded-xl p-4 transition-colors ${
                activeId === order.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-white hover:bg-section"
              }`}
            >
              <p className="font-bold text-foreground">{order.restaurant.name}</p>
              <p className="text-xs text-gray-text mt-1 line-clamp-2">{order.customer.address}</p>
              <Link
                href={`/delivery/orders/${order.id}`}
                className="inline-block mt-2 text-xs font-bold text-primary"
                onClick={(e) => e.stopPropagation()}
              >
                Order details
              </Link>
            </button>
          ))}
          {!assigned?.length && (
            <p className="text-sm text-gray-text bg-white border border-border rounded-xl p-6 text-center">
              Accept an order to start live navigation.
            </p>
          )}

          {geoError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              {geoError}. Enable location access to publish live GPS.
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Distance
              </p>
              <p className="text-lg font-black text-foreground">
                {distance != null ? `${distance.toFixed(1)} km` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] flex items-center gap-1">
                <Clock className="w-3 h-3" /> ETA
              </p>
              <p className="text-lg font-black text-primary">{eta != null ? `${eta} min` : "—"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] flex items-center gap-1">
                <Gauge className="w-3 h-3" /> Speed
              </p>
              <p className="text-lg font-black text-foreground">
                {position?.speed != null ? `${Math.round(position.speed * 3.6)} km/h` : "—"}
              </p>
            </div>
          </div>

          <UnifiedTrackingMap
            restaurant={restaurantPoint}
            customer={customerPoint}
            rider={riderPoint}
            heightClass="h-[320px] md:h-[460px]"
          />

          <a
            href={navigateUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!navigateUrl}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-black text-white transition-colors ${
              navigateUrl ? "bg-primary hover:bg-primary/90" : "bg-gray-300 pointer-events-none"
            }`}
          >
            <Navigation className="w-5 h-5" />
            Navigate to {pickedUp ? "Customer" : "Restaurant"}
          </a>
        </div>
      </div>
    </DeliveryShell>
  );
}
