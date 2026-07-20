"use client";

import { useMemo } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminDashboard } from "@/hooks/useAdminData";
import { formatCurrency } from "@/services/adminApi";
import {
  Users,
  Store,
  ShoppingBag,
  DollarSign,
  Clock,
  Bike,
  UtensilsCrossed,
  Star,
  Timer,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data: stats, error: errorMsg, isLoading: loading } = useAdminDashboard();

  const revenueCards = useMemo(
    () => [
      { title: "Today's Revenue", value: stats?.todaysRevenue ?? 0, money: true },
      { title: "Weekly Revenue", value: stats?.weeklyRevenue ?? 0, money: true },
      { title: "Monthly Revenue", value: stats?.monthlyRevenue ?? 0, money: true },
      { title: "Yearly Revenue", value: stats?.yearlyRevenue ?? 0, money: true },
    ],
    [stats]
  );

  const orderCards = useMemo(
    () => [
      { title: "Today's Orders", value: stats?.todaysOrders ?? 0, icon: Clock, color: "text-sky-500", bg: "bg-sky-500/10" },
      { title: "Active Orders", value: stats?.activeOrders ?? 0, icon: Activity, color: "text-amber-500", bg: "bg-amber-500/10" },
      { title: "Completed Orders", value: stats?.deliveredOrders ?? 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { title: "Cancelled Orders", value: stats?.cancelledOrders ?? 0, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    ],
    [stats]
  );

  const platformCards = useMemo(
    () => [
      { title: "Total Customers", value: stats?.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
      { title: "Total Restaurants", value: stats?.totalRestaurants ?? 0, icon: Store, color: "text-[#E23744]", bg: "bg-[#E23744]/10" },
      { title: "Delivery Partners", value: stats?.totalDeliveryPartners ?? 0, icon: Bike, color: "text-violet-500", bg: "bg-violet-500/10" },
      { title: "Total Menu Items", value: stats?.totalMenuItems ?? 0, icon: UtensilsCrossed, color: "text-orange-500", bg: "bg-orange-500/10" },
      {
        title: "Avg Delivery Time",
        value: stats?.avgDeliveryTimeMinutes
          ? `${Math.round(stats.avgDeliveryTimeMinutes)} min`
          : "—",
        icon: Timer,
        color: "text-cyan-500",
        bg: "bg-cyan-500/10",
        raw: true,
      },
      {
        title: "Customer Satisfaction",
        value: stats?.customerSatisfaction
          ? `${Number(stats.customerSatisfaction).toFixed(1)} ★`
          : "—",
        icon: Star,
        color: "text-yellow-500",
        bg: "bg-yellow-500/10",
        raw: true,
      },
    ],
    [stats]
  );

  const weeklyMax = Math.max(...(stats?.weekly || []).map((d) => d.revenue), 1);

  return (
    <AdminShell title="Enterprise Dashboard">
      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load admin dashboard. Sign in as an admin.
        </div>
      )}
      {loading && !stats && <p className="text-[#6B7280] mb-4 text-sm">Loading…</p>}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111827] mb-1">Enterprise Overview</h1>
        <p className="text-[#6B7280]">Real-time platform analytics across revenue, orders, and operations.</p>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#9CA3AF] mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" /> Revenue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {revenueCards.map((c) => (
            <div key={c.title} className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <p className="text-sm font-bold text-[#6B7280] mb-2">{c.title}</p>
              <p className="text-2xl font-black text-[#111827]">{formatCurrency(c.value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#9CA3AF] mb-4 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" /> Orders
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {orderCards.map((c) => (
            <div key={c.title} className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#6B7280]">{c.title}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-[#111827]">{c.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#9CA3AF] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Platform Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {platformCards.map((c) => (
            <div key={c.title} className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#6B7280]">{c.title}</p>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.bg}`}>
                  <c.icon className={`w-4 h-4 ${c.color}`} />
                </div>
              </div>
              <p className="text-2xl font-black text-[#111827]">
                {"raw" in c && c.raw ? c.value : Number(c.value).toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-4">Weekly Revenue</h2>
          <div className="h-48 flex items-end gap-2">
            {(stats?.weekly || []).length === 0 && (
              <p className="text-sm text-[#6B7280]">No weekly data yet.</p>
            )}
            {(stats?.weekly || []).map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full max-w-[36px] bg-[#E23744]/25 border border-[#E23744]/40 rounded-t-lg"
                  style={{ height: `${Math.max(8, Math.round((d.revenue / weeklyMax) * 100))}%` }}
                  title={formatCurrency(d.revenue)}
                />
                <span className="text-[10px] font-bold text-[#6B7280]">
                  {new Date(d.day).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-4">Monthly Analytics</h2>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {(stats?.monthly || []).length === 0 && (
              <p className="text-sm text-[#6B7280]">No monthly data yet.</p>
            )}
            {(stats?.monthly || []).map((m) => (
              <div
                key={m.month}
                className="flex items-center justify-between bg-[#F8FAFC] rounded-xl px-4 py-3 border border-[#E5E7EB]"
              >
                <span className="text-sm font-bold text-[#111827]">
                  {new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                <div className="text-right">
                  <p className="text-sm font-black text-[#111827]">{formatCurrency(m.revenue)}</p>
                  <p className="text-xs text-[#6B7280]">{m.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
