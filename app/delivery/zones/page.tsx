"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  MapPin,
  ShieldCheck,
  RefreshCw,
  Navigation,
  CheckCircle2,
  AlertOctagon,
  Info,
  Map as MapIcon,
  Clock,
  ShieldAlert,
  Compass,
  PackageCheck,
  PackageX,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import DeliveryZoneMap from "@/components/delivery/DeliveryZoneMap";
import { isClientAuthenticated } from "@/lib/authSession";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  fetchAssignedZones,
  fetchCurrentZoneStatus,
  fetchNearbyZones,
  fetchAllowedOrders,
  type DeliveryZone,
  type CurrentZoneStatus,
} from "@/services/zonesApi";

const BREADCRUMB_LIMIT = 40;
const GPS_UPDATE_THROTTLE_MS = 4000;

export default function DeliveryZonesPage() {
  const router = useRouter();

  const [gps, setGps] = useState<{ lat: number; lng: number; heading?: number | null; accuracy?: number | null } | null>(
    null
  );
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ lat: number; lng: number }[]>([]);
  const [realtimeWarning, setRealtimeWarning] = useState<string | null>(null);
  const lastGpsUpdateRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/delivery/login");
    }
  }, [router]);

  // Continuous GPS watch (throttled) — feeds the map, the current-zone check, and nearby zones.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsError("Geolocation is not supported by this browser/device.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: Number.isNaN(pos.coords.heading as number) ? null : pos.coords.heading,
          accuracy: pos.coords.accuracy,
        };
        setGpsError(null);
        if (now - lastGpsUpdateRef.current < GPS_UPDATE_THROTTLE_MS) {
          setGps((prev) => (prev ? { ...prev, ...next } : next));
          return;
        }
        lastGpsUpdateRef.current = now;
        setGps(next);
        setBreadcrumb((prev) => [...prev.slice(-(BREADCRUMB_LIMIT - 1)), { lat: next.lat, lng: next.lng }]);
      },
      (err) => setGpsError(err.message || "Failed to acquire GPS location. Enable location access to use geo-fencing."),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const {
    data: assignedZones,
    error: zonesError,
    isLoading: loadingZones,
    mutate: mutateZones,
  } = useSWR<DeliveryZone[]>("/api/delivery/zones", fetchAssignedZones);

  const {
    data: currentStatus,
    error: statusError,
    isLoading: loadingStatus,
    mutate: mutateStatus,
  } = useSWR<CurrentZoneStatus>(
    gps ? ["/api/delivery/current-zone", gps.lat, gps.lng] : null,
    () => fetchCurrentZoneStatus(gps!.lat, gps!.lng),
    { refreshInterval: 10000 }
  );

  const { data: nearbyData, isLoading: loadingNearby } = useSWR(
    gps ? ["/api/delivery/zones/nearby", gps.lat, gps.lng] : null,
    () => fetchNearbyZones(gps!.lat, gps!.lng, 10),
    { refreshInterval: 30000 }
  );

  const { data: allowedOrdersData } = useSWR("/api/delivery/allowed-orders", fetchAllowedOrders, {
    refreshInterval: 20000,
  });

  const restaurantMarkers = useMemo(() => {
    const orders = allowedOrdersData?.orders || [];
    const seen = new Map<string, { id: string; name: string; lat: number; lng: number }>();
    orders.forEach((o) => {
      if (o.restaurant_id && o.restaurant_lat != null && o.restaurant_lng != null && !seen.has(o.restaurant_id)) {
        seen.set(o.restaurant_id, {
          id: o.restaurant_id,
          name: o.restaurant_name || "Restaurant",
          lat: Number(o.restaurant_lat),
          lng: Number(o.restaurant_lng),
        });
      }
    });
    return Array.from(seen.values());
  }, [allowedOrdersData]);

  const handleRefresh = useCallback(() => {
    mutateZones();
    mutateStatus();
  }, [mutateZones, mutateStatus]);

  // Real-time socket event listeners for geo-fencing warnings
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onEnter = () => {
      setRealtimeWarning(null);
      mutateStatus();
    };
    const onExit = () => {
      mutateStatus();
    };
    const onWarning = (data: { warning_level: "first_warning" | "second_warning"; distance_meters: number }) => {
      if (data.warning_level === "second_warning") {
        setRealtimeWarning(
          `WARNING: You are ${data.distance_meters}m outside your assigned zone! Order assignment will pause until you return.`
        );
      } else {
        setRealtimeWarning(`Notice: You are ${data.distance_meters}m outside your assigned zone perimeter.`);
      }
    };
    const onChanged = () => {
      mutateZones();
      mutateStatus();
    };

    socket.on(SOCKET_EVENTS.DELIVERY_ZONE_ENTER, onEnter);
    socket.on(SOCKET_EVENTS.DELIVERY_ZONE_EXIT, onExit);
    socket.on(SOCKET_EVENTS.DELIVERY_ZONE_WARNING, onWarning);
    socket.on(SOCKET_EVENTS.DELIVERY_ZONE_CHANGED, onChanged);

    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_ZONE_ENTER, onEnter);
      socket.off(SOCKET_EVENTS.DELIVERY_ZONE_EXIT, onExit);
      socket.off(SOCKET_EVENTS.DELIVERY_ZONE_WARNING, onWarning);
      socket.off(SOCKET_EVENTS.DELIVERY_ZONE_CHANGED, onChanged);
    };
  }, [mutateZones, mutateStatus]);

  const zones = assignedZones || [];
  const nearbyZones = (nearbyData?.zones || []).filter((z) => !zones.some((a) => a.id === z.id));
  const hasFetchError = Boolean(zonesError || statusError);
  const mapZones = [...zones, ...nearbyZones];

  return (
    <DeliveryShell title="Geo-fencing & Delivery Zones">
      <div className="space-y-6">
        {hasFetchError && (
          <div className="p-4 rounded-xl flex items-center gap-3 border shadow-sm bg-red-500/10 border-red-500/30 text-red-600">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-sm font-semibold">
              Failed to load zone data. Check your connection and try again.
            </div>
            <button
              onClick={handleRefresh}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {(realtimeWarning || (currentStatus && currentStatus.warning_level !== "none")) && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
              currentStatus?.warning_level === "second_warning" || realtimeWarning?.includes("WARNING")
                ? "bg-red-500/10 border-red-500/30 text-red-600"
                : "bg-amber-500/10 border-amber-500/30 text-amber-600"
            }`}
          >
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div className="flex-1 text-sm font-semibold">
              {realtimeWarning ||
                (currentStatus?.warning_level === "second_warning"
                  ? `Critical Alert: You are ${currentStatus.distance_to_boundary_meters}m outside your assigned delivery zone. Please return to avoid an order-assignment pause.`
                  : `Zone Notice: You are ${currentStatus?.distance_to_boundary_meters}m away from your assigned zone boundary.`)}
            </div>
          </div>
        )}

        {/* Live GPS & Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Status</span>
              {loadingStatus ? (
                <span className="w-20 h-5 rounded-full bg-section animate-pulse" />
              ) : currentStatus?.in_zone ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Inside Zone
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20">
                  <AlertOctagon className="w-3.5 h-3.5" /> Outside Zone
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {currentStatus?.current_zone?.name || "Unassigned / Off Perimeter"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStatus?.current_zone
                ? `Active ${currentStatus.current_zone.zone_type} zone in ${currentStatus.current_zone.city}`
                : "Return to your assigned delivery zone to receive high-priority orders."}
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Distance to Boundary
              </span>
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {currentStatus?.distance_to_boundary_meters != null
                ? `${currentStatus.distance_to_boundary_meters} meters`
                : "Calculating..."}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStatus?.in_zone
                ? "Distance to nearest edge of assigned perimeter."
                : "Distance required to re-enter your assigned delivery zone."}
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Order Eligibility
              </span>
              {currentStatus?.orders_eligible ? (
                <PackageCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <PackageX className="w-4 h-4 text-red-600" />
              )}
            </div>
            <h3
              className={`text-xl font-bold ${
                currentStatus?.orders_eligible === false ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {currentStatus == null ? "—" : currentStatus.orders_eligible ? "Eligible" : "Paused"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStatus?.orders_eligible === false
                ? "New order assignment is paused until you return to your zone."
                : "You can receive new order assignments right now."}
            </p>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live GPS</span>
              <button
                onClick={handleRefresh}
                className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Refresh zone status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {gps ? (
              <div>
                <h3 className="text-sm font-semibold text-foreground font-mono">
                  {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                </h3>
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  GPS Active
                  {gps.accuracy != null && <span className="text-muted-foreground">&plusmn;{Math.round(gps.accuracy)}m</span>}
                </p>
                {gps.heading != null && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Compass className="w-3 h-3" /> Heading {Math.round(gps.heading)}&deg;
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-amber-600 font-medium">{gpsError || "Acquiring satellite GPS lock..."}</p>
            )}
          </div>
        </div>

        {/* Live Map */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-primary" /> Live Zone Map
            </h2>
          </div>
          <DeliveryZoneMap
            zones={mapZones}
            activeZoneId={currentStatus?.current_zone?.id || null}
            rider={gps}
            restaurants={restaurantMarkers}
            breadcrumb={breadcrumb}
          />
        </div>

        {/* Assigned Zones List */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> My Assigned Zones
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Orders are automatically matched and restricted based on these territories.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
              {zones.length} Active Zone{zones.length === 1 ? "" : "s"}
            </span>
          </div>

          {loadingZones ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-section animate-pulse" />
              ))}
            </div>
          ) : zones.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-border rounded-xl">
              <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No Delivery Zones Assigned</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Contact your fleet administrator or dispatcher to be assigned to polygon or circle delivery zones.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`p-4 rounded-xl border transition-all ${
                    currentStatus?.current_zone?.id === zone.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{zone.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {zone.city}
                        {zone.state ? `, ${zone.state}` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {zone.zone_type}
                    </span>
                  </div>

                  {zone.zone_type === "circle" && zone.radius_km && (
                    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Radius: {zone.radius_km} km
                    </div>
                  )}

                  {zone.assigned_at && (
                    <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span>Assigned:</span>
                      <span className="font-medium">{new Date(zone.assigned_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Zones (informational, not assigned) */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" /> Nearby Zones
            </h2>
            <span className="text-xs font-semibold px-3 py-1 bg-section text-muted-foreground rounded-full">
              Within 10 km
            </span>
          </div>

          {loadingNearby ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-section animate-pulse" />
              ))}
            </div>
          ) : nearbyZones.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No other active delivery zones nearby right now.
            </p>
          ) : (
            <div className="space-y-2">
              {nearbyZones.map((zone) => (
                <div
                  key={zone.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">{zone.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {zone.city}
                      {zone.state ? `, ${zone.state}` : ""} &middot; {zone.zone_type}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {zone.distance_meters != null
                      ? zone.distance_meters === 0
                        ? "Inside"
                        : `${(zone.distance_meters / 1000).toFixed(1)} km away`
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DeliveryShell>
  );
}
