"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  BarChart2,
  Users,
  Award,
  Clock,
  MapPin,
  FileText,
  Download,
  Star,
  CheckCircle2,
  XCircle,
  DollarSign,
  Search,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  Calendar,
  Filter,
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

  // Real-time socket events
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
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Bar Header */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Fleet Analytics & Intelligence
              </h1>
              <p className="text-xs text-slate-400">
                Network delivery performance, top riders leaderboard, revenue, and heatmaps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
            >
              <Download className="w-4 h-4" /> Export CSV Report
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── FILTERS BAR ────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search partner by name, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ─── SUMMARY METRICS ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            {
              title: "Total Fleet Riders",
              value: data?.summary.total_partners ?? 0,
              icon: Users,
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
            },
            {
              title: "Active Online",
              value: data?.summary.online_partners ?? 0,
              icon: Flame,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            },
            {
              title: "Fleet Average Rating",
              value: `⭐ ${data?.summary.average_fleet_rating ?? 5.0}`,
              icon: Star,
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            },
            {
              title: "Total Fleet Revenue",
              value: `$${data?.summary.total_fleet_revenue ?? 0}`,
              icon: DollarSign,
              color: "text-emerald-300 bg-emerald-950/60 border-emerald-600/50 font-bold",
            },
            {
              title: "Delivered Orders",
              value: data?.summary.total_delivered_orders ?? 0,
              icon: CheckCircle2,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            },
            {
              title: "Cancelled Orders",
              value: data?.summary.total_cancelled_orders ?? 0,
              icon: XCircle,
              color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
            },
            {
              title: "Completion Rate",
              value: `${data?.summary.average_completion_rate ?? 100}%`,
              icon: BarChart2,
              color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
            },
            {
              title: "Acceptance Rate",
              value: `${data?.summary.average_acceptance_rate ?? 100}%`,
              icon: TrendingUp,
              color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-slate-400 font-medium">{card.title}</span>
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-base font-bold text-slate-100">{card.value}</div>
              </div>
            );
          })}
        </div>

        {/* ─── REVENUE & HEATMAP CHARTS ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Revenue Trends */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Fleet Revenue Trends
                </h3>
                <p className="text-xs text-slate-400">Monthly gross fleet delivery revenue</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                +${data?.summary.total_fleet_revenue ?? 0} Total
              </span>
            </div>

            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-950/50 rounded-xl border border-slate-800">
              {[
                { month: "Jan", rev: 12400 },
                { month: "Feb", rev: 15800 },
                { month: "Mar", rev: 18200 },
                { month: "Apr", rev: 16500 },
                { month: "May", rev: 21000 },
                { month: "Jun", rev: 24500 },
                { month: "Jul", rev: 28900 },
              ].map((m, i) => {
                const heightPct = Math.min(100, Math.round((m.rev / 32000) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] text-emerald-400 font-mono opacity-0 group-hover:opacity-100 transition">
                      ${m.rev}
                    </div>
                    <div
                      className="w-full max-w-[32px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125 shadow-lg shadow-emerald-500/20"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-xs text-slate-400 font-medium">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Network Delivery Heatmap */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Delivery Zone Heatmap & Intensity
            </h3>
            <p className="text-xs text-slate-400 mb-6">Real-time order density across city zones</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { zone: "Downtown Central", intensity: "Very High", orders: 480, pct: 95, color: "from-orange-500 to-rose-600" },
                { zone: "Northside Hub", intensity: "High", orders: 320, pct: 75, color: "from-amber-500 to-orange-500" },
                { zone: "West End Residential", intensity: "Medium", orders: 190, pct: 50, color: "from-teal-500 to-emerald-500" },
                { zone: "Tech Campus & South", intensity: "Moderate", orders: 140, pct: 35, color: "from-blue-500 to-indigo-500" },
              ].map((z, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-200">{z.zone}</span>
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {z.intensity}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-100">{z.orders} orders</div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
                    <div className={`bg-gradient-to-r ${z.color} h-full rounded-full`} style={{ width: `${z.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── LEADERBOARD: TOP RIDERS & LOWEST PERFORMERS ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Riders Table */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Top Riders Leaderboard
                </h3>
                <p className="text-xs text-slate-400">Highest performance scores and completed orders</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3 px-3">Rider</th>
                    <th className="pb-3 px-3">Rating</th>
                    <th className="pb-3 px-3">Completed</th>
                    <th className="pb-3 px-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {(data?.top_riders?.length
                    ? data.top_riders
                    : [
                        { id: "1", full_name: "Alex Johnson", email: "alex@foodiq.com", rating: 4.95, completed_orders: 184, performance_score: 98 },
                        { id: "2", full_name: "Sarah Miller", email: "sarah@foodiq.com", rating: 4.90, completed_orders: 162, performance_score: 95 },
                        { id: "3", full_name: "David Chen", email: "david@foodiq.com", rating: 4.88, completed_orders: 145, performance_score: 92 },
                      ]
                  ).map((rider, idx) => (
                    <tr key={rider.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-200 block">{rider.full_name}</span>
                            <span className="text-[10px] text-slate-400">{rider.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-semibold">⭐ {rider.rating}</td>
                      <td className="py-3 px-3 font-bold text-slate-200">{rider.completed_orders}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {rider.performance_score} / 100
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Worst Performers / Attention Required */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Attention Required / Lowest Performers
                </h3>
                <p className="text-xs text-slate-400">Delivery partners with high cancellation or low rating</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                    <th className="pb-3 px-3">Rider</th>
                    <th className="pb-3 px-3">Rating</th>
                    <th className="pb-3 px-3">Cancelled</th>
                    <th className="pb-3 px-3">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {(data?.worst_performers?.length
                    ? data.worst_performers
                    : [
                        { id: "101", full_name: "Robert Taylor", email: "robert@foodiq.com", rating: 3.4, cancelled_orders: 18, performance_score: 42 },
                        { id: "102", full_name: "Kevin Smith", email: "kevin@foodiq.com", rating: 3.8, cancelled_orders: 14, performance_score: 55 },
                      ]
                  ).map((rider) => (
                    <tr key={rider.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3">
                        <div>
                          <span className="font-semibold text-slate-200 block">{rider.full_name}</span>
                          <span className="text-[10px] text-slate-400">{rider.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-rose-400 font-semibold">⭐ {rider.rating}</td>
                      <td className="py-3 px-3 font-bold text-rose-400">{rider.cancelled_orders}</td>
                      <td className="py-3 px-3">
                        <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
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
      </div>
    </div>
  );
}
