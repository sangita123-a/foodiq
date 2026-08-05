"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bot,
  Play,
  RotateCcw,
  Sliders,
  History,
  Activity,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Award,
  Zap,
  Info,
  RefreshCw,
  Search,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/dashboard/StatCard";
import { Badge } from "@/components/admin/ui";
import {
  runDispatch,
  fetchDispatchHistory,
  fetchDispatchLogs,
  fetchDispatchRules,
  updateDispatchRules,
  type DispatchRunResult,
  type DispatchHistoryItem,
  type DispatchLogItem,
  type DispatchRule,
  type RankedCandidate,
} from "@/services/dispatchApi";

const FACTOR_LABELS: Record<string, string> = {
  distance: "Distance to Restaurant",
  gps: "GPS Location Freshness",
  online_status: "Online Status",
  shift_status: "Shift Scheduling",
  kyc: "KYC Verification",
  fraud_score: "Fraud Risk Level",
  workload: "Current Workload Cap",
  vehicle: "Vehicle Type Match",
  avg_delivery_time: "Avg Delivery Speed",
  acceptance_rate: "Acceptance Rate",
  completion_rate: "Completion Rate",
  rating: "Partner Rating",
  geofence: "Geo-fence Coverage",
  traffic_delay: "Traffic Congestion",
  estimated_arrival: "Estimated Arrival (ETA)",
  idle_time: "Idle Time Balancing",
};

export default function AdminDispatchPage() {
  const [activeTab, setActiveTab] = useState<"live" | "scores" | "history" | "rules">("live");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [dispatchResult, setDispatchResult] = useState<DispatchRunResult | null>(null);
  const [history, setHistory] = useState<DispatchHistoryItem[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [logs, setLogs] = useState<DispatchLogItem[]>([]);
  const [rules, setRules] = useState<DispatchRule | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RankedCandidate | null>(null);

  const [manualOrderId, setManualOrderId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hData, rData] = await Promise.all([
        fetchDispatchHistory({ limit: 20 }),
        fetchDispatchRules(),
      ]);
      setHistory(hData.history || []);
      setHistoryTotal(hData.total || 0);
      setRules(rData);

      if (hData.history.length > 0) {
        const latestRunId = hData.history[0].dispatch_run_id;
        const lData = await fetchDispatchLogs({ dispatch_run_id: latestRunId });
        setLogs(lData.logs || []);
      }
    } catch (err: unknown) {
      console.error(err);
      setFeedback({ type: "error", message: "Failed to load initial dispatch engine data." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunDispatch = async (orderIdToRun?: string, forceReassign = false) => {
    setRunning(true);
    setFeedback(null);
    try {
      const result = await runDispatch({
        orderId: orderIdToRun || manualOrderId || undefined,
        forceReassign,
      });

      setDispatchResult(result);
      if (result.ranked_candidates && result.ranked_candidates.length > 0) {
        setSelectedCandidate(result.ranked_candidates[0]);
      }
      setFeedback({
        type: "success",
        message: result.summary || "AI Dispatch engine run executed successfully.",
      });

      // Reload history & logs
      const [hData, lData] = await Promise.all([
        fetchDispatchHistory({ limit: 20 }),
        fetchDispatchLogs({ dispatch_run_id: result.dispatch_run_id }),
      ]);
      setHistory(hData.history || []);
      setHistoryTotal(hData.total || 0);
      setLogs(lData.logs || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Dispatch execution failed";
      setFeedback({ type: "error", message: msg });
    } finally {
      setRunning(false);
    }
  };

  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules) return;
    setSavingRules(true);
    setFeedback(null);
    try {
      const updated = await updateDispatchRules(rules);
      setRules(updated);
      setFeedback({ type: "success", message: "AI Dispatch scoring rules & weights saved successfully!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update rules";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSavingRules(false);
    }
  };

  const updateWeight = (field: keyof DispatchRule, val: number) => {
    if (!rules) return;
    setRules({ ...rules, [field]: val });
  };

  // Calculate analytics KPIs
  const avgSpeedMs = history.length > 0
    ? Math.round(history.reduce((sum, item) => sum + (item.execution_time_ms || 0), 0) / history.length)
    : 42;
  const assignedCount = history.filter((item) => item.status === "assigned" || item.status === "reassigned").length;
  const successRate = history.length > 0 ? Math.round((assignedCount / history.length) * 100) : 100;

  const TABS: Array<{ key: typeof activeTab; label: string; icon: typeof Activity }> = [
    { key: "live", label: "Live Queue & Manual Run", icon: Activity },
    { key: "scores", label: "Partner AI Scores & Breakdown", icon: Award },
    { key: "history", label: "Dispatch Audit Timeline", icon: History },
    { key: "rules", label: "Scoring Rule Configuration", icon: Sliders },
  ];

  return (
    <AdminShell title="AI Dispatch">
      <div className="space-y-6">
        {/* Top Banner Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-border p-6 rounded-2xl shadow-[var(--shadow-admin-soft)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-violet-600 rounded-xl shadow-[var(--shadow-admin-glow)] shrink-0">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex flex-wrap items-center gap-3">
                AI Dispatch &amp; Smart Order Assignment Engine
                <Badge tone="success">Active Production</Badge>
              </h1>
              <p className="text-gray-text text-sm mt-1">
                Automated 16-factor weighted partner matching, live assignment queue, fallback re-dispatch &amp; rule tuning.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-section hover:bg-[var(--surface-hover)] text-foreground rounded-xl transition font-bold text-sm border border-border"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => handleRunDispatch()}
              disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-violet-600 hover:from-primary-hover hover:to-violet-700 text-white rounded-xl shadow-[var(--shadow-admin-glow)] transition font-bold text-sm disabled:opacity-50"
            >
              {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Auto-Run Dispatch
            </button>
          </div>
        </div>

        {/* Alert / Feedback message */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-sm font-medium ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-current opacity-60 hover:opacity-100 shrink-0">✕</button>
          </div>
        )}

        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Auto-Assign Success"
            value={successRate}
            icon={CheckCircle2}
            color="text-emerald-600"
            bg="bg-emerald-500/10"
            format={(n) => `${n}%`}
            hint="Order assignment completion rate"
          />
          <StatCard
            label="Avg AI Execution Speed"
            value={avgSpeedMs}
            icon={Zap}
            color="text-violet-600"
            bg="bg-violet-500/10"
            format={(n) => `${n} ms`}
            hint="16-factor scoring runtime per order"
          />
          <StatCard
            label="Total Dispatch Runs"
            value={historyTotal}
            icon={Activity}
            color="text-primary"
            bg="bg-primary/10"
            hint="Recorded audit history events"
          />
          <StatCard
            label="Scoring Factors"
            value={16}
            icon={Sliders}
            color="text-amber-600"
            bg="bg-amber-500/10"
            format={(n) => `${n} Factors`}
            hint="Configurable weighted criteria"
          />
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-[var(--shadow-admin-glow)]"
                  : "text-gray-text hover:text-foreground hover:bg-section"
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Live Dispatch Queue & Trigger */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border border-border p-6 rounded-2xl shadow-[var(--shadow-admin-soft)] space-y-4">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" /> Manual Order Dispatch Trigger
              </h2>
              <p className="text-xs text-gray-text">
                Select an order UUID to trigger immediate AI scoring and automated partner assignment.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">Order UUID (Optional)</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      placeholder="Leave empty to auto-pick ready order"
                      value={manualOrderId}
                      onChange={(e) => setManualOrderId(e.target.value)}
                      className="w-full bg-section border border-transparent rounded-xl pl-9 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleRunDispatch(undefined, false)}
                    disabled={running}
                    className="flex-1 flex justify-center items-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold text-sm transition shadow-[var(--shadow-button)] disabled:opacity-50"
                  >
                    {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Assign Best Partner
                  </button>
                  <button
                    onClick={() => handleRunDispatch(undefined, true)}
                    disabled={running}
                    className="flex justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-50"
                    title="Force re-dispatch fallback evaluation"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              </div>

              {/* Current Active Rules Overview */}
              {rules && (
                <div className="mt-6 pt-4 border-t border-border text-xs space-y-2">
                  <span className="font-bold text-foreground block uppercase tracking-wide">Applied Settings</span>
                  <div className="flex justify-between text-gray-text">
                    <span>Max Radius:</span>
                    <span className="text-foreground font-bold">{rules.max_search_radius_km} km</span>
                  </div>
                  <div className="flex justify-between text-gray-text">
                    <span>Max Workload / Driver:</span>
                    <span className="text-foreground font-bold">{rules.max_active_orders_per_partner} orders</span>
                  </div>
                  <div className="flex justify-between text-gray-text">
                    <span>Auto-Assign Mode:</span>
                    <span className={rules.auto_assign_enabled ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      {rules.auto_assign_enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 bg-white border border-border p-6 rounded-2xl shadow-[var(--shadow-admin-soft)] space-y-4">
              <h2 className="text-lg font-black text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Latest Dispatch Run Output
                </span>
                {dispatchResult && (
                  <span className="text-xs font-mono bg-section px-3 py-1 rounded-lg border border-border text-gray-text">
                    Run ID: {dispatchResult.dispatch_run_id.slice(0, 8)}...
                  </span>
                )}
              </h2>

              {dispatchResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-section border border-border rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-foreground">Result Status: {dispatchResult.status}</span>
                      <span className="text-xs text-gray-text">Execution time: {dispatchResult.execution_time_ms}ms</span>
                    </div>
                    <p className="text-xs text-gray-text bg-white p-3 rounded-lg border border-border">
                      {dispatchResult.summary}
                    </p>
                  </div>

                  {dispatchResult.assigned_partner && (
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                            <Award className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-black text-foreground text-base">
                              {dispatchResult.assigned_partner.full_name}
                            </h3>
                            <p className="text-xs text-gray-text">
                              Vehicle: {dispatchResult.assigned_partner.vehicle_type.toUpperCase()} • Rating: ⭐ {dispatchResult.assigned_partner.rating}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-emerald-600">
                            {dispatchResult.assigned_partner.score.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-text block">/ 100 Score</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-emerald-200">
                        <div>
                          <span className="text-gray-text block">Distance to Restaurant:</span>
                          <span className="font-bold text-foreground">{dispatchResult.assigned_partner.distance_km.toFixed(2)} km</span>
                        </div>
                        <div>
                          <span className="text-gray-text block">Estimated Arrival (ETA):</span>
                          <span className="font-bold text-foreground">{dispatchResult.assigned_partner.eta_minutes} mins</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-text space-y-2">
                  <Bot className="w-12 h-12 mx-auto stroke-1 text-[#D1D5DB]" />
                  <p className="text-sm font-bold text-foreground">No dispatch run executed in this session yet.</p>
                  <p className="text-xs">Click &quot;Auto-Run Dispatch&quot; above to trigger automated assignment.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Partner Scores & 16 Factor Breakdown */}
        {activeTab === "scores" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border border-border p-5 rounded-2xl shadow-[var(--shadow-admin-soft)] space-y-3">
              <h2 className="text-base font-black text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Candidate Partner List
              </h2>
              <p className="text-xs text-gray-text">
                Ranked delivery partners evaluated during dispatch.
              </p>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                {dispatchResult?.ranked_candidates && dispatchResult.ranked_candidates.length > 0 ? (
                  dispatchResult.ranked_candidates.map((candidate, idx) => (
                    <button
                      key={candidate.partner_id || idx}
                      onClick={() => setSelectedCandidate(candidate)}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                        selectedCandidate?.partner_id === candidate.partner_id
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-section border-border text-gray-text hover:bg-white hover:border-border-hover"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2 text-foreground">
                          #{idx + 1} {candidate.partner_name}
                          {candidate.is_eligible ? (
                            <Badge tone="success">Eligible</Badge>
                          ) : (
                            <Badge tone="error">Disqualified</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-text mt-0.5">
                          Vehicle: {candidate.vehicle_type} • ⭐ {candidate.rating}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-base text-primary">
                          {candidate.total_score.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-gray-text block">/ 100</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-gray-text">
                    Run a dispatch job to view candidate partner scores.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white border border-border p-6 rounded-2xl shadow-[var(--shadow-admin-soft)] space-y-6">
              {selectedCandidate ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border pb-4">
                    <div>
                      <h3 className="text-xl font-black text-foreground flex items-center gap-3">
                        {selectedCandidate.partner_name}
                        <span className="text-sm font-bold text-gray-text">
                          ({selectedCandidate.vehicle_type.toUpperCase()})
                        </span>
                      </h3>
                      <p className="text-xs text-gray-text mt-1">
                        AI Decision Rationale: {selectedCandidate.decision_reason}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-3xl font-black text-primary">
                        {selectedCandidate.total_score.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-text block">Total Weighted Score</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">
                      16 Scoring Factors Breakdown
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(selectedCandidate.scoring_breakdown.factor_scores).map(([factor, score]) => {
                        const weight = selectedCandidate.scoring_breakdown.weights[factor] || 0;
                        return (
                          <div key={factor} className="bg-section p-3 rounded-xl border border-border space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-foreground">{FACTOR_LABELS[factor] || factor}</span>
                              <span className="text-gray-text">
                                <span className="font-black text-foreground">{score}</span>/100 (Weight: {weight}%)
                              </span>
                            </div>
                            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-gray-text space-y-2">
                  <Info className="w-10 h-10 mx-auto stroke-1 text-[#D1D5DB]" />
                  <p className="text-sm">Select a partner candidate on the left to inspect full factor breakdown.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Dispatch Audit History Timeline */}
        {activeTab === "history" && (
          <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] overflow-hidden">
            <div className="p-6 pb-4">
              <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Historical Dispatch Execution Audit
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-section border-y border-border">
                  <tr>
                    <th className="py-3 px-4 font-bold text-[#9CA3AF] uppercase tracking-wide">Run ID</th>
                    <th className="py-3 px-4 font-bold text-[#9CA3AF] uppercase tracking-wide">Trigger</th>
                    <th className="py-3 px-4 font-bold text-[#9CA3AF] uppercase tracking-wide">Status</th>
                    <th className="py-3 px-4 font-bold text-[#9CA3AF] uppercase tracking-wide">Assigned Partner</th>
                    <th className="py-3 px-4 font-bold text-[#9CA3AF] uppercase tracking-wide">Evaluated</th>
                    <th className="py-3 px-4 font-bold text-[#9CA3AF] uppercase tracking-wide">Execution Time</th>
                    <th className="py-3 px-4 font-bold text-[#9CA3AF] uppercase tracking-wide">Date / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-section/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-primary">{item.dispatch_run_id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 capitalize font-bold text-foreground">{item.trigger_type}</td>
                      <td className="py-3 px-4">
                        <Badge
                          tone={item.status === "assigned" ? "success" : item.status === "reassigned" ? "warning" : "error"}
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">{item.partner_name || item.assigned_partner_id || "Unassigned"}</td>
                      <td className="py-3 px-4 text-gray-text">{item.candidates_evaluated} candidates</td>
                      <td className="py-3 px-4 font-mono text-gray-text">{item.execution_time_ms} ms</td>
                      <td className="py-3 px-4 text-gray-text">{new Date(item.created_at).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {history.length === 0 && (
                <p className="text-center py-12 text-gray-text text-sm">No dispatch runs recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Scoring Rules Configuration Form */}
        {activeTab === "rules" && rules && (
          <form onSubmit={handleSaveRules} className="bg-white border border-border p-6 rounded-2xl shadow-[var(--shadow-admin-soft)] space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-border pb-4">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" /> AI Weighted Scoring Factor Rules
                </h2>
                <p className="text-xs text-gray-text mt-0.5">
                  Adjust scoring factor weights (0 to 100%), search radius limits, and auto-dispatch rules.
                </p>
              </div>
              <button
                type="submit"
                disabled={savingRules}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold text-sm transition shadow-[var(--shadow-button)] disabled:opacity-50 shrink-0"
              >
                {savingRules ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Rules
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.keys(FACTOR_LABELS).map((factor) => {
                const fieldKey = `weight_${factor}` as keyof DispatchRule;
                const val = (rules[fieldKey] as number) ?? 5.0;
                return (
                  <div key={factor} className="bg-section p-4 rounded-xl border border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-foreground">{FACTOR_LABELS[factor]}</label>
                      <span className="text-xs font-black text-primary">{val}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="0.5"
                      value={val}
                      onChange={(e) => updateWeight(fieldKey, parseFloat(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">Max Search Radius (km)</label>
                <input
                  type="number"
                  step="0.5"
                  value={rules.max_search_radius_km}
                  onChange={(e) => setRules({ ...rules, max_search_radius_km: parseFloat(e.target.value) })}
                  className="w-full bg-section border border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1.5">Max Active Workload Cap</label>
                <input
                  type="number"
                  value={rules.max_active_orders_per_partner}
                  onChange={(e) => setRules({ ...rules, max_active_orders_per_partner: parseInt(e.target.value, 10) })}
                  className="w-full bg-section border border-transparent rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.auto_assign_enabled}
                    onChange={(e) => setRules({ ...rules, auto_assign_enabled: e.target.checked })}
                    className="w-5 h-5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-sm font-bold text-foreground">Enable Automatic Order Assignment</span>
                </label>
              </div>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}
