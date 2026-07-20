"use client";

import { useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut, adminPost } from "@/services/adminApi";

type SupportData = {
  tickets: {
    total: number;
    pending: number;
    resolved: number;
    avg_satisfaction: number;
    avg_resolution_hours: number;
  };
  active_live_chats: number;
  ai_sessions: number;
  agents_online: number;
};

type TicketRow = {
  id: string;
  category: string;
  subject: string;
  status: string;
  user_name?: string;
  user_email?: string;
  agent_name?: string;
  created_at?: string;
  satisfaction_score?: number;
};

type LiveChat = {
  id: string;
  user_name?: string;
  status: string;
  message_count?: number;
};

export default function AdminSupportPage() {
  const { data: analytics } = useAdminList<SupportData>("/api/admin/support");
  const { data: tickets, isLoading } = useAdminList<TicketRow[]>("/api/admin/support/tickets");
  const { data: liveChats } = useAdminList<LiveChat[]>("/api/admin/support/live-chats");
  const [tab, setTab] = useState<"overview" | "tickets" | "live" | "ai">("overview");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [agentMsg, setAgentMsg] = useState("");

  const resolve = async (id: string) => {
    await adminPut(`/api/admin/support/tickets/${id}/resolve`, { admin_notes: "Resolved by agent" });
    mutate("/api/admin/support/tickets");
    mutate("/api/admin/support");
  };

  const assign = async (id: string) => {
    await adminPut(`/api/admin/support/tickets/${id}/assign`, {});
    mutate("/api/admin/support/tickets");
  };

  const sendAgentMsg = async () => {
    if (!selectedChat || !agentMsg.trim()) return;
    await adminPost(`/api/admin/support/live-chats/${selectedChat}/messages`, { message: agentMsg });
    setAgentMsg("");
    mutate(`/api/admin/support/live-chats/${selectedChat}`);
  };

  return (
    <AdminShell title="Support Center">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#111827]">AI Customer Support</h1>
        <p className="text-[#6B7280]">Tickets, live chat, Foodiq AI sessions, and satisfaction analytics.</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {(["overview", "tickets", "live", "ai"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize ${
              tab === t ? "bg-[#E23744] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"
            }`}
          >
            {t === "ai" ? "AI Chat History" : t}
          </button>
        ))}
      </div>

      {tab === "overview" && analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Pending Tickets", value: String(analytics.tickets?.pending ?? 0) },
            { label: "Resolved", value: String(analytics.tickets?.resolved ?? 0) },
            {
              label: "Avg Satisfaction",
              value: `${Number(analytics.tickets?.avg_satisfaction || 0).toFixed(1)} ★`,
            },
            {
              label: "Avg Response (hrs)",
              value: Number(analytics.tickets?.avg_resolution_hours || 0).toFixed(1),
            },
            { label: "Active Live Chats", value: String(analytics.active_live_chats ?? 0) },
            { label: "AI Sessions", value: String(analytics.ai_sessions ?? 0) },
            { label: "Agents Online", value: String(analytics.agents_online ?? 0) },
            { label: "Total Tickets", value: String(analytics.tickets?.total ?? 0) },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
              <p className="text-xs font-bold uppercase text-[#9CA3AF] mb-1">{c.label}</p>
              <p className="text-2xl font-black text-[#111827]">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "tickets" && (
        <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden">
          {isLoading && <p className="p-6 text-sm text-[#6B7280]">Loading…</p>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
                <tr>
                  {["Subject", "Category", "Customer", "Status", "Agent", "Actions"].map((h) => (
                    <th key={h} className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tickets || []).map((t) => (
                  <tr key={t.id} className="border-b border-[#E5E7EB]">
                    <td className="p-4 text-sm font-bold">{t.subject}</td>
                    <td className="p-4 text-xs text-[#6B7280]">{t.category}</td>
                    <td className="p-4 text-sm">{t.user_name || t.user_email}</td>
                    <td className="p-4">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F8FAFC]">{t.status}</span>
                    </td>
                    <td className="p-4 text-xs">{t.agent_name || "—"}</td>
                    <td className="p-4 space-x-2">
                      {!t.agent_name && (
                        <button type="button" onClick={() => assign(t.id)} className="text-xs font-bold text-[#111827]">
                          Assign me
                        </button>
                      )}
                      {t.status !== "Resolved" && (
                        <button type="button" onClick={() => resolve(t.id)} className="text-xs font-bold text-emerald-600">
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "live" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-[#E5E7EB] p-4 space-y-2">
            <h2 className="font-black text-[#111827] mb-2 px-2">Active Chats</h2>
            {(liveChats || []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChat(c.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border ${
                  selectedChat === c.id ? "border-[#E23744] bg-[#E23744]/5" : "border-[#E5E7EB]"
                }`}
              >
                <p className="font-bold text-sm">{c.user_name || "Customer"}</p>
                <p className="text-xs text-[#9CA3AF]">{c.status} · {c.message_count || 0} msgs</p>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E7EB] p-6">
            {selectedChat ? (
              <div>
                <p className="text-sm font-bold text-[#6B7280] mb-4">Reply as agent</p>
                <textarea
                  value={agentMsg}
                  onChange={(e) => setAgentMsg(e.target.value)}
                  rows={3}
                  className="w-full border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm mb-3"
                  placeholder="Type your reply…"
                />
                <button type="button" onClick={sendAgentMsg} className="bg-[#E23744] text-white font-black px-6 py-2 rounded-xl text-sm">
                  Send Reply
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#6B7280]">Select a chat to respond.</p>
            )}
          </div>
        </div>
      )}

      {tab === "ai" && (
        <AiSessionsTab />
      )}
    </AdminShell>
  );
}

function AiSessionsTab() {
  const { data } = useAdminList<Array<{ id: string; full_name?: string; email?: string; messages: unknown[]; updated_at?: string }>>(
    "/api/admin/support/ai-sessions"
  );
  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 space-y-3">
      {(data || []).map((s) => (
        <div key={s.id} className="border border-[#E5E7EB] rounded-xl p-4">
          <p className="font-bold text-sm">{s.full_name || s.email || "Guest"}</p>
          <p className="text-xs text-[#9CA3AF]">{Array.isArray(s.messages) ? s.messages.length : 0} messages · {s.updated_at ? new Date(s.updated_at).toLocaleString() : ""}</p>
        </div>
      ))}
      {!data?.length && <p className="text-sm text-[#6B7280]">No AI sessions yet.</p>}
    </div>
  );
}
