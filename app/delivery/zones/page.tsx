"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Navigation,
  CheckCircle2,
  AlertOctagon,
  Info,
  Map as MapIcon,
  Clock,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { isClientAuthenticated } from "@/lib/authSession";
import { getAccessToken } from "@/lib/accessToken";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  zone_type: "polygon" | "circle";
  radius_km?: number;
  center_latitude?: number;
  center_longitude?: number;
  assigned_at?: string;
}

interface CurrentZoneStatus {
  in_zone: boolean;
  current_zone: DeliveryZone | null;
  distance_to_boundary_meters: number;
  warning_level: "none" | "first_warning" | "second_warning";
  assigned_zones_count: number;
}

export default function DeliveryZonesPage() {
  const router = useRouter();

  const [assignedZones, setAssignedZones] = useState<DeliveryZone[]>([]);
  const [currentStatus, setCurrentStatus] = useState<CurrentZoneStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [realtimeWarning, setRealtimeWarning] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/delivery/login");
    }
  }, [router]);

  // Fetch assigned zones & zone status
  const fetchZoneData = useCallback(async (lat?: number, lng?: number) => {
    try {
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch assigned zones
      const zonesRes = await fetch("/api/delivery/zones", { headers });
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json();
        setAssignedZones(zonesData.data || []);
      }

      // 2. Fetch current zone status if GPS available
      if (lat != null && lng != null) {
        const statusRes = await fetch(
          `/api/delivery/current-zone?latitude=${lat}&longitude=${lng}`,
          { headers }
        );
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setCurrentStatus(statusData.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch zone details", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Request live GPS location
  const refreshGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser");
      fetchZoneData();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsLocation({ lat, lng });
        setGpsError(null);
        fetchZoneData(lat, lng);
      },
      (err) => {
        setGpsError(err.message || "Failed to acquire GPS location");
        fetchZoneData();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }, [fetchZoneData]);

  // Real-time socket event listeners for geo-fencing warnings
  useEffect(() => {
    refreshGps();

    const socket = getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.DELIVERY_ZONE_ENTER, (data: { zone: DeliveryZone }) => {
        setRealtimeWarning(null);
        if (data?.zone) {
          setCurrentStatus((prev) =>
            prev ? { ...prev, in_zone: true, current_zone: data.zone, warning_level: "none" } : null
          );
        }
      });

      socket.on(SOCKET_EVENTS.DELIVERY_ZONE_EXIT, (data: { distance_meters: number }) => {
        setCurrentStatus((prev) =>
          prev
            ? {
                ...prev,
                in_zone: false,
                current_zone: null,
                distance_to_boundary_meters: data.distance_meters,
              }
            : null
        );
      });

      socket.on(
        SOCKET_EVENTS.DELIVERY_ZONE_WARNING,
        (data: { warning_level: "first_warning" | "second_warning"; distance_meters: number }) => {
          if (data.warning_level === "second_warning") {
            setRealtimeWarning(
              `WARNING: You are ${data.distance_meters}m outside your assigned zone! Order assignment will automatically pause soon.`
            );
          } else {
            setRealtimeWarning(
              `Notice: You are ${data.distance_meters}m outside your assigned zone perimeter.`
            );
          }
        }
      );
    }

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.DELIVERY_ZONE_ENTER);
        socket.off(SOCKET_EVENTS.DELIVERY_ZONE_EXIT);
        socket.off(SOCKET_EVENTS.DELIVERY_ZONE_WARNING);
      }
    };
  }, [refreshGps]);

  return (
    <DeliveryShell title="Geo-fencing & Delivery Zones">
      <div className="space-y-6">
        {/* Realtime Warning Banner */}
        {(realtimeWarning || currentStatus?.warning_level !== "none") && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 border shadow-sm ${
              currentStatus?.warning_level === "second_warning" ||
              realtimeWarning?.includes("WARNING")
                ? "bg-red-500/10 border-red-500/30 text-red-600"
                : "bg-amber-500/10 border-amber-500/30 text-amber-600"
            }`}
          >
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div className="flex-1 text-sm font-semibold">
              {realtimeWarning ||
                (currentStatus?.warning_level === "second_warning"
                  ? `Critical Alert: You are ${currentStatus.distance_to_boundary_meters}m outside your assigned delivery zone. Please return to avoid order assignment pause.`
                  : `Zone Notice: You are ${currentStatus?.distance_to_boundary_meters}m away from your assigned zone boundary.`)}
            </div>
          </div>
        )}

        {/* Live GPS & Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Current Zone Card */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Current Status
              </span>
              {currentStatus?.in_zone ? (
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

          {/* Distance to Boundary */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Distance to Boundary
              </span>
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              {currentStatus
                ? `${currentStatus.distance_to_boundary_meters} meters`
                : "Calculating..."}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {currentStatus?.in_zone
                ? "Distance to nearest edge of assigned perimeter."
                : "Distance required to re-enter your assigned delivery zone."}
            </p>
          </div>

          {/* Live GPS Coordinates */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Live GPS Location
              </span>
              <button
                onClick={refreshGps}
                className="p-1.5 hover:bg-section rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                title="Refresh GPS"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {gpsLocation ? (
              <div>
                <h3 className="text-sm font-semibold text-foreground font-mono">
                  {gpsLocation.lat.toFixed(5)}, {gpsLocation.lng.toFixed(5)}
                </h3>
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  GPS Active & Verified
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-amber-600 font-medium">
                  {gpsError || "Acquiring satellite GPS lock..."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Zones List */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-primary" /> My Assigned Zones
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Orders are automatically matched and restricted based on these territories.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
              {assignedZones.length} Active Zone{assignedZones.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading zone details...
            </div>
          ) : assignedZones.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-border rounded-xl">
              <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No Delivery Zones Assigned</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Contact your fleet administrator or dispatcher to be assigned to polygon or circle delivery zones.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedZones.map((zone) => (
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
                      <span className="font-medium">
                        {new Date(zone.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DeliveryShell>
  );
}
