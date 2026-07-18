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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { data, error, isLoading } = useAdminDashboard();

  const cards = useMemo(
    () => [
      { title: "Total Users", value: data?.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
      { title: "Total Restaurants", value: data?.totalRestaurants ?? 0, icon: Store, color: "text-[#FC8019]", bg: "bg-[#FC8019]/10" },
      { title: "Total Orders", value: data?.totalOrders ?? 0, icon: ShoppingBag, color: "text-purple-500", bg: "bg-purple-500/10" },
      { title: "Total Revenue", value: data?.totalRevenue ?? 0, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10", money: true },
      { title: "Today's Orders", value: data?.todaysOrders ?? 0, icon: Clock, color: "text-sky-500", bg: "bg-sky-500/10" },
      { title: "Active Delivery Partners", value: data?.activeDeliveryPartners ?? 0, icon: Bike, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { title: "Pending Restaurant Approvals", value: data?.pendingRestaurantApprovals ?? 0, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
      { title: "Delivered Orders", value: data?.deliveredOrders ?? 0, icon: CheckCircle2, color: "text-teal-500", bg: "bg-teal-500/10" },
    ],
    [data]
  );

  const weeklyMax = Math.max(...(data?.weekly || []).map((d) => d.revenue), 1);

  return (
    <AdminShell title="Dashboard Overview">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load admin dashboard. Sign in as an admin.
        </div>
      )}
      {isLoading && !data && <p className="text-[#6B7280] mb-4 text-sm">Loading…</p>}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#111827] mb-1">Platform Overview</h1>
        <p className="text-[#6B7280]">Live metrics across users, restaurants, and orders.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((c) => (
          <div
            key={c.title}
            className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#6B7280]">{c.title}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg}`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-[#111827]">
              {c.money ? formatCurrency(c.value) : c.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB] shadow-sm">
          <h2 className="text-lg font-bold text-[#111827] mb-4">Weekly Revenue</h2>
          <div className="h-48 flex items-end gap-2">
            {(data?.weekly || []).length === 0 && (
              <p className="text-sm text-[#6B7280]">No weekly data yet.</p>
            )}
            {(data?.weekly || []).map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full max-w-[36px] bg-[#FC8019]/25 border border-[#FC8019]/40 rounded-t-lg"
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
            {(data?.monthly || []).length === 0 && (
              <p className="text-sm text-[#6B7280]">No monthly data yet.</p>
            )}
            {(data?.monthly || []).map((m) => (
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
