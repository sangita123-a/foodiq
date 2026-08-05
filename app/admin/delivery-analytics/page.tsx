"use client";

import React, { useState, useEffect, useCallback } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/admin/ui";
import { chartColor } from "@/lib/adminChartTheme";
import {
  TrendingUp,
  BarChart2,
  Users,
  Award,
  Download,
  Star,
  CheckCircle2,
  XCircle,
  DollarSign,
  Search,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Flame,
  ShieldAlert,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  fetchAdminDeliveryAnalytics,
  AdminDeliveryAnalyticsData,
} from "@/services/adminApi";

export default function AdminDeliveryAnalyticsPage() {
  const [data, setData] = useState<AdminDeliveryAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchAdminDeliveryAnalytics({
        search,
        startDate,
        endDate,
      });
      if (res) setData(res);
    } catch (err: unknown) {
      console.error("Failed to fetch admin delivery analytics:", err);
      setError("Failed to load fleet analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time socket events — fires on every order status change (see
  // socket/emitters.js -> AnalyticsService.triggerAnalyticsUpdate).
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAdminAnalyticsUpdate = () => {
      loadData();
    };

    socket.on(SOCKET_EVENTS.ADMIN_ANALYTICS_UPDATE || "admin:analytics:update", handleAdminAnalyticsUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.ADMIN_ANALYTICS_UPDATE || "admin:analytics:update", handleAdminAnalyticsUpdate);
    };
  }, [loadData]);

  const handleExportCSV = () => {
    if (!data) return;
    const headers = [
      "Partner Name",
      "Email",
      "Phone",
      "Vehicle",
      "Rating",
      "Completed Orders",
      "Cancelled Orders",
      "Performance Score",
      "Revenue ($)",
    ];
    const rows = (data.top_riders || []).map((r) => [
      `"${r.full_name}"`,
      r.email,
      r.phone_number,
      r.vehicle_type,
      r.rating,
      r.completed_orders,
      r.cancelled_orders,
      r.performance_score,
      r.total_earnings,
    ]);
    const csvStr = `${headers.join(",")}\n${rows.map((e) => e.join(",")).join("\n")}`;
    const blob = new Blob([csvStr], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin_fleet_analytics_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxTrendRevenue = Math.max(1, ...(data?.revenue_trend || []).map((m) => m.revenue));

  return (
    <AdminShell title="Fleet Analytics">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Fleet Analytics &amp; Intelligence</h1>
          <p className="text-gray-text">Network delivery performance, top riders leaderboard, revenue, and zone density.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!data}
            className="inline-flex items-center gap-2 bg-white border border-border px-4 py-2.5 rounded-xl text-sm font-bold text-foreground disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Button
            type="button"
            onClick={loadData}
            disabled={loading}
            variant="primary"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-3xl border border-border p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-text absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search partner by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-xs text-gray-text">
            <Calendar className="w-3.5 h-3.5" />
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 border border-border px-3 py-2 rounded-xl text-xs text-gray-text">
            <Calendar className="w-3.5 h-3.5" />
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
        {[
          { title: "Total Fleet Riders", value: data?.summary.total_partners ?? 0, icon: Users },
          { title: "Active Online", value: data?.summary.online_partners ?? 0, icon: Flame },
          { title: "Fleet Avg Rating", value: `${data?.summary.average_fleet_rating ?? 5.0}`, icon: Star },
          { title: "Fleet Revenue", value: `$${data?.summary.total_fleet_revenue ?? 0}`, icon: DollarSign },
          { title: "Delivered Orders", value: data?.summary.total_delivered_orders ?? 0, icon: CheckCircle2 },
          { title: "Cancelled Orders", value: data?.summary.total_cancelled_orders ?? 0, icon: XCircle },
          { title: "Completion Rate", value: `${data?.summary.average_completion_rate ?? 100}%`, icon: BarChart2 },
          { title: "Acceptance Rate", value: `${data?.summary.average_acceptance_rate ?? 100}%`, icon: TrendingUp },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="p-4 rounded-2xl bg-white border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-gray-text font-medium">{card.title}</span>
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-bold text-foreground">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue trend + zone density */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-6 rounded-3xl bg-white border border-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Fleet Revenue Trend
              </h3>
              <p className="text-xs text-gray-text">Monthly delivery-fee revenue, trailing 7 months</p>
            </div>
          </div>

          {(data?.revenue_trend?.length ?? 0) === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-gray-text">No revenue data yet.</div>
          ) : (
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-section rounded-xl border border-border">
              {(data?.revenue_trend || []).map((m, i) => {
                const heightPct = Math.max(4, Math.round((m.revenue / maxTrendRevenue) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] text-emerald-700 font-mono opacity-0 group-hover:opacity-100 transition">
                      ${m.revenue.toFixed(0)}
                    </div>
                    <div
                      className="w-full max-w-[32px] rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        backgroundImage: `linear-gradient(180deg, ${chartColor(2)} 0%, ${chartColor(2)}99 100%)`,
                      }}
                    />
                    <span className="text-xs text-gray-text font-medium">{m.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 rounded-3xl bg-white border border-border shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Delivery Zone Density
          </h3>
          <p className="text-xs text-gray-text mb-6">Delivered order volume by restaurant city</p>

          {(data?.zone_density?.length ?? 0) === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-gray-text">No delivered orders yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(data?.zone_density || []).map((z, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-section border border-border relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-foreground">{z.zone}</span>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {z.intensity}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-foreground">{z.orders} orders</div>
                  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${z.pct}%`,
                        backgroundImage: `linear-gradient(90deg, ${chartColor(3)} 0%, ${chartColor(3)}99 100%)`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Top Riders Leaderboard
              </h3>
              <p className="text-xs text-gray-text">Highest performance scores and completed orders</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs font-bold text-[#9CA3AF] uppercase">
                  <th className="pb-3 px-3">Rider</th>
                  <th className="pb-3 px-3">Rating</th>
                  <th className="pb-3 px-3">Completed</th>
                  <th className="pb-3 px-3">Score</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {!data?.top_riders?.length && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-text">
                      {loading ? "Loading..." : "No riders match the current filters."}
                    </td>
                  </tr>
                )}
                {(data?.top_riders || []).map((rider, idx) => (
                  <tr key={rider.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-foreground block">{rider.full_name}</span>
                          <span className="text-[11px] text-gray-text">{rider.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-amber-600 font-semibold">
                      <Star className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      {rider.rating}
                    </td>
                    <td className="py-3 px-3 font-bold text-foreground">{rider.completed_orders}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-200">
                        {rider.performance_score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Attention Required / Lowest Performers
              </h3>
              <p className="text-xs text-gray-text">Delivery partners with high cancellation or low rating</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-xs font-bold text-[#9CA3AF] uppercase">
                  <th className="pb-3 px-3">Rider</th>
                  <th className="pb-3 px-3">Rating</th>
                  <th className="pb-3 px-3">Cancelled</th>
                  <th className="pb-3 px-3">Score</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {!data?.worst_performers?.length && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-text">
                      {loading ? "Loading..." : "No riders match the current filters."}
                    </td>
                  </tr>
                )}
                {(data?.worst_performers || []).map((rider) => (
                  <tr key={rider.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-3">
                      <div>
                        <span className="font-semibold text-foreground block">{rider.full_name}</span>
                        <span className="text-[11px] text-gray-text">{rider.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-red-500 font-semibold">
                      <Star className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      {rider.rating}
                    </td>
                    <td className="py-3 px-3 font-bold text-red-500">{rider.cancelled_orders}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 font-bold border border-red-200">
                        {rider.performance_score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
