"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Bike, MapPin, Radio, Wifi, WifiOff } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AdminLiveDeliveriesMap, { type RiderMarker } from "@/components/admin/AdminLiveDeliveriesMap";
import { adminFetcher } from "@/services/adminApi";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useSocket } from "@/hooks/useSocket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

type LiveDelivery = {
  order_id: string;
  order_status: string;
  tracking_status?: string;
  restaurant_name?: string;
  driver_id?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  vehicle_type?: string | null;
  rider_lat?: number | null;
  rider_lng?: number | null;
  customer_city?: string | null;
  estimated_delivery_time?: string | null;
  created_at?: string;
};

type LiveDeliveriesData = {
  live_deliveries: LiveDelivery[];
  delayed_orders: Array<Record<string, unknown>>;
  cancelled_orders: Array<Record<string, unknown>>;
};

export default function AdminLiveDeliveriesPage() {
  const hasToken = useAuthToken();
  const { socket, connected, offline } = useSocket();
  const [liveOverrides, setLiveOverrides] = useState<Record<string, { lat: number; lng: number }>>({});

  const { data, isLoading, error } = useSWR<LiveDeliveriesData>(
    hasToken ? "/api/admin/live-deliveries" : null,
    adminFetcher,
    { refreshInterval: 8000 }
  );

  // Live-patch marker positions between polls via Socket.IO (admin joins the admin room on connect).
  useEffect(() => {
    if (!socket) return;
    const onLocation = (payload: { order_id?: string; delivery_partner_id?: string; lat?: number; lng?: number }) => {
      if (payload.lat == null || payload.lng == null) return;
      const key = payload.order_id || payload.delivery_partner_id;
      if (!key) return;
      setLiveOverrides((prev) => ({ ...prev, [key]: { lat: payload.lat as number, lng: payload.lng as number } }));
    };
    socket.on(SOCKET_EVENTS.DELIVERY_LOCATION, onLocation);
    socket.on(SOCKET_EVENTS.LOCATION_UPDATED, onLocation);
    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_LOCATION, onLocation);
      socket.off(SOCKET_EVENTS.LOCATION_UPDATED, onLocation);
    };
  }, [socket]);

  const deliveries = useMemo(() => data?.live_deliveries || [], [data?.live_deliveries]);

  const riders: RiderMarker[] = useMemo(
    () =>
      deliveries.reduce<RiderMarker[]>((acc, d) => {
        const override = liveOverrides[d.order_id] || (d.driver_id ? liveOverrides[d.driver_id] : undefined);
        const lat = override?.lat ?? (d.rider_lat != null ? Number(d.rider_lat) : null);
        const lng = override?.lng ?? (d.rider_lng != null ? Number(d.rider_lng) : null);
        if (lat == null || lng == null) return acc;
        acc.push({
          id: d.order_id,
          lat,
          lng,
          label: `${d.driver_name || "Rider"} · #${d.order_id.slice(0, 8)}`,
          status: d.tracking_status || d.order_status,
        });
        return acc;
      }, []),
    [deliveries, liveOverrides]
  );

  const uniqueRiders = useMemo(() => {
    const seen = new Set<string>();
    return deliveries.filter((d) => {
      if (!d.driver_id || seen.has(d.driver_id)) return false;
      seen.add(d.driver_id);
      return true;
    });
  }, [deliveries]);

  return (
    <AdminShell title="Live Deliveries">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground">Live Deliveries</h1>
          <p className="text-sm text-gray-text mt-1">Every active rider and current order, updated in real time.</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border ${
            connected && !offline
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {connected && !offline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {offline ? "Offline" : connected ? "Live" : "Reconnecting…"}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load live deliveries.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <AdminLiveDeliveriesMap riders={riders} />

          <section className="bg-white border border-border rounded-2xl p-5">
            <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Current Orders ({deliveries.length})
            </h2>
            {isLoading && <p className="text-sm text-gray-text">Loading active deliveries…</p>}
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {deliveries.length === 0 && !isLoading && (
                <p className="text-sm text-gray-text">No active deliveries right now.</p>
              )}
              {deliveries.map((d) => (
                <div key={d.order_id} className="rounded-xl border border-border bg-section px-3 py-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-bold text-foreground">
                      #{d.order_id.slice(0, 8)} · {d.restaurant_name || ""}
                    </span>
                    <span className="text-xs font-bold text-primary">{d.tracking_status || d.order_status}</span>
                  </div>
                  <p className="text-xs text-gray-text mt-1">
                    Driver: {d.driver_name || "Unassigned"}
                    {d.rider_lat != null ? ` · ${Number(d.rider_lat).toFixed(4)}, ${Number(d.rider_lng).toFixed(4)}` : ""}
                  </p>
                  <Link href={`/track-order/${d.order_id}`} className="text-xs font-bold text-primary hover:underline mt-1 inline-block">
                    Open tracking →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="bg-white border border-border rounded-2xl p-5">
            <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
              <Bike className="w-4 h-4 text-primary" />
              Live Riders ({uniqueRiders.length})
            </h2>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {uniqueRiders.length === 0 && <p className="text-sm text-gray-text">No riders on active deliveries.</p>}
              {uniqueRiders.map((d) => (
                <div key={d.driver_id} className="rounded-xl border border-border bg-section px-3 py-2 text-sm">
                  <p className="font-bold text-foreground">{d.driver_name}</p>
                  <p className="text-xs text-gray-text mt-1">
                    {d.vehicle_type || "Vehicle"} · {d.driver_phone || "—"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-border rounded-2xl p-5">
            <h2 className="text-lg font-black text-foreground mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-500" />
              Delayed ({data?.delayed_orders?.length || 0})
            </h2>
            <div className="space-y-1 max-h-[160px] overflow-y-auto">
              {(data?.delayed_orders || []).slice(0, 8).map((o) => (
                <p key={String(o.id)} className="text-xs text-gray-text">
                  #{String(o.id).slice(0, 8)} · {String(o.restaurant_name)}
                </p>
              ))}
              {!data?.delayed_orders?.length && <p className="text-xs text-gray-text">None.</p>}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
