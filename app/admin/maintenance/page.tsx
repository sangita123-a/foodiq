"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAccessToken } from "@/lib/accessToken";
import {
  fetchMaintenanceHealth,
  fetchMaintenanceReport,
  fetchReviewAnalytics,
  fetchV2Adoption,
  listMaintenanceReports,
  sendWeeklyMaintenanceReport,
  formatDate,
} from "@/services/adminApi";
import { Activity, RefreshCw, FileText, Mail } from "lucide-react";

export default function AdminMaintenancePage() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [adoption, setAdoption] = useState<Record<string, unknown> | null>(null);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      const [h, a, hist, adopt] = await Promise.all([
        fetchMaintenanceHealth(),
        fetchReviewAnalytics(30),
        listMaintenanceReports(),
        fetchV2Adoption(30),
      ]);
      setHealth(h as unknown as Record<string, unknown>);
      setAnalytics(a);
      setHistory(hist);
      setAdoption(adopt);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const generate = async (period: "weekly" | "monthly") => {
    setBusy(true);
    try {
      const r = await fetchMaintenanceReport(period);
      setReport(r);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const sendWeekly = async () => {
    setBusy(true);
    try {
      await sendWeeklyMaintenanceReport();
      await load();
    } finally {
      setBusy(false);
    }
  };

  const restaurant = (analytics?.restaurant || {}) as Record<string, number>;
  const delivery = (analytics?.delivery || {}) as Record<string, number>;

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> Maintenance
            </h1>
            <p className="text-sm text-gray-text mt-1">
              Health snapshot, review analytics, and weekly/monthly maintenance reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-bold text-gray-text"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-text">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Database", value: String(health?.database || "—") },
                { label: "Errors (7d)", value: String(health?.errors_7d ?? 0) },
                { label: "Open bugs", value: String(health?.open_bugs ?? 0) },
                { label: "Reviews (7d)", value: String(health?.reviews_7d ?? 0) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-3xl border border-border p-5"
                >
                  <p className="text-xs font-bold text-gray-text uppercase tracking-wider">
                    {s.label}
                  </p>
                  <p className="text-2xl font-black text-foreground mt-2">{s.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl border border-border p-6">
                <h2 className="font-black text-foreground mb-4">Restaurant reviews (30d)</h2>
                <p className="text-sm text-gray-text">
                  Total: <span className="font-bold text-foreground">{restaurant.total ?? 0}</span>
                </p>
                <p className="text-sm text-gray-text">
                  Avg: <span className="font-bold text-foreground">{restaurant.avg_rating ?? 0}</span>
                </p>
                <p className="text-sm text-gray-text">
                  Positive / Neutral / Negative:{" "}
                  <span className="font-bold text-foreground">
                    {restaurant.positive ?? 0} / {restaurant.neutral ?? 0} /{" "}
                    {restaurant.negative ?? 0}
                  </span>
                </p>
              </div>
              <div className="bg-white rounded-3xl border border-border p-6">
                <h2 className="font-black text-foreground mb-4">Delivery reviews (30d)</h2>
                <p className="text-sm text-gray-text">
                  Total: <span className="font-bold text-foreground">{delivery.total ?? 0}</span>
                </p>
                <p className="text-sm text-gray-text">
                  Avg: <span className="font-bold text-foreground">{delivery.avg_rating ?? 0}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void generate("weekly")}
                className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2.5 rounded-xl disabled:opacity-60"
              >
                <FileText className="w-4 h-4" /> Generate weekly
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void generate("monthly")}
                className="inline-flex items-center gap-2 bg-white border border-border text-foreground font-bold px-4 py-2.5 rounded-xl disabled:opacity-60"
              >
                <FileText className="w-4 h-4" /> Generate monthly
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void sendWeekly()}
                className="inline-flex items-center gap-2 bg-white border border-border text-foreground font-bold px-4 py-2.5 rounded-xl disabled:opacity-60"
              >
                <Mail className="w-4 h-4" /> Email weekly report
              </button>
            </div>

            {report && (
              <div className="bg-white rounded-3xl border border-border p-6">
                <h2 className="font-black text-foreground mb-3">Latest generated report</h2>
                <pre className="text-xs bg-section rounded-2xl p-4 overflow-x-auto text-foreground">
                  {JSON.stringify(report.payload || report, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-border p-6">
              <h2 className="font-black text-foreground mb-4">V2.0 adoption (30d)</h2>
              {adoption ? (
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-text">
                  <p>
                    Order feedback:{" "}
                    <span className="font-bold text-foreground">
                      {String((adoption.metrics as Record<string, unknown>)?.order_feedback ?? 0)}
                    </span>
                  </p>
                  <p>
                    Delivery reviews:{" "}
                    <span className="font-bold text-foreground">
                      {String((adoption.metrics as Record<string, unknown>)?.delivery_reviews ?? 0)}
                    </span>
                  </p>
                  <p>
                    Product feedback:{" "}
                    <span className="font-bold text-foreground">
                      {String((adoption.metrics as Record<string, unknown>)?.product_feedback ?? 0)}
                    </span>
                  </p>
                  <p>
                    Bug reports:{" "}
                    <span className="font-bold text-foreground">
                      {String((adoption.metrics as Record<string, unknown>)?.bug_reports ?? 0)}
                    </span>
                  </p>
                  <p className="col-span-2">
                    Feedback rate:{" "}
                    <span className="font-bold text-foreground">
                      {String(adoption.feedback_rate_pct ?? 0)}% of delivered orders
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-text">No adoption data yet.</p>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-border p-6">
              <h2 className="font-black text-foreground mb-4">Report history</h2>
              {history.length === 0 ? (
                <p className="text-sm text-gray-text">No reports stored yet.</p>
              ) : (
                <ul className="space-y-3">
                  {history.map((h) => (
                    <li
                      key={String(h.id)}
                      className="flex items-center justify-between text-sm border-b border-border pb-3"
                    >
                      <span className="font-bold text-foreground">
                        {String(h.period)} · {String(h.period_start)} → {String(h.period_end)}
                      </span>
                      <span className="text-gray-text">{formatDate(String(h.created_at || ""))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
