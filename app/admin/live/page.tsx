"use client";

import AdminShell from "@/components/admin/AdminShell";
import { useAdminLive } from "@/hooks/useAdminLive";
import { formatCurrency, adminFetcher } from "@/services/adminApi";
import { Bike, Radio, ShoppingBag, Store, Wifi, WifiOff, DollarSign, MapPin, AlertTriangle } from "lucide-react";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import Link from "next/link";

type LiveDeliveriesData = {
  live_deliveries: Array<Record<string, unknown>>;
  delayed_orders: Array<Record<string, unknown>>;
  cancelled_orders: Array<Record<string, unknown>>;
};

function LiveDeliveriesPanel() {
  const hasToken = useAuthToken();
  const { data, isLoading } = useSWR<LiveDeliveriesData>(
    hasToken ? "/api/admin/live-deliveries" : null,
    adminFetcher,
    { refreshInterval: 10000 }
  );

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-6">
      <h2 className="text-lg font-black text-[#111827] mb-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#E23744]" />
        Live Deliveries
      </h2>
      {isLoading && <p className="text-sm text-[#6B7280]">Loading active deliveries…</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-2 max-h-[320px] overflow-y-auto">
          {(data?.live_deliveries || []).length === 0 && !isLoading && (
            <p className="text-sm text-[#6B7280]">No active deliveries right now.</p>
          )}
          {(data?.live_deliveries || []).map((d) => (
            <div
              key={String(d.order_id)}
              className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm"
            >
              <div className="flex justify-between gap-2">
                <span className="font-bold text-[#111827]">
                  #{String(d.order_id).slice(0, 8)} · {String(d.restaurant_name || "")}
                </span>
                <span className="text-xs font-bold text-[#E23744]">
                  {String(d.tracking_status || d.order_status || "")}
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">
                Driver: {String(d.driver_name || "Unassigned")}
                {d.rider_lat != null ? ` · ${Number(d.rider_lat).toFixed(4)}, ${Number(d.rider_lng).toFixed(4)}` : ""}
              </p>
              <Link
                href={`/track-order/${String(d.order_id)}`}
                className="text-xs font-bold text-[#E23744] hover:underline mt-1 inline-block"
              >
                Open tracking →
              </Link>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Delayed ({data?.delayed_orders?.length || 0})
            </h3>
            <div className="space-y-1 max-h-[140px] overflow-y-auto">
              {(data?.delayed_orders || []).slice(0, 5).map((o) => (
                <p key={String(o.id)} className="text-xs text-[#6B7280]">
                  #{String(o.id).slice(0, 8)} · {String(o.restaurant_name)}
                </p>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
              Cancelled (24h)
            </h3>
            <div className="space-y-1 max-h-[140px] overflow-y-auto">
              {(data?.cancelled_orders || []).slice(0, 5).map((o) => (
                <p key={String(o.id)} className="text-xs text-[#6B7280]">
                  #{String(o.id).slice(0, 8)} · {String(o.restaurant_name)}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AdminLivePage() {
  const {
    data,
    ticks,
    onlineRiders,
    liveRevenueDelta,
    activeOrdersDelta,
    connected,
    offline,
    isLoading,
    error,
  } = useAdminLive();

  const cards = [
    {
      label: "Active Orders",
      value: String(data?.activeOrders ?? 0),
      hint: activeOrdersDelta ? `+${activeOrdersDelta} live updates` : "Realtime",
      icon: ShoppingBag,
    },
    {
      label: "Online Riders",
      value: String(onlineRiders),
      hint: "Socket presence",
      icon: Bike,
    },
    {
      label: "Restaurants",
      value: String(data?.totalRestaurants ?? 0),
      hint: "Platform total",
      icon: Store,
    },
    {
      label: "Live Revenue",
      value: formatCurrency((data?.todaysRevenue ?? 0) + liveRevenueDelta),
      hint: liveRevenueDelta ? `+${formatCurrency(liveRevenueDelta)} session` : "Today",
      icon: DollarSign,
    },
  ];

  return (
    <AdminShell title="Live Ops">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#111827] mb-1">Live Operations</h1>
          <p className="text-[#6B7280]">
            Active orders, riders, and revenue — updated over Socket.IO without refresh.
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
          {offline ? "Offline" : connected ? "Socket connected" : "Reconnecting…"}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load admin live data.
        </div>
      )}
      {isLoading && !data && <p className="text-sm text-[#6B7280] mb-4">Loading…</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">{c.label}</p>
              <c.icon className="w-4 h-4 text-[#E23744]" />
            </div>
            <p className="text-2xl font-black text-[#111827]">{c.value}</p>
            <p className="text-xs text-[#6B7280] mt-1">{c.hint}</p>
          </div>
        ))}
      </div>

      <LiveDeliveriesPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <h2 className="text-lg font-black text-[#111827] mb-4 flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#E23744]" />
            Live Event Feed
          </h2>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {ticks.length === 0 && (
              <p className="text-sm text-[#6B7280]">Waiting for live events…</p>
            )}
            {ticks.map((t, i) => (
              <div
                key={`${t.at}-${i}`}
                className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-[#111827] capitalize">
                    {(t.event || t.type || "event").replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {t.at ? new Date(t.at).toLocaleTimeString() : ""}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  {t.order_id ? `Order #${String(t.order_id).slice(0, 8)}` : "Platform"}
                  {t.status ? ` · ${t.status}` : ""}
                  {t.total_amount != null ? ` · ₹${Number(t.total_amount).toFixed(0)}` : ""}
                  {t.online_count != null ? ` · ${t.online_count} riders online` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
          <h2 className="text-lg font-black text-[#111827] mb-4">Snapshot</h2>
          <ul className="space-y-3 text-sm text-[#6B7280]">
            <li className="flex justify-between">
              <span>Delivered orders</span>
              <span className="font-bold text-[#111827]">{data?.deliveredOrders ?? 0}</span>
            </li>
            <li className="flex justify-between">
              <span>Pending restaurant approvals</span>
              <span className="font-bold text-[#111827]">
                {data?.pendingRestaurantApprovals ?? 0}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Total users</span>
              <span className="font-bold text-[#111827]">{data?.totalUsers ?? 0}</span>
            </li>
            <li className="flex justify-between">
              <span>Today&apos;s orders</span>
              <span className="font-bold text-[#111827]">{data?.todaysOrders ?? 0}</span>
            </li>
          </ul>
          <p className="mt-6 text-xs text-[#9CA3AF]">
            Events are room-scoped (admin / order / restaurant). No full-platform broadcast.
          </p>
        </section>
      </div>
    </AdminShell>
  );
}
