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
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Zap,
  Info,
  RefreshCw,
  Search,
} from "lucide-react";
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 backdrop-blur border border-slate-700/60 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Bot className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              AI Dispatch & Smart Order Assignment Engine
              <span className="px-3 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                Active Production
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Automated 16-factor weighted partner matching, live assignment queue, fallback re-dispatch & rule tuning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition font-medium text-sm border border-slate-600/50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => handleRunDispatch()}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition font-semibold text-sm disabled:opacity-50"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
            Auto-Run Dispatch
          </button>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            feedback.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/60 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Auto-Assign Success</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{successRate}%</div>
          <p className="text-slate-400 text-xs mt-1">Order assignment completion rate</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg AI Execution Speed</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{avgSpeedMs} ms</div>
          <p className="text-slate-400 text-xs mt-1">16-factor scoring runtime per order</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Dispatch Runs</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">{historyTotal}</div>
          <p className="text-slate-400 text-xs mt-1">Recorded audit history events</p>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Scoring Factors</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">16 Factors</div>
          <p className="text-slate-400 text-xs mt-1">Configurable weighted criteria</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === "live"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" /> Live Queue & Manual Run
        </button>
        <button
          onClick={() => setActiveTab("scores")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === "scores"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Award className="w-4 h-4" /> Partner AI Scores & Breakdown
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <History className="w-4 h-4" /> Dispatch Audit Timeline
        </button>
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
            activeTab === "rules"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" /> Scoring Rule Configuration
        </button>
      </div>

      {/* Tab 1: Live Dispatch Queue & Trigger */}
      {activeTab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-indigo-400" /> Manual Order Dispatch Trigger
            </h2>
            <p className="text-xs text-slate-400">
              Select an order UUID to trigger immediate AI scoring and automated partner assignment.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Order UUID (Optional)</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Leave empty to auto-pick ready order"
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleRunDispatch(undefined, false)}
                  disabled={running}
                  className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Assign Best Partner
                </button>
                <button
                  onClick={() => handleRunDispatch(undefined, true)}
                  disabled={running}
                  className="flex justify-center items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
                  title="Force re-dispatch fallback evaluation"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            </div>

            {/* Current Active Rules Overview */}
            {rules && (
              <div className="mt-6 pt-4 border-t border-slate-700/60 text-xs space-y-2">
                <span className="font-semibold text-slate-300 block uppercase">Applied Settings</span>
                <div className="flex justify-between text-slate-400">
                  <span>Max Radius:</span>
                  <span className="text-white font-medium">{rules.max_search_radius_km} km</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Workload / Driver:</span>
                  <span className="text-white font-medium">{rules.max_active_orders_per_partner} orders</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Auto-Assign Mode:</span>
                  <span className={rules.auto_assign_enabled ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
                    {rules.auto_assign_enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Latest Dispatch Run Output
              </span>
              {dispatchResult && (
                <span className="text-xs font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-700 text-slate-400">
                  Run ID: {dispatchResult.dispatch_run_id.slice(0, 8)}...
                </span>
              )}
            </h2>

            {dispatchResult ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/80 border border-slate-700/80 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Result Status: {dispatchResult.status}</span>
                    <span className="text-xs text-slate-400">Execution time: {dispatchResult.execution_time_ms}ms</span>
                  </div>
                  <p className="text-xs text-slate-300 bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                    {dispatchResult.summary}
                  </p>
                </div>

                {dispatchResult.assigned_partner && (
                  <div className="p-4 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">
                            {dispatchResult.assigned_partner.full_name}
                          </h3>
                          <p className="text-xs text-slate-400">
                            Vehicle: {dispatchResult.assigned_partner.vehicle_type.toUpperCase()} • Rating: ⭐ {dispatchResult.assigned_partner.rating}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-emerald-400">
                          {dispatchResult.assigned_partner.score.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400 block">/ 100 Score</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400 block">Distance to Restaurant:</span>
                        <span className="font-semibold text-white">{dispatchResult.assigned_partner.distance_km.toFixed(2)} km</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Estimated Arrival (ETA):</span>
                        <span className="font-semibold text-white">{dispatchResult.assigned_partner.eta_minutes} mins</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Bot className="w-12 h-12 mx-auto stroke-1 text-slate-600" />
                <p className="text-sm">No dispatch run executed in this session yet.</p>
                <p className="text-xs">Click "Auto-Run Dispatch" above to trigger automated assignment.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Partner Scores & 16 Factor Breakdown */}
      {activeTab === "scores" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" /> Candidate Partner List
            </h2>
            <p className="text-xs text-slate-400">
              Ranked delivery partners evaluated during dispatch.
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {dispatchResult?.ranked_candidates && dispatchResult.ranked_candidates.length > 0 ? (
                dispatchResult.ranked_candidates.map((candidate, idx) => (
                  <button
                    key={candidate.partner_id || idx}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      selectedCandidate?.partner_id === candidate.partner_id
                        ? "bg-indigo-900/40 border-indigo-500 text-white"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm flex items-center gap-2">
                        #{idx + 1} {candidate.partner_name}
                        {candidate.is_eligible ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Eligible
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full border border-rose-500/30">
                            Disqualified
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Vehicle: {candidate.vehicle_type} • ⭐ {candidate.rating}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-base text-indigo-400">
                        {candidate.total_score.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">/ 100</span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Run a dispatch job to view candidate partner scores.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-6">
            {selectedCandidate ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-700/60 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      {selectedCandidate.partner_name}
                      <span className="text-sm font-semibold text-slate-400">
                        ({selectedCandidate.vehicle_type.toUpperCase()})
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      AI Decision Rationale: {selectedCandidate.decision_reason}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-indigo-400">
                      {selectedCandidate.total_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 block">Total Weighted Score</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    16 Scoring Factors Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(selectedCandidate.scoring_breakdown.factor_scores).map(([factor, score]) => {
                      const weight = selectedCandidate.scoring_breakdown.weights[factor] || 0;
                      return (
                        <div key={factor} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-200">{FACTOR_LABELS[factor] || factor}</span>
                            <span className="text-slate-400">
                              <span className="font-bold text-white">{score}</span>/100 (Weight: {weight}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500"
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
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Info className="w-10 h-10 mx-auto stroke-1 text-slate-600" />
                <p className="text-sm">Select a partner candidate on the left to inspect full factor breakdown.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Dispatch Audit History Timeline */}
      {activeTab === "history" && (
        <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Historical Dispatch Execution Audit
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Run ID</th>
                  <th className="py-3 px-4">Trigger</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Partner</th>
                  <th className="py-3 px-4">Evaluated</th>
                  <th className="py-3 px-4">Execution Time</th>
                  <th className="py-3 px-4 rounded-r-lg">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-indigo-400">{item.dispatch_run_id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 capitalize font-medium">{item.trigger_type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          item.status === "assigned"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            : item.status === "reassigned"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{item.partner_name || item.assigned_partner_id || "Unassigned"}</td>
                    <td className="py-3 px-4">{item.candidates_evaluated} candidates</td>
                    <td className="py-3 px-4 font-mono">{item.execution_time_ms} ms</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(item.created_at).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Scoring Rules Configuration Form */}
      {activeTab === "rules" && rules && (
        <form onSubmit={handleSaveRules} className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" /> AI Weighted Scoring Factor Rules
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust scoring factor weights (0 to 100%), search radius limits, and auto-dispatch rules.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingRules}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
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
                <div key={factor} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-200">{FACTOR_LABELS[factor]}</label>
                    <span className="text-xs font-bold text-indigo-400">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={val}
                    onChange={(e) => updateWeight(fieldKey, parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-700/60 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Max Search Radius (km)</label>
              <input
                type="number"
                step="0.5"
                value={rules.max_search_radius_km}
                onChange={(e) => setRules({ ...rules, max_search_radius_km: parseFloat(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Max Active Workload Cap</label>
              <input
                type="number"
                value={rules.max_active_orders_per_partner}
                onChange={(e) => setRules({ ...rules, max_active_orders_per_partner: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.auto_assign_enabled}
                  onChange={(e) => setRules({ ...rules, auto_assign_enabled: e.target.checked })}
                  className="w-5 h-5 rounded accent-indigo-600 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-200">Enable Automatic Order Assignment</span>
              </label>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
