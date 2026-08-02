"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Sliders,
  ChevronLeft,
  User,
  Package,
  Activity,
  Zap,
  BarChart2,
  FileText
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";

interface FraudCaseRecord {
  id: string;
  partner_id: string;
  partner_name?: string;
  partner_email?: string;
  partner_phone?: string;
  order_id?: string;
  fraud_type: string;
  risk_score: number;
  severity: "Low" | "Medium" | "High" | "Critical";
  reason: string;
  gps_data?: any;
  device_data?: any;
  status: "pending" | "under_review" | "resolved" | "dismissed" | "blocked" | "suspended";
  created_at: string;
  resolved_at?: string;
  resolved_by_name?: string;
  logs?: Array<{
    id: string;
    event: string;
    details: any;
    created_at: string;
  }>;
}

interface FraudRule {
  id: string;
  rule_name: string;
  rule_type: string;
  threshold: number;
  enabled: boolean;
}

export default function AdminFraudPage() {
  const [cases, setCases] = useState<FraudCaseRecord[]>([]);
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [selectedCase, setSelectedCase] = useState<FraudCaseRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"cases" | "rules" | "analytics">("cases");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [resolutionNotes, setResolutionNotes] = useState<string>("");

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterReason, setFilterReason] = useState<string>("");
  const [filterPartner, setFilterPartner] = useState<string>("");
  const [filterOrder, setFilterOrder] = useState<string>("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const fetchCasesAndRules = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      const params = new URLSearchParams();
      if (filterSeverity) params.append("risk_level", filterSeverity);
      if (filterStatus) params.append("status", filterStatus);
      if (filterReason) params.append("reason", filterReason);
      if (filterPartner) params.append("partner_id", filterPartner);
      if (filterOrder) params.append("order_id", filterOrder);

      const res = await fetch(`${API_BASE}/api/admin/fraud?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setCases(data.data.cases || []);
        setRules(data.data.rules || []);
      }
    } catch (err) {
      console.error("[AdminFraudPage] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, filterSeverity, filterStatus, filterReason, filterPartner, filterOrder]);

  useEffect(() => {
    fetchCasesAndRules();

    const socket = getSocket();
    if (socket) {
      socket.on(SOCKET_EVENTS.ADMIN_FRAUD_NEW, () => {
        fetchCasesAndRules();
      });

      socket.on(SOCKET_EVENTS.ADMIN_FRAUD_UPDATE, () => {
        fetchCasesAndRules();
      });
    }

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.ADMIN_FRAUD_NEW);
        socket.off(SOCKET_EVENTS.ADMIN_FRAUD_UPDATE);
      }
    };
  }, [fetchCasesAndRules]);

  const handleReviewCase = async (caseId: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/fraud/${caseId}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: resolutionNotes })
      });
      const data = await res.json();
      if (data.success) {
        fetchCasesAndRules();
        if (selectedCase?.id === caseId) setSelectedCase(data.data);
      }
    } catch (err) {
      console.error("[ReviewError]", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveCase = async (caseId: string, status: "resolved" | "dismissed") => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/fraud/${caseId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes: resolutionNotes, restore_partner: true })
      });
      const data = await res.json();
      if (data.success) {
        fetchCasesAndRules();
        if (selectedCase?.id === caseId) setSelectedCase(data.data);
      }
    } catch (err) {
      console.error("[ResolveError]", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRule = async (ruleId: string, threshold: number, enabled: boolean) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/admin/fraud/rules`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rule_id: ruleId, threshold, enabled })
      });
      const data = await res.json();
      if (data.success) {
        fetchCasesAndRules();
      }
    } catch (err) {
      console.error("[UpdateRuleError]", err);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Critical":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">Critical</span>;
      case "High":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">High</span>;
      case "Medium":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Medium</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Low</span>;
    }
  };

  // Metrics summary
  const totalCases = cases.length;
  const criticalCases = cases.filter(c => c.severity === "Critical").length;
  const highCases = cases.filter(c => c.severity === "High").length;
  const pendingCases = cases.filter(c => c.status === "pending" || c.status === "under_review").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      {/* Top Admin Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-500" />
                Fraud Detection & Risk Control Center
              </h1>
              <p className="text-xs text-slate-400">Real-time Risk Engine, Rule Enforcement & Case Audit Log</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("cases")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "cases"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              Fraud Cases ({totalCases})
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "rules"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              Fraud Rules ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "analytics"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              Risk Analytics
            </button>
            <button
              onClick={fetchCasesAndRules}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-slate-400 text-xs font-medium">
              <span>Total Flagged Cases</span>
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2">{totalCases}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-slate-400 text-xs font-medium">
              <span>Pending Action</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-400 mt-2">{pendingCases}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-slate-400 text-xs font-medium">
              <span>Critical Risk (81-100)</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-rose-400 mt-2">{criticalCases}</div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex justify-between text-slate-400 text-xs font-medium">
              <span>High Risk (61-80)</span>
              <Zap className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-3xl font-extrabold text-orange-400 mt-2">{highCases}</div>
          </div>
        </div>

        {/* TAB 1: FRAUD CASES */}
        {activeTab === "cases" && (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mr-2">
                <Filter className="w-4 h-4 text-rose-400" /> Filters:
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="">All Risk Levels</option>
                <option value="Low">Low (0-30)</option>
                <option value="Medium">Medium (31-60)</option>
                <option value="High">High (61-80)</option>
                <option value="Critical">Critical (81-100)</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
                <option value="blocked">Blocked</option>
                <option value="suspended">Suspended</option>
              </select>

              <input
                type="text"
                placeholder="Search Reason..."
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 w-40"
              />

              <input
                type="text"
                placeholder="Partner UUID..."
                value={filterPartner}
                onChange={(e) => setFilterPartner(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 w-44"
              />

              <input
                type="text"
                placeholder="Order UUID..."
                value={filterOrder}
                onChange={(e) => setFilterOrder(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 w-44"
              />

              <button
                onClick={() => {
                  setFilterSeverity("");
                  setFilterStatus("");
                  setFilterReason("");
                  setFilterPartner("");
                  setFilterOrder("");
                }}
                className="text-xs text-slate-400 hover:text-white underline ml-auto"
              >
                Clear Filters
              </button>
            </div>

            {/* Cases Table & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cases Table */}
              <div className="lg:col-span-2 bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
                      <tr>
                        <th className="py-3 px-4">Partner</th>
                        <th className="py-3 px-4">Fraud Type</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {cases.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCase(c)}
                          className={`cursor-pointer transition-colors ${
                            selectedCase?.id === c.id ? "bg-slate-800/80" : "hover:bg-slate-800/30"
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{c.partner_name || "Partner"}</div>
                            <div className="text-[11px] text-slate-400">{c.partner_phone || c.partner_id?.slice(0, 8)}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-200">{c.fraud_type}</td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-400">+{c.risk_score}</td>
                          <td className="py-3 px-4">{getSeverityBadge(c.severity)}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 text-xs rounded font-medium capitalize ${
                                c.status === "resolved"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : c.status === "blocked" || c.status === "suspended"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCase(c);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Selected Case Timeline & Action Panel */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 space-y-4">
                {selectedCase ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="font-bold text-lg text-white">{selectedCase.fraud_type}</h3>
                        <p className="text-xs text-slate-400">Case ID: {selectedCase.id}</p>
                      </div>
                      {getSeverityBadge(selectedCase.severity)}
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div>
                        <span className="text-slate-400">Partner:</span>{" "}
                        <span className="font-semibold text-white">{selectedCase.partner_name || selectedCase.partner_id}</span>
                      </div>
                      {selectedCase.order_id && (
                        <div>
                          <span className="text-slate-400">Order ID:</span>{" "}
                          <span className="font-mono text-slate-200">{selectedCase.order_id}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400">Reason:</span>{" "}
                        <span className="text-rose-300 font-medium">{selectedCase.reason}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Created:</span>{" "}
                        <span>{new Date(selectedCase.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Resolution Notes Input */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <label className="text-xs text-slate-400 font-medium">Review & Resolution Notes</label>
                      <textarea
                        rows={3}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add review notes or justification..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* Review & Resolve Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleReviewCase(selectedCase.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                      >
                        Review Case
                      </button>
                      <button
                        onClick={() => handleResolveCase(selectedCase.id, "resolved")}
                        disabled={actionLoading}
                        className="flex-1 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors"
                      >
                        Resolve & Restore
                      </button>
                    </div>

                    {/* Case Timeline / Audit Logs */}
                    <div className="pt-4 border-t border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Log Timeline</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedCase.logs && selectedCase.logs.length > 0 ? (
                          selectedCase.logs.map((log) => (
                            <div key={log.id} className="p-2 rounded-lg bg-slate-800/40 text-[11px] border border-slate-800">
                              <div className="font-semibold text-slate-200">{log.event}</div>
                              <div className="text-slate-400">{new Date(log.created_at).toLocaleString()}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-500 italic">No audit logs available for this case.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Select a fraud case from the table to view details, audit timeline, and take resolution actions.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FRAUD RULES CONFIGURATION */}
        {activeTab === "rules" && (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-rose-400" />
              Automated Risk Detection Rules & Thresholds
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-100 text-sm">{rule.rule_name}</div>
                    <div className="text-xs text-slate-400 font-mono">Type: {rule.rule_type}</div>
                    <div className="text-xs text-amber-400 font-medium">Risk Impact: +{rule.threshold} pts</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={rule.threshold}
                      onChange={(e) => handleUpdateRule(rule.id, parseInt(e.target.value || "0", 10), rule.enabled)}
                      className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center text-white"
                    />

                    <button
                      onClick={() => handleUpdateRule(rule.id, rule.threshold, !rule.enabled)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        rule.enabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RISK ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              Risk Monitoring & Severity Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">Severity Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Critical (81-100)</span>
                      <span>{criticalCases} cases</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: `${totalCases ? (criticalCases / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>High (61-80)</span>
                      <span>{highCases} cases</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${totalCases ? (highCases / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Medium (31-60)</span>
                      <span>{cases.filter(c => c.severity === "Medium").length} cases</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${totalCases ? (cases.filter(c => c.severity === "Medium").length / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>Low (0-30)</span>
                      <span>{cases.filter(c => c.severity === "Low").length} cases</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${totalCases ? (cases.filter(c => c.severity === "Low").length / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">Automated Actions Executed</h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60">
                    <span>Log Only (Low):</span>
                    <span className="font-bold text-emerald-400">{cases.filter(c => c.severity === "Low").length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60">
                    <span>Warning Notifications Sent:</span>
                    <span className="font-bold text-amber-400">{cases.filter(c => c.severity === "Medium").length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60">
                    <span>Temporary Blocks Enforced:</span>
                    <span className="font-bold text-orange-400">{cases.filter(c => c.severity === "High").length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60">
                    <span>Partner Suspensions Triggered:</span>
                    <span className="font-bold text-rose-400">{criticalCases}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
