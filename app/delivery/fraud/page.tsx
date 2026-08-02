"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  RefreshCw,
  Info,
  ShieldCheck,
  Zap,
  Lock
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

interface FraudStatus {
  partner_id: string;
  risk_score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  is_blocked: boolean;
  is_suspended: boolean;
  restriction_status: string;
  active_case?: {
    id: string;
    fraud_type: string;
    reason: string;
    status: string;
    created_at: string;
  };
}

interface FraudCaseItem {
  id: string;
  fraud_type: string;
  risk_score: number;
  severity: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

export default function DeliveryFraudPage() {
  const [status, setStatus] = useState<FraudStatus | null>(null);
  const [history, setHistory] = useState<FraudCaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchStatusAndHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const [resStatus, resHistory] = await Promise.all([
        fetch(`${API_BASE}/api/delivery/fraud/status`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/delivery/fraud/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const statusData = await resStatus.json();
      const historyData = await resHistory.json();

      if (statusData.success) {
        setStatus(statusData.data);
      } else {
        // Fallback default status
        setStatus({
          partner_id: "",
          risk_score: 15,
          severity: "Low",
          is_blocked: false,
          is_suspended: false,
          restriction_status: "active"
        });
      }

      if (historyData.success) {
        setHistory(historyData.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load fraud status history.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchStatusAndHistory();

    const socket = getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.DELIVERY_FRAUD_WARNING, (data: any) => {
        console.log("[Socket] Fraud warning:", data);
        fetchStatusAndHistory();
      });

      socket.on(SOCKET_EVENTS.DELIVERY_FRAUD_BLOCKED, (data: any) => {
        console.log("[Socket] Fraud blocked:", data);
        fetchStatusAndHistory();
      });
    }

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.DELIVERY_FRAUD_WARNING);
        socket.off(SOCKET_EVENTS.DELIVERY_FRAUD_BLOCKED);
      }
    };
  }, [fetchStatusAndHistory]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 81) return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    if (score >= 61) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    if (score >= 31) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Critical (81-100)</span>;
      case "High":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">High (61-80)</span>;
      case "Medium":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Medium (31-60)</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Low (0-30)</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/delivery"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-emerald-400" />
                Fraud & Risk Safety Monitor
              </h1>
              <p className="text-xs text-slate-400">Automated Account Health & Safety Dashboard</p>
            </div>
          </div>
          <button
            onClick={fetchStatusAndHistory}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-6">
        {/* Risk Score & Account Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Risk Score Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Current Risk Score</span>
              <ShieldCheck className="w-5 h-5 text-slate-400" />
            </div>
            <div className="my-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">{status?.risk_score ?? 0}</span>
                <span className="text-sm text-slate-400">/ 100</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (status?.risk_score ?? 0) >= 81
                      ? "bg-rose-500"
                      : (status?.risk_score ?? 0) >= 61
                      ? "bg-orange-500"
                      : (status?.risk_score ?? 0) >= 31
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, status?.risk_score ?? 0))}%` }}
                />
              </div>
            </div>
            <div>{getSeverityBadge(status?.severity || "Low")}</div>
          </div>

          {/* Account Status Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Account Status</span>
              <Lock className="w-5 h-5 text-slate-400" />
            </div>
            <div className="my-4">
              {status?.is_suspended ? (
                <div className="flex items-center gap-3 text-rose-400">
                  <XCircle className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-lg">Account Suspended</div>
                    <div className="text-xs text-rose-300/80">Critical risk flags detected</div>
                  </div>
                </div>
              ) : status?.is_blocked ? (
                <div className="flex items-center gap-3 text-orange-400">
                  <AlertTriangle className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-lg">Orders Restricted</div>
                    <div className="text-xs text-orange-300/80">High risk score active</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle className="w-8 h-8 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-lg">Active & Healthy</div>
                    <div className="text-xs text-emerald-300/80">Full privileges enabled</div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Restriction: <span className="text-slate-200 capitalize font-medium">{status?.restriction_status || "None"}</span>
            </div>
          </div>

          {/* Active Restriction Details */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400 font-medium">Restriction Details</span>
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            {status?.active_case ? (
              <div className="my-3 space-y-1">
                <div className="text-sm font-semibold text-amber-300">{status.active_case.fraud_type}</div>
                <div className="text-xs text-slate-300 line-clamp-2">{status.active_case.reason}</div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Logged: {new Date(status.active_case.created_at).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="my-4 text-xs text-slate-400 italic">No active restrictions or warnings. Keep delivering safely!</div>
            )}
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 24/7 Automated Safety Engine
            </div>
          </div>
        </div>

        {/* Safety Tips Panel */}
        <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-4">
          <Info className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm text-blue-200/90">
            <h3 className="font-semibold text-blue-100">Delivery Partner Safety Guidelines</h3>
            <p className="text-xs leading-relaxed text-blue-200/80">
              To keep your risk score at Low (0-30): Avoid mock location / GPS spoofing apps, ensure stable cellular connection during OTP verification, complete deliveries directly at customer locations, and never share credentials across multiple devices simultaneously.
            </p>
          </div>
        </div>

        {/* Fraud Events History */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Recent Fraud & Risk Events Log
          </h2>

          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Loading risk logs...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm">No fraud events recorded for your account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Event / Fraud Type</th>
                    <th className="py-3 px-4">Risk Score</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 rounded-r-lg">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">{item.fraud_type}</td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">+{item.risk_score}</td>
                      <td className="py-3 px-4">{getSeverityBadge(item.severity)}</td>
                      <td className="py-3 px-4 text-xs text-slate-300 max-w-xs truncate">{item.reason}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-xs rounded font-medium capitalize ${
                            item.status === "resolved"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : item.status === "blocked" || item.status === "suspended"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
