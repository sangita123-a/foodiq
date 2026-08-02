"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Phone,
  Radio,
  Battery,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  RefreshCw,
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import { isClientAuthenticated } from "@/lib/authSession";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@/lib/accessToken";

const REASONS = [
  { id: "Accident", label: "Accident", icon: "💥", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "Vehicle Breakdown", label: "Vehicle Breakdown", icon: "🔧", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  { id: "Medical Emergency", label: "Medical Emergency", icon: "🚑", color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
  { id: "Customer Threat", label: "Customer Threat", icon: "⚠️", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "Robbery", label: "Robbery", icon: "🚨", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "Harassment", label: "Harassment", icon: "🛡️", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { id: "Road Block", label: "Road Block", icon: "🚧", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { id: "Other", label: "Other", icon: "🆘", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
];

interface ActiveEmergency {
  id: string;
  reason: string;
  description: string;
  status: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  battery_level?: number;
  network_type?: string;
  created_at: string;
  order_number?: string;
  order_status?: string;
  customer_address?: string;
}

interface EmergencyHistoryItem {
  id: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  order_number?: string;
}

export default function DeliveryEmergencyPage() {
  const router = useRouter();
  const { data: dashboard } = useDeliveryDashboard();
  const [activeEmergency, setActiveEmergency] = useState<ActiveEmergency | null>(null);
  const [history, setHistory] = useState<EmergencyHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Form State
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; accuracy: number | null }>({
    lat: 12.9716,
    lng: 77.5946,
    accuracy: 10,
  });
  const [gpsStatus, setGpsStatus] = useState<"locating" | "active" | "denied">("locating");
  const [batteryLevel, setBatteryLevel] = useState<number | null>(85);
  const [networkType, setNetworkType] = useState<string>("4G / WiFi");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Auth guard
  useEffect(() => {
    if (typeof window !== "undefined" && !isClientAuthenticated()) {
      router.replace("/delivery/login");
    }
  }, [router]);

  // Real-time API base
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Fetch GPS & Device Info
  const fetchDeviceInfo = useCallback(() => {
    // Battery API
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      (navigator as any).getBattery?.().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
      }).catch(() => {});
    }

    // Network connection type
    if (typeof navigator !== "undefined" && "connection" in navigator) {
      const conn = (navigator as any).connection;
      if (conn?.effectiveType) {
        setNetworkType(conn.effectiveType.toUpperCase());
      }
    }

    // Geolocation
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setGpsStatus("locating");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          });
          setGpsStatus("active");
        },
        () => {
          setGpsStatus("denied");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch active SOS and history
  const fetchActiveAndHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAccessToken() ?? "";
      const headers = { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" };

      // Active check
      const activeRes = await fetch(`${apiBase}/api/delivery/emergency/active`, { credentials: "include", headers });
      const activeData = await activeRes.json();
      if (activeData.success && activeData.data) {
        setActiveEmergency(activeData.data);
      } else {
        setActiveEmergency(null);
      }

      // History check
      const historyRes = await fetch(`${apiBase}/api/delivery/emergency/history?limit=10`, { credentials: "include", headers });
      const historyData = await historyRes.json();
      if (historyData.success && Array.isArray(historyData.data)) {
        setHistory(historyData.data);
      }
    } catch (err) {
      console.error("Failed to load emergency data:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Initial load & Socket connection
  useEffect(() => {
    fetchDeviceInfo();
    fetchActiveAndHistory();

    const socket = getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.EMERGENCY_RESOLVED, (data: any) => {
        if (activeEmergency && data?.id === activeEmergency.id) {
          setActiveEmergency(null);
          setFeedback({ type: "success", text: "Emergency marked as RESOLVED by Support Team." });
          fetchActiveAndHistory();
        }
      });
      socket.on(SOCKET_EVENTS.EMERGENCY_CANCELLED, () => {
        fetchActiveAndHistory();
      });
    }

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.EMERGENCY_RESOLVED);
        socket.off(SOCKET_EVENTS.EMERGENCY_CANCELLED);
      }
    };
  }, [fetchDeviceInfo, fetchActiveAndHistory, activeEmergency]);

  // 10-second GPS ping loop if SOS is active
  useEffect(() => {
    if (!activeEmergency || activeEmergency.status !== "active") return;

    const pingInterval = setInterval(async () => {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const token = getAccessToken() ?? "";
            try {
              await fetch(`${apiBase}/api/delivery/location/update`, {
                method: "POST",
                credentials: "include",
                headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
                body: JSON.stringify({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                  accuracy: Math.round(pos.coords.accuracy),
                  speed: pos.coords.speed || 0,
                  heading: pos.coords.heading || 0,
                }),
              });
            } catch {
              /* ignore ping fail */
            }
          },
          () => {},
          { enableHighAccuracy: true }
        );
      }
    }, 10000);

    return () => clearInterval(pingInterval);
  }, [activeEmergency, apiBase]);

  // Handle Create SOS submission
  const handleTriggerSOS = async () => {
    if (!selectedReason) {
      setFeedback({ type: "error", text: "Please select an emergency reason." });
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const token = getAccessToken() ?? "";

      const res = await fetch(`${apiBase}/api/delivery/emergency`, {
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: selectedReason,
          description,
          latitude: gpsLocation.lat,
          longitude: gpsLocation.lng,
          accuracy: gpsLocation.accuracy,
          battery_level: batteryLevel,
          network_type: networkType,
          device_info: {
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
            platform: typeof navigator !== "undefined" ? navigator.platform : "",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to trigger SOS emergency");
      }

      setActiveEmergency(data.data);
      setShowModal(false);
      setSelectedReason("");
      setDescription("");
      setFeedback({ type: "success", text: "🚨 SOS Alert Broadcasted! Admin team notified instantly." });
      fetchActiveAndHistory();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFeedback({ type: "error", text: e.message || "Something went wrong sending SOS alert." });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel SOS
  const handleCancelSOS = async () => {
    if (!confirm("Are you sure you want to cancel this emergency request?")) return;

    try {
      setCancelling(true);
      const token = getAccessToken() ?? "";
      const res = await fetch(`${apiBase}/api/delivery/emergency/cancel`, {
        method: "PATCH",
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        setActiveEmergency(null);
        setFeedback({ type: "success", text: "Emergency request cancelled." });
        fetchActiveAndHistory();
      } else {
        throw new Error(data.message);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setFeedback({ type: "error", text: e.message || "Failed to cancel emergency." });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <DeliveryShell title="Emergency SOS" online={dashboard?.is_online}>
      <div className="-m-4 md:-m-8 bg-slate-950 text-slate-100 font-sans pb-12 min-h-[calc(100vh-5rem)]">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-red-900/30 px-4 py-3.5 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
            <h1 className="text-lg font-bold tracking-tight text-white">Foodiq Safety & SOS</h1>
          </div>
        </div>
        <button
          onClick={fetchActiveAndHistory}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
              feedback.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/80 border-red-500/40 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{feedback.text}</div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
              &times;
            </button>
          </div>
        )}

        {/* ACTIVE EMERGENCY CARD */}
        {activeEmergency ? (
          <div className="bg-red-950/40 border-2 border-red-500/80 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-red-600 text-white font-bold text-xs rounded-bl-2xl uppercase tracking-wider animate-pulse">
              Emergency Active
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-2xl shrink-0">
                🚨
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-red-400">{activeEmergency.reason}</h2>
                <p className="text-xs text-slate-400">
                  Reported at {new Date(activeEmergency.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {activeEmergency.description && (
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-red-900/30 text-sm text-slate-300 italic">
                "{activeEmergency.description}"
              </div>
            )}

            {/* Linked Order info */}
            {activeEmergency.order_number && (
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Package className="w-4 h-4" /> Linked Order #{activeEmergency.order_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase text-[10px]">
                    {activeEmergency.order_status}
                  </span>
                </div>
                {activeEmergency.customer_address && (
                  <p className="text-xs text-slate-300 line-clamp-1">📍 {activeEmergency.customer_address}</p>
                )}
              </div>
            )}

            {/* Telemetry Status */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-ping" />
                <div>
                  <div className="text-slate-400">10s Live GPS Ping</div>
                  <div className="font-semibold text-slate-200">Tracking Active</div>
                </div>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-2">
                <Battery className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-slate-400">Battery Level</div>
                  <div className="font-semibold text-slate-200">{activeEmergency.battery_level ?? batteryLevel}%</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <a
                href="tel:112"
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-red-900/40 transition-all text-sm"
              >
                <Phone className="w-4 h-4" /> Call Police Emergency (112)
              </a>
              <button
                onClick={handleCancelSOS}
                disabled={cancelling}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {cancelling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 text-slate-400" />}
                Cancel Request
              </button>
            </div>
          </div>
        ) : (
          /* PANIC SOS BUTTON CARD */
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-6 shadow-xl relative">
            <div>
              <h2 className="text-xl font-extrabold text-white">Emergency Assistance</h2>
              <p className="text-xs text-slate-400 mt-1">Press the panic button if you face danger, threat, or accident.</p>
            </div>

            {/* PANIC BUTTON */}
            <div className="py-4 flex justify-center">
              <button
                onClick={() => setShowModal(true)}
                className="w-44 h-44 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 p-3 shadow-[0_0_50px_rgba(225,29,72,0.5)] hover:shadow-[0_0_70px_rgba(225,29,72,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center text-white border-4 border-red-400/50"
              >
                <ShieldAlert className="w-16 h-16 mb-1 animate-pulse" />
                <span className="text-2xl font-black tracking-widest uppercase">SOS</span>
                <span className="text-[10px] tracking-wider text-red-100 font-medium">TAP FOR HELP</span>
              </button>
            </div>

            {/* Live GPS Telemetry Header */}
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className={`w-4 h-4 ${gpsStatus === "active" ? "text-emerald-400" : "text-amber-400 animate-pulse"}`} />
                <span className="text-slate-300">
                  {gpsStatus === "active" ? "GPS Locked" : "Acquiring Location..."}
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span className="flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-blue-400" /> {batteryLevel}%
                </span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-purple-400" /> {networkType}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SOS REASON REASON MODAL */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-bold text-white">Select Emergency Reason</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  &times;
                </button>
              </div>

              {/* Reasons Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReason(r.id)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      selectedReason === r.id
                        ? "bg-red-600 text-white border-red-400 shadow-lg shadow-red-900/50"
                        : `${r.color} hover:opacity-90`
                    }`}
                  >
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-xs font-bold leading-snug">{r.label}</span>
                  </button>
                ))}
              </div>

              {/* Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Additional Details (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your location or situation..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors h-20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTriggerSOS}
                  disabled={submitting || !selectedReason}
                  className="w-2/3 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-900/40 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  SEND EMERGENCY SOS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMERGENCY HISTORY */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Emergency Log History
            </h3>
            <span className="text-xs text-slate-500">{history.length} records</span>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">No past emergency reports found.</div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/70 flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span>{item.reason}</span>
                      {item.order_number && (
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-md">
                          #{item.order_number}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.status === "active"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : item.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </div>
    </DeliveryShell>
  );
}
