"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Phone,
  Search,
  Filter,
  CheckCircle,
  Radio,
  Battery,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  User,
  Store,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import GoogleEmergencyMap from "@/components/GoogleEmergencyMap";
import AdminShell from "@/components/admin/AdminShell";
import { Badge, EmptyState } from "@/components/admin/ui";

interface EmergencyRecord {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_phone: string;
  vehicle_type?: string;
  vehicle_number?: string;
  reason: string;
  description?: string;
  status: "active" | "resolved" | "cancelled";
  latitude: number;
  longitude: number;
  accuracy?: number;
  battery_level?: number;
  network_type?: string;
  created_at: string;
  resolved_at?: string;
  order_number?: string;
  order_status?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  restaurant_name?: string;
  restaurant_phone?: string;
  restaurant_address?: string;
  restaurant_lat?: number;
  restaurant_lng?: number;
  unresolved_alert?: boolean;
}

export default function AdminEmergencyPage() {
  const [emergencies, setEmergencies] = useState<EmergencyRecord[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastAlert, setToastAlert] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch Single Emergency Detail
  const fetchEmergencyDetail = useCallback(async (id: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${apiBase}/api/admin/emergencies/${id}`, {
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSelectedEmergency(data.data);
      }
    } catch (err) {
      console.error("Failed to load emergency detail:", err);
    }
  }, [apiBase]);

  // Fetch Emergencies List
  const fetchEmergencies = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (statusFilter !== "all" && statusFilter !== "") params.append("status", statusFilter);
      if (reasonFilter !== "all" && reasonFilter !== "") params.append("reason", reasonFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${apiBase}/api/admin/emergencies?${params.toString()}`, {
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setEmergencies(data.data);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);

        // Auto-select first active or first record if none selected
        if (!selectedEmergency && data.data.length > 0) {
          const active = data.data.find((e: EmergencyRecord) => e.status === "active") || data.data[0];
          fetchEmergencyDetail(active.id);
        }
      }
    } catch (err) {
      console.error("Failed to load admin emergencies:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase, page, statusFilter, reasonFilter, searchQuery, selectedEmergency, fetchEmergencyDetail]);

  // Socket listener for real-time emergency popups
  useEffect(() => {
    fetchEmergencies();

    const socket = getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.EMERGENCY_NEW, (data: EmergencyRecord) => {
        setToastAlert(`🚨 NEW EMERGENCY ALERT! Rider: ${data.partner_name || "Delivery Partner"} (${data.reason})`);
        fetchEmergencies();
        fetchEmergencyDetail(data.id);
      });

      socket.on(SOCKET_EVENTS.EMERGENCY_UPDATE, (data: EmergencyRecord) => {
        if (data.unresolved_alert) {
          setToastAlert(`⚠️ HIGH PRIORITY: Emergency #${data.id.slice(0, 8)} unresolved for > 5 mins!`);
        }
        fetchEmergencies();
      });

      socket.on(SOCKET_EVENTS.EMERGENCY_RESOLVED, () => {
        fetchEmergencies();
      });

      socket.on(SOCKET_EVENTS.EMERGENCY_CANCELLED, () => {
        fetchEmergencies();
      });
    }

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.EMERGENCY_NEW);
        socket.off(SOCKET_EVENTS.EMERGENCY_UPDATE);
        socket.off(SOCKET_EVENTS.EMERGENCY_RESOLVED);
        socket.off(SOCKET_EVENTS.EMERGENCY_CANCELLED);
      }
    };
  }, [fetchEmergencies]);

  // Handle Mark Resolved
  const handleResolve = async (id: string) => {
    if (!confirm("Are you sure you want to mark this emergency as RESOLVED?")) return;

    try {
      setActionLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${apiBase}/api/admin/emergencies/${id}/resolve`, {
        method: "PATCH",
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        setToastAlert(`Emergency resolved successfully.`);
        fetchEmergencies();
        fetchEmergencyDetail(id);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to resolve emergency.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Escalate
  const handleEscalate = async (id: string) => {
    try {
      setActionLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";
      const res = await fetch(`${apiBase}/api/admin/emergencies/${id}/escalate`, {
        method: "PATCH",
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        setToastAlert(`🔥 Emergency escalated to high priority alert!`);
        fetchEmergencies();
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(err.message || "Failed to escalate emergency.");
    } finally {
      setActionLoading(false);
    }
  };

  const activeCount = emergencies.filter((e) => e.status === "active").length;

  return (
    <AdminShell title="SOS Emergencies">
      <div className="space-y-6">
        {/* Real-time Toast Alert */}
        {toastAlert && (
          <div className="fixed top-6 right-6 z-50 max-w-md bg-red-600 border-2 border-white text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Flame className="w-5 h-5 shrink-0" />
              <span>{toastAlert}</span>
            </div>
            <button onClick={() => setToastAlert(null)} className="text-white hover:text-red-100 text-lg font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-3">
                SOS Emergency Command Center
                {activeCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-xs uppercase animate-pulse">
                    {activeCount} ACTIVE
                  </span>
                )}
              </h1>
              <p className="text-xs text-gray-text mt-0.5">Live monitoring of delivery partner SOS incidents &amp; real-time telemetry</p>
            </div>
          </div>

          <button
            onClick={fetchEmergencies}
            className="px-4 py-2.5 rounded-xl bg-section hover:bg-[var(--surface-hover)] border border-border text-foreground font-bold text-xs transition-colors flex items-center gap-2 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Center
          </button>
        </div>

        {/* Search & Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-border shadow-[var(--shadow-admin-soft)]">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search rider name, phone, order..."
              className="w-full bg-section border border-transparent rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-section border border-transparent rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Reason Filter */}
          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setPage(1);
            }}
            className="bg-section border border-transparent rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
          >
            <option value="">All Emergency Reasons</option>
            <option value="Accident">Accident</option>
            <option value="Vehicle Breakdown">Vehicle Breakdown</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Customer Threat">Customer Threat</option>
            <option value="Robbery">Robbery</option>
            <option value="Harassment">Harassment</option>
            <option value="Road Block">Road Block</option>
            <option value="Other">Other</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setStatusFilter("");
              setReasonFilter("");
              setSearchQuery("");
              setPage(1);
            }}
            className="bg-section hover:bg-[var(--surface-hover)] text-foreground rounded-xl px-3 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-border"
          >
            <Filter className="w-3.5 h-3.5" /> Clear Filters
          </button>
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Emergencies List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" /> Incident List ({totalCount})
                </h2>
                <span className="text-xs text-gray-text">Page {page} of {totalPages}</span>
              </div>

              {loading ? (
                <div className="text-center py-12 flex justify-center">
                  <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : emergencies.length === 0 ? (
                <EmptyState icon={ShieldAlert} title="No incidents found" description="No emergency incidents match the current filters." />
              ) : (
                <div className="space-y-3">
                  {emergencies.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => fetchEmergencyDetail(e.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedEmergency?.id === e.id
                          ? "bg-red-50/60 border-red-200 shadow-[var(--shadow-admin-soft)]"
                          : "bg-section border-border hover:bg-white hover:border-border-hover"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-foreground">{e.reason}</span>
                            <Badge tone={e.status === "active" ? "error" : e.status === "resolved" ? "success" : "neutral"}>
                              {e.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-text mt-1 font-medium">
                            👤 {e.partner_name} ({e.partner_phone})
                          </p>
                        </div>

                        <div className="text-right text-[11px] text-gray-text shrink-0">
                          {new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {e.order_number && (
                        <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-xs text-gray-text">
                          <span>📦 Order #{e.order_number}</span>
                          <span className="text-[10px] text-amber-600 font-bold">{e.order_status}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-section hover:bg-[var(--surface-hover)] text-xs font-bold text-foreground disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4 inline" /> Prev
                  </button>
                  <span className="text-xs font-bold text-foreground">Page {page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-section hover:bg-[var(--surface-hover)] text-xs font-bold text-foreground disabled:opacity-40"
                  >
                    Next <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Selected Incident Detailed Command View & Google Map */}
          <div className="lg:col-span-7 space-y-6">
            {selectedEmergency ? (
              <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-lifted)] p-6 space-y-6">
                {/* Incident Header & Quick Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-red-600">{selectedEmergency.reason}</span>
                      <Badge tone={selectedEmergency.status === "active" ? "error" : selectedEmergency.status === "resolved" ? "success" : "neutral"}>
                        {selectedEmergency.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-text mt-0.5">Incident ID: {selectedEmergency.id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedEmergency.status === "active" && (
                      <>
                        <button
                          onClick={() => handleResolve(selectedEmergency.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-[var(--shadow-button)] disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Mark Resolved
                        </button>
                        <button
                          onClick={() => handleEscalate(selectedEmergency.id)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-[var(--shadow-button)] disabled:opacity-50"
                        >
                          <Flame className="w-4 h-4" /> Escalate
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Google Live Emergency Map */}
                <div className="h-64 w-full rounded-2xl overflow-hidden border border-border">
                  <GoogleEmergencyMap
                    riderLat={Number(selectedEmergency.latitude)}
                    riderLng={Number(selectedEmergency.longitude)}
                    restaurantLat={selectedEmergency.restaurant_lat}
                    restaurantLng={selectedEmergency.restaurant_lng}
                    partnerName={selectedEmergency.partner_name}
                  />
                </div>

                {/* Incident Meta & Telemetry */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-section p-3 rounded-2xl border border-border">
                    <div className="text-gray-text">Rider Contact</div>
                    <a href={`tel:${selectedEmergency.partner_phone}`} className="font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5" /> {selectedEmergency.partner_phone}
                    </a>
                  </div>
                  <div className="bg-section p-3 rounded-2xl border border-border">
                    <div className="text-gray-text">Battery Telemetry</div>
                    <div className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-blue-600" /> {selectedEmergency.battery_level ?? 85}%
                    </div>
                  </div>
                  <div className="bg-section p-3 rounded-2xl border border-border">
                    <div className="text-gray-text">Network Type</div>
                    <div className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5 text-violet-600" /> {selectedEmergency.network_type || "4G"}
                    </div>
                  </div>
                  <div className="bg-section p-3 rounded-2xl border border-border">
                    <div className="text-gray-text">GPS Coordinates</div>
                    <div className="font-mono text-[11px] text-foreground mt-0.5 truncate">
                      {Number(selectedEmergency.latitude).toFixed(4)}, {Number(selectedEmergency.longitude).toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Rider & Order Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Rider Info */}
                  <div className="bg-section p-4 rounded-2xl border border-border space-y-2">
                    <div className="font-bold text-foreground flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-blue-600" /> Delivery Partner Info
                    </div>
                    <div className="space-y-1 text-gray-text">
                      <div><span className="text-[#9CA3AF]">Name:</span> {selectedEmergency.partner_name}</div>
                      <div><span className="text-[#9CA3AF]">Vehicle:</span> {selectedEmergency.vehicle_type || "Bike"} ({selectedEmergency.vehicle_number || "KA-01-AB-1234"})</div>
                      <a
                        href={`tel:${selectedEmergency.partner_phone}`}
                        className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold hover:bg-blue-100"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call Rider Direct
                      </a>
                    </div>
                  </div>

                  {/* Customer / Order Info */}
                  <div className="bg-section p-4 rounded-2xl border border-border space-y-2">
                    <div className="font-bold text-foreground flex items-center gap-2 text-sm">
                      <Store className="w-4 h-4 text-amber-600" /> Order &amp; Customer Info
                    </div>
                    {selectedEmergency.order_number ? (
                      <div className="space-y-1 text-gray-text">
                        <div><span className="text-[#9CA3AF]">Order:</span> #{selectedEmergency.order_number} ({selectedEmergency.order_status})</div>
                        <div><span className="text-[#9CA3AF]">Customer:</span> {selectedEmergency.customer_name || "N/A"}</div>
                        {selectedEmergency.customer_phone && (
                          <a
                            href={`tel:${selectedEmergency.customer_phone}`}
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold hover:bg-amber-100"
                          >
                            <Phone className="w-3.5 h-3.5" /> Call Customer
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-text py-2">No active order was linked during this SOS.</div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {selectedEmergency.description && (
                  <div className="bg-section p-4 rounded-2xl border border-border text-xs space-y-1">
                    <div className="font-bold text-foreground">Rider Description:</div>
                    <p className="text-gray-text italic">&quot;{selectedEmergency.description}&quot;</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-12">
                <EmptyState icon={ShieldAlert} title="No incident selected" description="Select an incident from the list to view live map tracking and details." />
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
