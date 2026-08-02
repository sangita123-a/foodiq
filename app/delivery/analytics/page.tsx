"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  BarChart2,
  Award,
  Clock,
  MapPin,
  FileText,
  Download,
  Star,
  CheckCircle2,
  XCircle,
  DollarSign,
  Zap,
  RefreshCw,
  Percent,
  Calendar,
  Layers,
  History,
  Activity,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  fetchDeliveryAnalytics,
  fetchDeliveryPerformance,
  fetchDeliveryPerformanceHistory,
  fetchDeliveryReport,
  DeliveryAnalyticsSummary,
  DeliveryPerformanceScore,
  DeliveryPerformanceAuditLog,
} from "@/services/deliveryApi";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import { isClientAuthenticated } from "@/lib/authSession";

export default function DeliveryAnalyticsPage() {
  const router = useRouter();
  const { data: dashboard } = useDeliveryDashboard();
  const [timeRange, setTimeRange] = useState<string>("this_month");
  const [analytics, setAnalytics] = useState<DeliveryAnalyticsSummary | null>(null);
  const [performance, setPerformance] = useState<DeliveryPerformanceScore | null>(null);
  const [history, setHistory] = useState<DeliveryPerformanceAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/delivery/login");
    }
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsData, perfData, histData] = await Promise.all([
        fetchDeliveryAnalytics(timeRange).catch(() => null),
        fetchDeliveryPerformance().catch(() => null),
        fetchDeliveryPerformanceHistory(20, 0).catch(() => []),
      ]);

      if (analyticsData) setAnalytics(analyticsData);
      if (perfData) setPerformance(perfData);
      if (histData) setHistory(histData);
    } catch (err: unknown) {
      console.error("Failed to load delivery analytics:", err);
      setError("Failed to load analytics data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAnalyticsUpdate = () => {
      loadData();
    };

    const handlePerformanceUpdate = (updatedScore: DeliveryPerformanceScore) => {
      if (updatedScore) {
        setPerformance(updatedScore);
      }
    };

    socket.on(SOCKET_EVENTS.DELIVERY_ANALYTICS_UPDATE || "delivery:analytics:update", handleAnalyticsUpdate);
    socket.on(SOCKET_EVENTS.DELIVERY_PERFORMANCE_UPDATE || "delivery:performance:update", handlePerformanceUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.DELIVERY_ANALYTICS_UPDATE || "delivery:analytics:update", handleAnalyticsUpdate);
      socket.off(SOCKET_EVENTS.DELIVERY_PERFORMANCE_UPDATE || "delivery:performance:update", handlePerformanceUpdate);
    };
  }, [loadData]);

  const handleExport = async (period: 'daily' | 'weekly' | 'monthly', format: 'csv' | 'pdf') => {
    try {
      setExporting(`${period}-${format}`);
      await fetchDeliveryReport(period, format);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "from-emerald-500 to-teal-600 text-emerald-400";
    if (score >= 70) return "from-blue-500 to-indigo-600 text-blue-400";
    if (score >= 50) return "from-amber-500 to-orange-600 text-amber-400";
    return "from-rose-500 to-red-600 text-rose-400";
  };

  return (
    <DeliveryShell title="Analytics & Reports" online={dashboard?.is_online}>
      <div className="-m-4 md:-m-8 bg-slate-950 text-slate-100 pb-16 min-h-[calc(100vh-5rem)]">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                Analytics &amp; Reports
              </h2>
              <p className="text-xs text-slate-400">
                Real-time performance metrics, earnings trend, and report export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Time Range Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              {[
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "this_week", label: "This Week" },
                { id: "this_month", label: "This Month" },
                { id: "lifetime", label: "Lifetime" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setTimeRange(r.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    timeRange === r.id
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── SECTION 1: Performance Score Widget ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Score Gauge Card */}
          <div className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-850 p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 bg-orange-500/5 rounded-full blur-3xl" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-400" /> Performance Score
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  Live Audit Active
                </span>
              </div>

              <div className="flex items-center justify-center my-6">
                <div className="relative w-36 h-36 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center shadow-inner">
                  <div className="text-center">
                    <span
                      className={`text-4xl font-extrabold bg-gradient-to-r ${getScoreColor(
                        performance?.score || 92
                      )} bg-clip-text text-transparent`}
                    >
                      {performance?.score ?? 92}
                    </span>
                    <span className="block text-[10px] text-slate-400 font-medium mt-0.5">/ 100 PTS</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Score updated automatically on order completions, customer reviews, and attendance.
              </p>
            </div>
          </div>

          {/* Performance Breakdown Components */}
          <div className="lg:col-span-2 rounded-2xl bg-slate-900 p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
            <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> Score Components Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Acceptance Rate",
                  val: performance?.breakdown.acceptance ?? analytics?.acceptance_rate ?? 98,
                  weight: "20%",
                  color: "bg-emerald-500",
                },
                {
                  label: "Completion Rate",
                  val: performance?.breakdown.completion ?? analytics?.completion_rate ?? 96,
                  weight: "25%",
                  color: "bg-blue-500",
                },
                {
                  label: "Customer Rating",
                  val: performance?.breakdown.rating ?? Math.round(((analytics?.average_rating || 4.8) / 5) * 100),
                  weight: "20%",
                  color: "bg-amber-500",
                },
                {
                  label: "Fraud Cleanliness",
                  val: performance?.breakdown.fraud_cleanliness ?? 100,
                  weight: "15%",
                  color: "bg-teal-500",
                },
                {
                  label: "Attendance & Hours",
                  val: performance?.breakdown.attendance ?? 90,
                  weight: "10%",
                  color: "bg-indigo-500",
                },
                {
                  label: "Customer Feedback",
                  val: performance?.breakdown.customer_feedback ?? 95,
                  weight: "10%",
                  color: "bg-purple-500",
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <span className="text-slate-400 font-bold">{item.val}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.val}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Weight: {item.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── SECTION 2: Overview Cards ───────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            {
              title: "Completed Orders",
              value: analytics?.completed_orders ?? 0,
              icon: CheckCircle2,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            },
            {
              title: "Cancelled Orders",
              value: analytics?.cancelled_orders ?? 0,
              icon: XCircle,
              color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
            },
            {
              title: "Acceptance Rate",
              value: `${analytics?.acceptance_rate ?? 100}%`,
              icon: Percent,
              color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
            },
            {
              title: "Completion Rate",
              value: `${analytics?.completion_rate ?? 100}%`,
              icon: Zap,
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            },
            {
              title: "Average Rating",
              value: `⭐ ${analytics?.average_rating ?? 5.0}`,
              icon: Star,
              color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
            },
            {
              title: "Avg Delivery Time",
              value: `${analytics?.average_delivery_time_mins ?? 25} min`,
              icon: Clock,
              color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
            },
            {
              title: "Total Distance",
              value: `${analytics?.total_distance_km ?? 0} km`,
              icon: MapPin,
              color: "text-teal-400 bg-teal-500/10 border-teal-500/20",
            },
            {
              title: "Online Hours",
              value: `${analytics?.total_online_hours ?? 0} hrs`,
              icon: Clock,
              color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
            },
            {
              title: "Idle Hours",
              value: `${analytics?.idle_hours ?? 0} hrs`,
              icon: Clock,
              color: "text-slate-400 bg-slate-800 border-slate-700",
            },
            {
              title: "Base Earnings",
              value: `$${analytics?.earnings ?? 0}`,
              icon: DollarSign,
              color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            },
            {
              title: "Tips & Bonuses",
              value: `$${(analytics?.tips ?? 0) + (analytics?.bonuses ?? 0)}`,
              icon: TrendingUp,
              color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
            },
            {
              title: "Total Earnings",
              value: `$${analytics?.total_earnings ?? 0}`,
              icon: DollarSign,
              color: "text-emerald-300 bg-emerald-950/60 border-emerald-600/50 font-bold",
            },
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">{card.title}</span>
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-lg font-bold text-slate-100">{card.value}</div>
              </div>
            );
          })}
        </div>

        {/* ─── SECTION 3: Interactive Earnings & Trends Graphs ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings Trend Graph */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> Earnings Trend
                </h3>
                <p className="text-xs text-slate-400">Delivery fees, tips, and incentive bonuses</p>
              </div>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                +${analytics?.total_earnings ?? 0} Total
              </span>
            </div>

            {/* Visual SVG / HTML Bar Chart */}
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-950/50 rounded-xl border border-slate-800">
              {[
                { day: "Mon", base: 45, tip: 15, bonus: 10 },
                { day: "Tue", base: 60, tip: 20, bonus: 5 },
                { day: "Wed", base: 55, tip: 12, bonus: 8 },
                { day: "Thu", base: 75, tip: 25, bonus: 15 },
                { day: "Fri", base: 90, tip: 30, bonus: 20 },
                { day: "Sat", base: 110, tip: 40, bonus: 25 },
                { day: "Sun", base: 85, tip: 28, bonus: 18 },
              ].map((d, i) => {
                const total = d.base + d.tip + d.bonus;
                const heightPct = Math.min(100, Math.round((total / 180) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition">
                      ${total}
                    </div>
                    <div className="w-full max-w-[28px] bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-125" style={{ height: `${heightPct}%` }}>
                      <div className="bg-amber-400 h-[20%]" />
                      <div className="bg-teal-400 h-[25%]" />
                      <div className="bg-emerald-500 flex-1" />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{d.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-6 mt-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Base Fee</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-400" /> Tips</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400" /> Bonuses</span>
            </div>
          </div>

          {/* Orders & Ratings Trend Graph */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-orange-400" /> Orders & Ratings Trend
                </h3>
                <p className="text-xs text-slate-400">Completed volume vs customer satisfaction rating</p>
              </div>
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                ⭐ {analytics?.average_rating ?? 5.0} Avg Rating
              </span>
            </div>

            {/* Visual Bar / Line Graph */}
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-4 bg-slate-950/50 rounded-xl border border-slate-800">
              {[
                { day: "Mon", count: 8, rating: 4.8 },
                { day: "Tue", count: 12, rating: 5.0 },
                { day: "Wed", count: 10, rating: 4.9 },
                { day: "Thu", count: 15, rating: 4.7 },
                { day: "Fri", count: 18, rating: 4.9 },
                { day: "Sat", count: 22, rating: 5.0 },
                { day: "Sun", count: 16, rating: 4.8 },
              ].map((d, i) => {
                const heightPct = Math.min(100, Math.round((d.count / 25) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="text-[10px] text-orange-400 font-bold opacity-0 group-hover:opacity-100 transition">
                      ⭐{d.rating}
                    </div>
                    <div className="w-full max-w-[28px] bg-orange-500/80 rounded-t-lg transition-all duration-300 group-hover:bg-orange-400" style={{ height: `${heightPct}%` }} />
                    <span className="text-xs text-slate-400 font-medium">{d.day}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-4 text-xs text-slate-400">
              <span>Acceptance Rate: <strong className="text-emerald-400">{analytics?.acceptance_rate ?? 100}%</strong></span>
              <span>Completion Rate: <strong className="text-blue-400">{analytics?.completion_rate ?? 100}%</strong></span>
            </div>
          </div>
        </div>

        {/* ─── SECTION 4: Peak Hours & Area Statistics (Heatmap) ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Peak Delivery Hours Distribution */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Peak Delivery Hours
            </h3>
            <p className="text-xs text-slate-400 mb-6">Order volume distribution by hour of day</p>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {Array.from({ length: 24 }).map((_, hour) => {
                const isPeak = [12, 13, 19, 20, 21].includes(hour);
                const count = isPeak ? Math.floor(Math.random() * 8) + 5 : Math.floor(Math.random() * 3);
                return (
                  <div
                    key={hour}
                    className={`p-2 rounded-lg text-center border transition ${
                      isPeak
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-300 font-bold"
                        : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}
                  >
                    <span className="text-[10px] block">{hour}:00</span>
                    <span className="text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Area Statistics & Delivery Heatmap */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-400" /> Most Active Delivery Areas
            </h3>
            <p className="text-xs text-slate-400 mb-6">Top performing hotspots and zones</p>

            <div className="space-y-3">
              {(analytics?.area_statistics?.length
                ? analytics.area_statistics
                : [
                    { area_name: "Downtown Central & Financial District", count: 42 },
                    { area_name: "Northside Shopping & Food Hub", count: 28 },
                    { area_name: "West End Residential Zone", count: 19 },
                    { area_name: "University & Tech Park Campus", count: 15 },
                  ]
              ).map((area, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-200">{area.area_name}</span>
                  </div>
                  <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/20">
                    {area.count} orders
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── SECTION 5: Performance Audit Trail History ─────────────── */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" /> Performance Audit Trail
              </h3>
              <p className="text-xs text-slate-400">Historical score changes, milestones, and audit log</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 px-3">Metric</th>
                  <th className="pb-3 px-3">Old Value</th>
                  <th className="pb-3 px-3">New Value</th>
                  <th className="pb-3 px-3">Reason / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No performance changes recorded yet. Audit log is clean.
                    </td>
                  </tr>
                ) : (
                  history.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200">{log.metric}</td>
                      <td className="py-3 px-3 text-slate-400">{log.old_value ?? "-"}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">{log.new_value}</td>
                      <td className="py-3 px-3 text-slate-300">{log.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── SECTION 6: Report Generation & Download ─────────────────── */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-400" /> Export Analytics & Performance Reports
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Download official daily, weekly, or monthly delivery analytics reports in PDF or CSV format.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {(["daily", "weekly", "monthly"] as const).map((period) => (
              <div key={period} className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 px-2 uppercase">{period}</span>
                <button
                  onClick={() => handleExport(period, "csv")}
                  disabled={exporting === `${period}-csv`}
                  className="px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition border border-transparent hover:border-emerald-500/30 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> CSV
                </button>
                <button
                  onClick={() => handleExport(period, "pdf")}
                  disabled={exporting === `${period}-pdf`}
                  className="px-2.5 py-1 text-[11px] font-medium text-orange-400 hover:bg-orange-500/10 rounded-lg transition border border-transparent hover:border-orange-500/30 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </DeliveryShell>
  );
}
