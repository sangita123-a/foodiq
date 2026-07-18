"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAccessToken } from "@/lib/accessToken";
import { adminPost, adminPut, fetchAdminBugs, formatDate } from "@/services/adminApi";
import { Bug, RefreshCw } from "lucide-react";

const STATUSES = ["open", "triaging", "in_progress", "resolved", "wont_fix"];
const SEVERITIES = ["low", "medium", "high", "critical"];

export default function AdminBugsPage() {
  const [bugs, setBugs] = useState<Array<Record<string, unknown>>>([]);
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorId, setErrorId] = useState("");

  const load = useCallback(async () => {
    if (!getAccessToken()) return;
    setLoading(true);
    try {
      setBugs(
        await fetchAdminBugs({
          status: status || undefined,
          severity: severity || undefined,
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [status, severity]);

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

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-[#111827] flex items-center gap-2">
              <Bug className="w-6 h-6 text-[#FC8019]" /> Bug management
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Track user-reported bugs and link production error events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#6B7280]"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className="block text-xs font-bold text-[#6B7280] mb-1">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs font-bold text-[#6B7280] mb-1">Severity</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm bg-white"
            >
              <option value="">All</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 items-end">
            <input
              value={errorId}
              onChange={(e) => setErrorId(e.target.value)}
              placeholder="Error event UUID"
              className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm bg-white min-w-[220px]"
            />
            <button
              type="button"
              onClick={() => void createFromError()}
              className="bg-[#FC8019] text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              Create from error
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
            {loading ? (
              <p className="p-6 text-sm text-[#6B7280]">Loading…</p>
            ) : bugs.length === 0 ? (
              <p className="p-6 text-sm text-[#6B7280]">No bugs found.</p>
            ) : (
              <div className="divide-y divide-[#E5E7EB]">
                {bugs.map((b) => (
                  <button
                    key={String(b.id)}
                    type="button"
                    onClick={() => {
                      setSelected(b);
                      setNotes(String(b.admin_notes || ""));
                    }}
                    className="w-full text-left p-5 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-[#111827]">{String(b.title)}</p>
                      <span className="text-xs font-bold uppercase text-[#FC8019]">
                        {String(b.severity)}
                      </span>
                    </div>
                    <p className="text-sm text-[#6B7280] mt-1 line-clamp-2">
                      {String(b.description)}
                    </p>
                    <p className="text-xs text-[#9CA3AF] mt-2">
                      {String(b.status)} · {formatDate(String(b.created_at || ""))}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E7EB] p-6">
            {!selected ? (
              <p className="text-sm text-[#6B7280]">Select a bug to manage.</p>
            ) : (
              <div className="space-y-4">
                <h2 className="font-black text-[#111827]">{String(selected.title)}</h2>
                <p className="text-sm text-[#6B7280] whitespace-pre-wrap">
                  {String(selected.description)}
                </p>
                <label className="block text-sm">
                  <span className="text-xs font-bold text-[#6B7280]">Status</span>
                  <select
                    value={String(selected.status || "open")}
                    onChange={(e) =>
                      setSelected({ ...selected, status: e.target.value })
                    }
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-3 py-2"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-bold text-[#6B7280]">Severity</span>
                  <select
                    value={String(selected.severity || "medium")}
                    onChange={(e) =>
                      setSelected({ ...selected, severity: e.target.value })
                    }
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-3 py-2"
                  >
                    {SEVERITIES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-xs font-bold text-[#6B7280]">Admin notes</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="mt-1 w-full border border-[#E5E7EB] rounded-xl px-3 py-2 resize-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void saveBug()}
                  className="w-full bg-[#FC8019] text-white font-bold py-3 rounded-xl"
                >
                  Save changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
