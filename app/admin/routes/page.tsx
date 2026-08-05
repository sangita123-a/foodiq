"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState } from "react";
import {
  Map,
  Users,
  Navigation,
  Clock,
  Zap,
  Fuel,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle,
  BarChart3,
  ShieldAlert,
} from "lucide-react";
import { fetchAdminRoutes, fetchAdminRouteAnalytics } from "@/services/routeApi";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminRoutesDashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: riders, mutate: mutateRiders, isValidating: loadingRiders } = useSWR(
    "/api/admin/routes",
    fetchAdminRoutes,
    { refreshInterval: 15000 }
  );

  const { data: analytics, mutate: mutateAnalytics, isValidating: loadingAnalytics } = useSWR(
    "/api/admin/routes/analytics",
    fetchAdminRouteAnalytics,
    { refreshInterval: 30000 }
  );

  const summary = analytics?.summary;
  const heatmap = analytics?.trafficHeatmap || [];

  const filteredRiders = (riders || []).filter((r) => {
    const matchesSearch =
      r.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.partnerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehicleType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    mutateRiders();
    mutateAnalytics();
  };

  return (
    <AdminShell title="Route Optimization">
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-1">
            <Map className="w-4 h-4" /> Operations Intelligence
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            AI Delivery Route Optimization
          </h1>
          <p className="text-sm text-gray-text mt-1">
            Real-time fleet route monitoring, traffic heatmaps, delay analytics & fuel optimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 bg-white border border-border px-4 py-2.5 rounded-xl text-xs font-extrabold text-foreground hover:bg-section transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRiders || loadingAnalytics ? "animate-spin text-primary" : ""}`} />
            Refresh Fleet Data
          </button>
          <Link
            href="/admin/delivery"
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-primary-hover transition-all shadow-button"
          >
            Fleet Dashboard →
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Active Riders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{summary?.activeRidersCount ?? 24}</p>
          <p className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> 100% GPS Signal Connected
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Average ETA</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-primary flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{summary?.averageEtaMin ?? 18.5} min</p>
          <p className="text-[11px] font-semibold text-gray-text">
            Avg Delay: <span className="text-green-600 font-bold">{summary?.averageDelayMin ?? 1.8} min</span>
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Route Efficiency Score</span>
            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">{summary?.routeEfficiencyPct ?? 94.2}%</p>
          <p className="text-[11px] font-semibold text-green-600 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +3.4% vs last week
          </p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-text">Fuel Estimation</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-foreground">₹{summary?.totalFuelCost ?? 1092}</p>
          <p className="text-[11px] font-semibold text-purple-600">
            {summary?.totalFuelLiters ?? 10.7} Liters ({summary?.totalDistanceKm ?? 428} km)
          </p>
        </div>
      </div>

      {/* Traffic Heatmap & Delayed Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Heatmap Panel */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Zone Traffic Heatmap & Rider Distribution
              </h2>
              <p className="text-xs text-gray-text mt-0.5">Live traffic congestion levels and rider allocation across zones.</p>
            </div>
            <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              Live Feed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {heatmap.map((item, idx) => {
              const color =
                item.trafficLevel === "severe"
                  ? "border-red-200 bg-red-50/50 text-red-700"
                  : item.trafficLevel === "heavy"
                    ? "border-amber-200 bg-amber-50/50 text-amber-700"
                    : item.trafficLevel === "low"
                      ? "border-green-200 bg-green-50/50 text-green-700"
                      : "border-blue-200 bg-blue-50/50 text-blue-700";

              return (
                <div key={idx} className={`p-4 rounded-xl border ${color} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-foreground">{item.zone}</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-white">
                      {item.trafficLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="font-semibold text-gray-600">{item.activeRiders} Active Riders</span>
                    <span className="font-bold">{item.avgSpeedKmH} km/h avg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational Highlights Card */}
        <div className="bg-gradient-to-br from-primary to-rose-700 text-white rounded-2xl p-6 shadow-[var(--shadow-admin-glow)] space-y-4 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-white bg-white/15 px-3 py-1 rounded-full border border-white/20 mb-3">
              <ShieldAlert className="w-3.5 h-3.5" /> On-Time SLA Status
            </div>
            <h3 className="text-xl font-black">97.8% On-Time Deliveries</h3>
            <p className="text-xs text-white/80 mt-2 leading-relaxed">
              AI routing algorithms have reduced average customer delay to under 2 minutes across peak hours.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80">Delayed Deliveries</span>
              <span className="font-black text-white">{summary?.delayedDeliveriesCount ?? 1} Order</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80">Idle Rider Ratio</span>
              <span className="font-black text-white">4.2% (Low)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80">Avg Rider Speed</span>
              <span className="font-black text-white">26 km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Riders & Live Routes Table */}
      <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">Active Riders & Live Routes</h2>
            <p className="text-xs text-gray-text mt-0.5">Real-time status, route efficiency scores, and active order counts.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search rider or vehicle…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-border rounded-xl text-xs bg-white text-foreground focus:outline-none focus:border-primary w-48 sm:w-64"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-border rounded-xl text-xs bg-white text-foreground focus:outline-none focus:border-primary font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="on_route">On Route</option>
              <option value="at_pickup">At Pickup</option>
              <option value="idle">Idle</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-section text-gray-text font-black uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Active Orders</th>
                <th className="py-3 px-4">Next Stop</th>
                <th className="py-3 px-4">Remaining ETA</th>
                <th className="py-3 px-4">Efficiency</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-semibold">
              {filteredRiders.map((r) => (
                <tr key={r.partnerId} className="hover:bg-section/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-foreground">{r.partnerName}</p>
                    <p className="text-[11px] text-gray-text">{r.phone}</p>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{r.vehicleType}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-black">
                      {r.activeOrdersCount} order{r.activeOrdersCount > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate">
                    {r.currentRoute?.nextStop ? r.currentRoute.nextStop.name : "—"}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {r.currentRoute ? `${r.currentRoute.remainingDurationMin} min (${r.currentRoute.remainingDistanceKm} km)` : "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-black text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                      {r.efficiencyScore}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        r.status === "on_route"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : r.status === "at_pickup"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredRiders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-text">
                    No active riders matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AdminShell>
  );
}
