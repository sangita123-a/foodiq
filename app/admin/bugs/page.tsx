"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAccessToken } from "@/lib/accessToken";
import {
  adminPost,
  adminPut,
  fetchAdminBugs,
  fetchWeeklyBugReport,
  formatDate,
} from "@/services/adminApi";
import Badge, { type BadgeTone } from "@/components/admin/ui/Badge";
import Button from "@/components/admin/ui/Button";
import EmptyState from "@/components/admin/ui/EmptyState";
import { Bug, FileBarChart, RefreshCw } from "lucide-react";

const SEVERITY_TONE: Record<string, BadgeTone> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "error",
};

const STATUSES = ["open", "triaging", "in_progress", "resolved", "wont_fix"];
const SEVERITIES = ["low", "medium", "high", "critical"];

type FilterChip =
  | ""
  | "open"
  | "in_progress"
  | "fixed"
  | "critical"
  | "low_priority";

const FILTER_CHIPS: { id: FilterChip; label: string }[] = [
  { id: "", label: "All" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "fixed", label: "Fixed" },
  { id: "critical", label: "Critical" },
  { id: "low_priority", label: "Low Priority" },
];

export default function AdminBugsPage() {
  const [bugs, setBugs] = useState<Array<Record<string, unknown>>>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<FilterChip>("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorId, setErrorId] = useState("");
  const [weekly, setWeekly] = useState<Record<string, unknown> | null>(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const load = useCallback(async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      const data = await fetchAdminBugs({
        filter: filter || undefined,
        status: !filter && status ? status : undefined,
        severity: !filter && severity ? severity : undefined,
        limit: 100,
      });
      setBugs(data.rows || []);
      setTotal(data.total || 0);
      setCounts((data.counts as Record<string, number>) || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filter, status, severity]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveBug = async () => {
    if (!selected?.id) return;
    await adminPut(`/api/admin/bugs/${selected.id}`, {
      status: selected.status,
      severity: selected.severity,
      admin_notes: notes,
    });
    setSelected(null);
    await load();
  };

  const createFromError = async () => {
    if (!errorId.trim()) return;
    await adminPost("/api/admin/bugs/from-error", {
      error_event_id: errorId.trim(),
    });
    setErrorId("");
    await load();
  };

  const loadWeekly = async (persist = false) => {
    setWeeklyLoading(true);
    try {
      setWeekly(await fetchWeeklyBugReport(persist));
    } catch (e) {
      console.error(e);
    } finally {
      setWeeklyLoading(false);
    }
  };

  const countFor = (id: FilterChip) => {
    if (id === "open") return counts.open;
    if (id === "in_progress") return counts.in_progress;
    if (id === "fixed") return counts.fixed;
    if (id === "critical") return counts.critical;
    if (id === "low_priority") return counts.low_priority;
    return counts.total;
  };

  return (
    <AdminShell title="Bug Management">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Bug className="w-6 h-6 text-primary" /> Bug Management
            </h1>
            <p className="text-gray-text mt-1">
              Track production crashes and user-reported bugs. Update status as
              you resolve issues.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<FileBarChart className="w-4 h-4" />} onClick={() => void loadWeekly(false)}>
              Weekly report
            </Button>
            <Button variant="secondary" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => void load()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const active = filter === chip.id;
            const n = countFor(chip.id);
            return (
              <button
                key={chip.id || "all"}
                type="button"
                onClick={() => {
                  setFilter(chip.id);
                  setStatus("");
                  setSeverity("");
                }}
                className={[
                  "px-3 py-1.5 rounded-xl text-sm font-bold border transition-colors duration-150",
                  active
                    ? "bg-primary text-white border-primary shadow-[var(--shadow-button)]"
                    : "bg-white text-gray-text border-border hover:border-primary hover:text-foreground",
                ].join(" ")}
              >
                {chip.label}
                {typeof n === "number" ? (
                  <span className="ml-1.5 opacity-80">{n}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className="block text-xs font-bold text-gray-text mb-1">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setFilter("");
              }}
              className="border border-border rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "resolved" ? "fixed (resolved)" : s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs font-bold text-gray-text mb-1">Severity</span>
            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setFilter("");
              }}
              className="border border-border rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">All</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 items-end flex-wrap">
            <input
              value={errorId}
              onChange={(e) => setErrorId(e.target.value)}
              placeholder="Error event UUID"
              className="border border-border rounded-xl px-3 py-2 text-sm bg-white min-w-[220px]"
            />
            <Button variant="primary" size="md" onClick={() => void createFromError()}>
              Create from error
            </Button>
          </div>
        </div>

        {weekly && (
          <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-black text-foreground tracking-tight">
                Weekly bug report ({String(weekly.period_start)} →{" "}
                {String(weekly.period_end)})
              </h2>
              <button
                type="button"
                disabled={weeklyLoading}
                onClick={() => void loadWeekly(true)}
                className="text-xs font-bold text-primary disabled:opacity-50"
              >
                {weeklyLoading ? "Saving…" : "Persist report"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {Object.entries(
                (weekly.summary as Record<string, number>) || {}
              ).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-section p-3">
                  <p className="text-[11px] font-bold text-gray-text uppercase tracking-widest">{k}</p>
                  <p className="font-black text-foreground mt-1">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] overflow-hidden">
            {loading ? (
              <p className="p-6 text-sm text-gray-text">Loading…</p>
            ) : bugs.length === 0 ? (
              <EmptyState icon={Bug} title="No bugs found" description="Nothing matches the current filters." />
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                <p className="px-5 py-3 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-widest">
                  {total} bug{total === 1 ? "" : "s"}
                </p>
                {bugs.map((b) => (
                  <button
                    key={String(b.id)}
                    type="button"
                    onClick={() => {
                      setSelected(b);
                      setNotes(String(b.admin_notes || ""));
                    }}
                    className="w-full text-left p-5 hover:bg-section/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-foreground">{String(b.title)}</p>
                      <Badge tone={SEVERITY_TONE[String(b.severity)] ?? "neutral"}>{String(b.severity)}</Badge>
                    </div>
                    <p className="text-sm text-gray-text mt-1 line-clamp-2">
                      {String(b.description)}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge status={String(b.status === "resolved" ? "resolved" : b.status)}>
                        {String(b.status === "resolved" ? "fixed" : b.status)}
                      </Badge>
                      <p className="text-xs text-[#9CA3AF]">
                        {Number(b.occurrence_count) > 1
                          ? `×${b.occurrence_count} · `
                          : ""}
                        {b.browser ? `${String(b.browser)}` : ""}
                        {b.device ? `/${String(b.device)}` : ""}
                        {b.browser || b.device ? " · " : ""}
                        {formatDate(String(b.created_at || ""))}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-5 sm:p-6">
            {!selected ? (
              <EmptyState icon={Bug} title="No bug selected" description="Select a bug from the list to manage it." />
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-foreground tracking-tight">{String(selected.title)}</h2>
                <p className="text-sm text-gray-text whitespace-pre-wrap">
                  {String(selected.description)}
                </p>
                {Boolean(
                  selected.api_endpoint ||
                    selected.stack_trace ||
                    selected.browser
                ) && (
                  <div className="rounded-xl bg-section p-3 text-xs text-gray-text space-y-1 break-all">
                    {selected.api_endpoint ? (
                      <p>
                        <span className="font-bold">Endpoint:</span>{" "}
                        {String(selected.api_endpoint)}
                      </p>
                    ) : null}
                    {selected.browser || selected.device ? (
                      <p>
                        <span className="font-bold">Client:</span>{" "}
                        {[selected.browser, selected.device]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    ) : null}
                    {selected.reporter_id ? (
                      <p>
                        <span className="font-bold">User:</span>{" "}
                        {String(selected.reporter_name || selected.reporter_id)}
                      </p>
                    ) : null}
                    {selected.stack_trace ? (
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px]">
                        {String(selected.stack_trace)}
                      </pre>
                    ) : null}
                  </div>
                )}
                <label className="block text-sm">
                  <span className="text-xs font-bold text-gray-text">Status</span>
                  <select
                    value={String(selected.status || "open")}
                    onChange={(e) =>
                      setSelected({ ...selected, status: e.target.value })
                    }
                    className="mt-1 w-full border border-border rounded-xl px-3 py-2"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s === "resolved" ? "fixed (resolved)" : s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-bold text-gray-text">Severity</span>
                  <select
                    value={String(selected.severity || "medium")}
                    onChange={(e) =>
                      setSelected({ ...selected, severity: e.target.value })
                    }
                    className="mt-1 w-full border border-border rounded-xl px-3 py-2"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-bold text-gray-text">Admin notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="mt-1 w-full border border-border rounded-xl px-3 py-2 resize-none"
                  />
                </label>
                <Button variant="primary" className="w-full justify-center" onClick={() => void saveBug()}>
                  Save changes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
