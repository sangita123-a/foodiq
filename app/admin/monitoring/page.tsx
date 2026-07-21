"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAccessToken } from "@/lib/accessToken";
import {
  fetchMonitoringDashboard,
  fetchAudits,
  fetchErrors,
  fetchLogFiles,
  fetchLogContent,
  fetchBackups,
  ackAlert,
  auditsExportUrl,
} from "@/services/monitoringApi";
import {
  Activity,
  Database,
  Server,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
} from "lucide-react";

type Tab = "overview" | "audits" | "errors" | "logs" | "backups";

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function AdminMonitoringPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [logFiles, setLogFiles] = useState<any[]>([]);
  const [logRows, setLogRows] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState("");
  const [backups, setBackups] = useState<any>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchMonitoringDashboard());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    const t = setInterval(loadOverview, 30000);
    return () => clearInterval(t);
  }, [loadOverview]);

  useEffect(() => {
    if (tab === "audits") fetchAudits({ q, limit: 80 }).then(setAudits).catch(() => setAudits([]));
    if (tab === "errors") fetchErrors({ q, limit: 80 }).then(setErrors).catch(() => setErrors([]));
    if (tab === "logs") {
      fetchLogFiles().then((files) => {
        setLogFiles(files);
        if (files[0] && !selectedLog) setSelectedLog(files[0].name);
      });
    }
    if (tab === "backups") fetchBackups().then(setBackups).catch(() => setBackups(null));
  }, [tab, q, selectedLog]);

  useEffect(() => {
    if (tab === "logs" && selectedLog) {
      fetchLogContent(selectedLog, { lines: 150, q }).then(setLogRows).catch(() => setLogRows([]));
    }
  }, [tab, selectedLog, q]);

  const svc = data?.services || {};
  const biz = data?.business || {};
  const http = data?.http || {};
  const proc = data?.process || {};

  return (
    <AdminShell title="Monitoring">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> Monitoring & Security
            </h1>
            <p className="text-sm text-gray-text mt-1">
              Server health, audits, errors, logs, and backups
            </p>
          </div>
          <button
            type="button"
            onClick={loadOverview}
            className="px-4 py-2 rounded-xl border border-border font-bold text-sm inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              ["overview", "Overview"],
              ["audits", "Audit Logs"],
              ["errors", "Errors"],
              ["logs", "Logs"],
              ["backups", "Backups"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold ${
                tab === id ? "bg-primary text-white" : "bg-white border border-border text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <>
            {loading && !data ? (
              <div className="h-40 animate-pulse bg-section rounded-2xl" />
            ) : !data ? (
              <p className="text-red-600 text-sm">Unable to load monitoring data. Sign in as admin.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Active Orders", value: biz.active_orders ?? "—", icon: Activity },
                    { label: "Online Restaurants", value: biz.online_restaurants ?? "—", icon: Server },
                    { label: "Online Riders", value: biz.online_delivery_partners ?? "—", icon: Wifi },
                    {
                      label: "Live Revenue Today",
                      value: `₹${Number(biz.live_revenue_today || 0).toFixed(0)}`,
                      icon: CheckCircle2,
                    },
                  ].map((c) => (
                    <div key={c.label} className="bg-white border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-gray-text text-xs font-bold uppercase mb-2">
                        <c.icon className="w-4 h-4 text-primary" /> {c.label}
                      </div>
                      <div className="text-2xl font-black text-foreground">{c.value}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Server className="w-4 h-4 text-primary" /> Server Health
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill ok={data.status === "healthy"} label={data.status} />
                      <StatusPill ok={svc.database?.status === "up"} label={`DB ${svc.database?.status}`} />
                      <StatusPill
                        ok={svc.socket?.status === "up" || svc.socket?.status === "starting"}
                        label={`Socket ${svc.socket?.status} (${svc.socket?.connections || 0})`}
                      />
                      <StatusPill
                        ok={svc.payment?.status !== "down"}
                        label={`Payments ${svc.payment?.status}`}
                      />
                      <StatusPill ok label={`Email ${svc.email?.provider}`} />
                      <StatusPill ok label={`SMS ${svc.sms?.provider}`} />
                      <StatusPill ok label={`Storage ${svc.storage?.provider || "—"}`} />
                    </div>
                    <div className="text-sm text-gray-text grid grid-cols-2 gap-2 pt-2">
                      <div>Uptime: {proc.uptime_sec}s</div>
                      <div>CPU load 1m: {proc.cpu?.load_1m}</div>
                      <div>Heap: {proc.memory?.heap_used_mb} MB</div>
                      <div>System mem: {proc.memory?.system_used_pct}%</div>
                      <div>Avg latency: {http.avg_response_ms} ms</div>
                      <div>Error rate: {http.error_rate}%</div>
                      <div>Requests: {http.requests}</div>
                      <div>Errors: {http.errors}</div>
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-2xl p-5">
                    <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-primary" /> Alerts
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(data.alerts || []).length === 0 && (
                        <p className="text-sm text-gray-text">No alerts</p>
                      )}
                      {(data.alerts || []).map((a: any) => (
                        <div
                          key={a.id}
                          className="flex items-start justify-between gap-2 p-3 rounded-xl bg-section border border-border"
                        >
                          <div>
                            <p className="text-sm font-bold text-foreground">{a.title}</p>
                            <p className="text-xs text-gray-text">{a.message}</p>
                            <p className="text-[10px] text-[#9CA3AF] mt-1">
                              {a.severity} · {a.status} · {new Date(a.created_at).toLocaleString()}
                            </p>
                          </div>
                          {a.status === "open" && (
                            <button
                              type="button"
                              className="text-xs font-bold text-primary"
                              onClick={async () => {
                                await ackAlert(a.id);
                                loadOverview();
                              }}
                            >
                              Ack
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white border border-border rounded-2xl p-5">
                    <h3 className="font-bold mb-3">Recent Errors</h3>
                    <ul className="space-y-2 text-sm max-h-56 overflow-y-auto">
                      {(data.recent_errors || []).map((e: any) => (
                        <li key={e.id} className="border-b border-[#F3F4F6] pb-2">
                          <span className="font-bold text-foreground">{e.source}</span> — {e.message}
                          <div className="text-[10px] text-[#9CA3AF]">
                            {e.path} · {new Date(e.created_at).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border border-border rounded-2xl p-5">
                    <h3 className="font-bold mb-3">Recent Audits</h3>
                    <ul className="space-y-2 text-sm max-h-56 overflow-y-auto">
                      {(data.recent_audits || []).map((a: any) => (
                        <li key={a.id} className="border-b border-[#F3F4F6] pb-2">
                          <span className="font-bold">{a.action}</span> · {a.user_email || a.role || "system"}
                          <div className="text-[10px] text-[#9CA3AF]">
                            {a.ip_address} · {a.browser}/{a.device} ·{" "}
                            {new Date(a.created_at).toLocaleString()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {tab !== "overview" && (
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="flex-1 px-4 py-2 rounded-xl border border-border text-sm"
            />
            {tab === "audits" && (
              <a
                href={auditsExportUrl(q)}
                className="px-4 py-2 rounded-xl bg-[#111827] text-white text-sm font-bold inline-flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  const token = getAccessToken();
                  window.open(
                    `${auditsExportUrl(q)}${token ? "" : ""}`,
                    "_blank"
                  );
                  // Use fetch blob with auth instead
                  fetch(auditsExportUrl(q), {
                    credentials: "include",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  })
                    .then((r) => r.blob())
                    .then((blob) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "foodiq-audit-export.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    });
                }}
              >
                <Download className="w-4 h-4" /> Export CSV
              </a>
            )}
          </div>
        )}

        {tab === "audits" && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-section text-left text-xs uppercase text-gray-text">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">IP / Device</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((a) => (
                  <tr key={a.id as string} className="border-t border-border">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(String(a.created_at)).toLocaleString()}
                    </td>
                    <td className="p-3">{String(a.user_email || a.role || "—")}</td>
                    <td className="p-3 font-bold">{String(a.action)}</td>
                    <td className="p-3 text-gray-text">
                      {String(a.ip_address || "—")} · {String(a.browser || "")}/{String(a.device || "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "errors" && (
          <div className="space-y-2">
            {errors.map((e) => (
              <div key={e.id as string} className="bg-white border border-border rounded-xl p-4">
                <div className="flex justify-between gap-2">
                  <p className="font-bold text-foreground text-sm">
                    [{String(e.source)}] {String(e.message)}
                  </p>
                  <span className="text-[10px] text-[#9CA3AF]">
                    {new Date(String(e.created_at)).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-text mt-1">
                  {String(e.method || "")} {String(e.path || "")}
                </p>
                {e.stack ? (
                  <pre className="mt-2 text-[10px] bg-section p-2 rounded-lg overflow-x-auto max-h-32">
                    {String(e.stack).slice(0, 1200)}
                  </pre>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {tab === "logs" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-border rounded-2xl p-3 space-y-1">
              {logFiles.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setSelectedLog(f.name)}
                  className={`w-full text-left text-xs px-3 py-2 rounded-lg ${
                    selectedLog === f.name ? "bg-primary/10 font-bold" : "hover:bg-section"
                  }`}
                >
                  {f.name}
                  <div className="text-[10px] text-[#9CA3AF]">
                    {(f.size / 1024).toFixed(1)} KB
                  </div>
                </button>
              ))}
            </div>
            <div className="lg:col-span-3 bg-[#0B1220] text-[#E5E7EB] rounded-2xl p-4 font-mono text-[11px] max-h-[28rem] overflow-auto">
              {logRows.map((row, i) => (
                <div key={i} className="border-b border-white/5 py-1">
                  {typeof row === "object" ? JSON.stringify(row) : String(row)}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "backups" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(backups?.health || []).map((h: any) => (
                <div key={h.type} className="bg-white border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="font-bold capitalize">{h.type}</span>
                  </div>
                  <StatusPill ok={!h.stale} label={h.stale ? "Stale / failed" : "Healthy"} />
                  <p className="text-xs text-gray-text mt-2">
                    Last: {h.last_run ? new Date(h.last_run).toLocaleString() : "never"} ({h.last_status})
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-section text-xs uppercase text-gray-text text-left">
                  <tr>
                    <th className="p-3">When</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(backups?.runs || []).map((r: any) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="p-3">{r.type}</td>
                      <td className="p-3">{r.status}</td>
                      <td className="p-3 truncate max-w-xs">{r.location || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
