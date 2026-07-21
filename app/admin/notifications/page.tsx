"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { adminPost } from "@/services/adminApi";
import api from "@/services/api";
import { useAuthToken } from "@/hooks/useAuthToken";
import { cleanNotificationMessage } from "@/lib/notificationTypes";
import { CheckCheck, Search, Trash2 } from "lucide-react";

export default function AdminNotificationsPage() {
  const hasToken = useAuthToken();
  const [audience, setAudience] = useState("all");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");
  const [sending, setSending] = useState(false);
  const [q, setQ] = useState("");

  const { data, mutate, isLoading } = useSWR(hasToken ? "/api/notifications" : null);
  const inbox = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (!q) return list;
    const needle = q.toLowerCase();
    return list.filter(
      (n: { title?: string; message?: string }) =>
        String(n.title || "").toLowerCase().includes(needle) ||
        String(n.message || "").toLowerCase().includes(needle)
    );
  }, [data, q]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult("");
    try {
      const dataRes = await adminPost<{ sent: number }>("/api/admin/notifications/broadcast", {
        audience,
        title,
        message,
      });
      setResult(`Sent to ${dataRes.sent} users.`);
      setTitle("");
      setMessage("");
      mutate();
    } catch {
      setResult("Failed to send notifications.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminShell title="Notifications">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-foreground">Notifications</h1>
        <p className="text-gray-text">
          Admin inbox, broadcasts, and platform alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-foreground">Inbox</h2>
            <button
              type="button"
              onClick={async () => {
                await api.put("/api/notifications/read-all");
                mutate();
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-text"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search inbox…"
              className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-white"
            />
          </div>

          {isLoading && <p className="text-sm text-gray-text">Loading…</p>}
          <div className="space-y-3 max-h-[560px] overflow-y-auto">
            {inbox.map((n: {
              id: string;
              title: string;
              message: string;
              is_read: boolean;
              created_at: string;
            }) => (
              <div
                key={n.id}
                className={`bg-white border border-border rounded-2xl p-4 flex gap-3 ${
                  !n.is_read ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-bold text-foreground">{n.title}</p>
                  <p className="text-sm text-gray-text mt-1">
                    {cleanNotificationMessage(n.message)}
                  </p>
                  <p className="text-[10px] text-[#9CA3AF] mt-2">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await api.delete(`/api/notifications/${idSafe(n.id)}`);
                    mutate();
                  }}
                  className="text-[#9CA3AF] hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!isLoading && inbox.length === 0 && (
              <p className="text-sm text-gray-text text-center py-8">No admin alerts yet.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-black text-foreground mb-4">Broadcast</h2>
          <form
            onSubmit={send}
            className="bg-white rounded-3xl border border-border p-6 space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-gray-text mb-2">Audience</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm"
              >
                <option value="all">All users</option>
                <option value="customers">Customers</option>
                <option value="restaurants">Restaurant partners</option>
                <option value="delivery">Delivery partners</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-text mb-2">Title</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-text mb-2">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-border rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="bg-primary text-white font-black px-6 py-3 rounded-xl disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send Notification"}
            </button>
            {result && <p className="text-sm font-bold text-foreground">{result}</p>}
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

function idSafe(id: string) {
  return id;
}
