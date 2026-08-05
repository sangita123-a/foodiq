"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  Activity,
  Zap,
  BarChart2,
  FileText
} from "lucide-react";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/dashboard/StatCard";
import { Badge, EmptyState } from "@/components/admin/ui";
import type { BadgeTone } from "@/components/admin/ui";

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

const SEVERITY_TONE: Record<string, BadgeTone> = {
  Critical: "error",
  High: "warning",
  Medium: "warning",
  Low: "success",
};

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

  const getSeverityBadge = (severity: string) => (
    <Badge tone={SEVERITY_TONE[severity] ?? "neutral"}>{severity}</Badge>
  );

  // Metrics summary
  const totalCases = cases.length;
  const criticalCases = cases.filter(c => c.severity === "Critical").length;
  const highCases = cases.filter(c => c.severity === "High").length;
  const pendingCases = cases.filter(c => c.status === "pending" || c.status === "under_review").length;

  const TABS: Array<{ key: typeof activeTab; label: string }> = [
    { key: "cases", label: `Fraud Cases (${totalCases})` },
    { key: "rules", label: `Fraud Rules (${rules.length})` },
    { key: "analytics", label: "Risk Analytics" },
  ];

  return (
    <AdminShell title="Fraud Detection">
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Fraud Detection &amp; Risk Control Center
              </h1>
              <p className="text-xs text-gray-text mt-0.5">Real-time risk engine, rule enforcement &amp; case audit log</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-white shadow-[var(--shadow-admin-glow)]"
                    : "bg-section text-gray-text hover:text-foreground hover:bg-[var(--surface-hover)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={fetchCasesAndRules}
              className="p-2.5 rounded-xl bg-section hover:bg-[var(--surface-hover)] text-foreground border border-border"
              aria-label="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Flagged Cases" value={totalCases} icon={FileText} color="text-primary" bg="bg-primary/10" />
          <StatCard label="Pending Action" value={pendingCases} icon={Activity} color="text-amber-600" bg="bg-amber-500/10" />
          <StatCard label="Critical Risk (81-100)" value={criticalCases} icon={ShieldAlert} color="text-red-600" bg="bg-red-500/10" />
          <StatCard label="High Risk (61-80)" value={highCases} icon={Zap} color="text-orange-600" bg="bg-orange-500/10" />
        </div>

        {/* TAB 1: FRAUD CASES */}
        {activeTab === "cases" && (
          <div className="space-y-6">
            {/* Filter Toolbar */}
            <div className="p-4 rounded-2xl bg-white border border-border shadow-[var(--shadow-admin-soft)] flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-text font-bold mr-2">
                <Filter className="w-4 h-4 text-primary" /> Filters:
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-section border border-transparent rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
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
                className="bg-section border border-transparent rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
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
                className="bg-section border border-transparent rounded-lg px-3 py-1.5 text-xs text-foreground w-40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
              />

              <input
                type="text"
                placeholder="Partner UUID..."
                value={filterPartner}
                onChange={(e) => setFilterPartner(e.target.value)}
                className="bg-section border border-transparent rounded-lg px-3 py-1.5 text-xs text-foreground w-44 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
              />

              <input
                type="text"
                placeholder="Order UUID..."
                value={filterOrder}
                onChange={(e) => setFilterOrder(e.target.value)}
                className="bg-section border border-transparent rounded-lg px-3 py-1.5 text-xs text-foreground w-44 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
              />

              <button
                onClick={() => {
                  setFilterSeverity("");
                  setFilterStatus("");
                  setFilterReason("");
                  setFilterPartner("");
                  setFilterOrder("");
                }}
                className="text-xs text-gray-text hover:text-foreground font-bold underline ml-auto"
              >
                Clear Filters
              </button>
            </div>

            {/* Cases Table & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cases Table */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-section">
                      <tr>
                        <th className="py-3 px-4 text-xs font-bold text-[#9CA3AF] uppercase">Partner</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#9CA3AF] uppercase">Fraud Type</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#9CA3AF] uppercase">Score</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#9CA3AF] uppercase">Severity</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#9CA3AF] uppercase">Status</th>
                        <th className="py-3 px-4 text-xs font-bold text-[#9CA3AF] uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cases.map((c) => (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCase(c)}
                          className={`cursor-pointer transition-colors ${
                            selectedCase?.id === c.id ? "bg-primary/5" : "hover:bg-section/50"
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-foreground">{c.partner_name || "Partner"}</div>
                            <div className="text-[11px] text-gray-text">{c.partner_phone || c.partner_id?.slice(0, 8)}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">{c.fraud_type}</td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-600">+{c.risk_score}</td>
                          <td className="py-3 px-4">{getSeverityBadge(c.severity)}</td>
                          <td className="py-3 px-4">
                            <Badge tone={c.status === "resolved" ? "success" : (c.status === "blocked" || c.status === "suspended") ? "error" : "warning"}>
                              {c.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCase(c);
                              }}
                              className="p-1.5 rounded-lg bg-section hover:bg-[var(--surface-hover)] text-foreground"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cases.length === 0 && !loading && (
                    <EmptyState icon={ShieldAlert} title="No fraud cases" description="No cases match the current filters." />
                  )}
                </div>
              </div>

              {/* Selected Case Timeline & Action Panel */}
              <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-5">
                {selectedCase ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="font-black text-lg text-foreground">{selectedCase.fraud_type}</h3>
                        <p className="text-xs text-gray-text">Case ID: {selectedCase.id}</p>
                      </div>
                      {getSeverityBadge(selectedCase.severity)}
                    </div>

                    <div className="space-y-2 text-xs text-gray-text">
                      <div>
                        <span className="text-[#9CA3AF]">Partner:</span>{" "}
                        <span className="font-bold text-foreground">{selectedCase.partner_name || selectedCase.partner_id}</span>
                      </div>
                      {selectedCase.order_id && (
                        <div>
                          <span className="text-[#9CA3AF]">Order ID:</span>{" "}
                          <span className="font-mono text-foreground">{selectedCase.order_id}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#9CA3AF]">Reason:</span>{" "}
                        <span className="text-red-600 font-medium">{selectedCase.reason}</span>
                      </div>
                      <div>
                        <span className="text-[#9CA3AF]">Created:</span>{" "}
                        <span>{new Date(selectedCase.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Resolution Notes Input */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="text-xs text-foreground font-bold">Review &amp; Resolution Notes</label>
                      <textarea
                        rows={3}
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add review notes or justification..."
                        className="w-full bg-section border border-transparent rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                      />
                    </div>

                    {/* Review & Resolve Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleReviewCase(selectedCase.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Review Case
                      </button>
                      <button
                        onClick={() => handleResolveCase(selectedCase.id, "resolved")}
                        disabled={actionLoading}
                        className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        Resolve &amp; Restore
                      </button>
                    </div>

                    {/* Case Timeline / Audit Logs */}
                    <div className="pt-4 border-t border-border space-y-2">
                      <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Audit Log Timeline</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {selectedCase.logs && selectedCase.logs.length > 0 ? (
                          selectedCase.logs.map((log) => (
                            <div key={log.id} className="p-2 rounded-lg bg-section text-[11px] border border-border">
                              <div className="font-bold text-foreground">{log.event}</div>
                              <div className="text-gray-text">{new Date(log.created_at).toLocaleString()}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-gray-text italic">No audit logs available for this case.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={Eye}
                    title="No case selected"
                    description="Select a fraud case from the table to view details, audit timeline, and take resolution actions."
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FRAUD RULES CONFIGURATION */}
        {activeTab === "rules" && (
          <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-6 space-y-4">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              Automated Risk Detection Rules &amp; Thresholds
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rules.map((rule) => (
                <div key={rule.id} className="p-4 rounded-xl bg-section border border-border flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-bold text-foreground text-sm">{rule.rule_name}</div>
                    <div className="text-xs text-gray-text font-mono">Type: {rule.rule_type}</div>
                    <div className="text-xs text-amber-600 font-bold">Risk Impact: +{rule.threshold} pts</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={rule.threshold}
                      onChange={(e) => handleUpdateRule(rule.id, parseInt(e.target.value || "0", 10), rule.enabled)}
                      className="w-16 bg-white border border-border rounded-lg px-2 py-1 text-xs text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />

                    <button
                      onClick={() => handleUpdateRule(rule.id, rule.threshold, !rule.enabled)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        rule.enabled
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-white text-gray-text border border-border"
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
          <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-6 space-y-6">
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Risk Monitoring &amp; Severity Breakdown
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-section border border-border space-y-4">
                <h3 className="text-sm font-bold text-foreground">Severity Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-text mb-1">
                      <span>Critical (81-100)</span>
                      <span>{criticalCases} cases</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${totalCases ? (criticalCases / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-text mb-1">
                      <span>High (61-80)</span>
                      <span>{highCases} cases</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${totalCases ? (highCases / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-text mb-1">
                      <span>Medium (31-60)</span>
                      <span>{cases.filter(c => c.severity === "Medium").length} cases</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${totalCases ? (cases.filter(c => c.severity === "Medium").length / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-text mb-1">
                      <span>Low (0-30)</span>
                      <span>{cases.filter(c => c.severity === "Low").length} cases</span>
                    </div>
                    <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${totalCases ? (cases.filter(c => c.severity === "Low").length / totalCases) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-section border border-border space-y-4">
                <h3 className="text-sm font-bold text-foreground">Automated Actions Executed</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2.5 rounded-lg bg-white border border-border">
                    <span className="text-gray-text">Log Only (Low):</span>
                    <span className="font-bold text-emerald-600">{cases.filter(c => c.severity === "Low").length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-white border border-border">
                    <span className="text-gray-text">Warning Notifications Sent:</span>
                    <span className="font-bold text-amber-600">{cases.filter(c => c.severity === "Medium").length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-white border border-border">
                    <span className="text-gray-text">Temporary Blocks Enforced:</span>
                    <span className="font-bold text-orange-600">{cases.filter(c => c.severity === "High").length}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-white border border-border">
                    <span className="text-gray-text">Partner Suspensions Triggered:</span>
                    <span className="font-bold text-red-600">{criticalCases}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
