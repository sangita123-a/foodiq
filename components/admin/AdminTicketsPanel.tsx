"use client";

import { useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  TICKET_STATUSES,
  adminAssignTicket,
  adminCloseTicket,
  adminFetchTicketDetail,
  adminFetchTickets,
  adminReplyTicket,
  adminUpdateTicketStatus,
  ticketDisplayId,
  statusColor,
  priorityColor,
  uploadTicketImage,
  type SupportTicket,
  type TicketMessage,
} from "@/services/ticketApi";
import { Headphones, Send } from "lucide-react";

export default function AdminTicketsPanel() {
  const hasToken = useAuthToken();
  const [statusFilter, setStatusFilter] = useState("");
  const { data: tickets = [], mutate } = useSWR(
    hasToken ? ["/api/admin/tickets", statusFilter] : null,
    () => adminFetchTickets(statusFilter)
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: SupportTicket; messages: TicketMessage[] } | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState("");
  const [replyImages, setReplyImages] = useState<string[]>([]);

  const openTicket = async (id: string) => {
    setSelectedId(id);
    setBusy("load");
    try {
      setDetail(await adminFetchTicketDetail(id));
    } finally {
      setBusy("");
    }
  };

  const assign = async (id: string) => {
    setBusy(id);
    try {
      await adminAssignTicket(id);
      await mutate();
      if (selectedId === id) setDetail(await adminFetchTicketDetail(id));
    } finally {
      setBusy("");
    }
  };

  const setStatus = async (id: string, status: string) => {
    setBusy(`status-${id}`);
    try {
      await adminUpdateTicketStatus(id, status);
      await mutate();
      if (selectedId === id) setDetail(await adminFetchTicketDetail(id));
    } finally {
      setBusy("");
    }
  };

  const sendReply = async () => {
    if (!selectedId || (!reply.trim() && !replyImages.length)) return;
    setBusy("reply");
    try {
      const result = await adminReplyTicket(selectedId, {
        message: reply.trim() || undefined,
        attachment_urls: replyImages,
      });
      setDetail({
        ticket: result.ticket,
        messages: [...(detail?.messages || []), result.message],
      });
      setReply("");
      setReplyImages([]);
      await mutate();
    } finally {
      setBusy("");
    }
  };

  const close = async (id: string) => {
    setBusy(`close-${id}`);
    try {
      await adminCloseTicket(id);
      await mutate();
      if (selectedId === id) setDetail(await adminFetchTicketDetail(id));
    } finally {
      setBusy("");
    }
  };

  return (
    <AdminShell title="Support Tickets">
      <div className="mb-6 flex items-center gap-2">
        <Headphones className="w-6 h-6 text-[#E23744]" />
        <div>
          <h1 className="text-2xl font-black text-[#111827]">Customer Support Tickets</h1>
          <p className="text-sm text-[#6B7280]">Assign agents, reply, and manage ticket lifecycle.</p>
        </div>
      </div>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
          {(tickets as SupportTicket[]).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openTicket(t.id)}
              className={`w-full text-left p-4 border-b border-[#F3F4F6] hover:bg-[#F8FAFC] ${
                selectedId === t.id ? "bg-[#E23744]/5" : ""
              }`}
            >
              <div className="flex justify-between gap-2 mb-1">
                <p className="font-bold text-sm text-[#111827]">{t.subject}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                {ticketDisplayId(t)} · {t.user_name || t.user_email} · {t.category}
              </p>
              <p className={`text-xs mt-1 ${priorityColor(t.priority)}`}>Priority: {t.priority || "Medium"}</p>
            </button>
          ))}
          {!tickets.length && <p className="p-6 text-sm text-[#9CA3AF]">No tickets found.</p>}
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 min-h-[400px]">
          {!detail ? (
            <p className="text-sm text-[#9CA3AF]">Select a ticket to view history and reply.</p>
          ) : busy === "load" ? (
            <div className="h-40 bg-[#F8FAFC] animate-pulse rounded-xl" />
          ) : (
            <>
              <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
                <p className="text-xs text-[#9CA3AF]">{ticketDisplayId(detail.ticket)}</p>
                <h2 className="text-lg font-black">{detail.ticket.subject}</h2>
                <p className="text-xs text-[#6B7280] mt-1">
                  {detail.ticket.user_name} · {detail.ticket.user_email}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => assign(detail.ticket.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#111827] text-white"
                  >
                    Assign to me
                  </button>
                  {TICKET_STATUSES.filter((s) => s !== detail.ticket.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={!!busy}
                      onClick={() => setStatus(detail.ticket.id, s)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#E5E7EB]"
                    >
                      Mark {s}
                    </button>
                  ))}
                  {detail.ticket.status !== "Closed" && (
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => close(detail.ticket.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg text-red-600 border border-red-200"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {detail.messages.map((m) => (
                  <div key={m.id} className="text-sm bg-[#F8FAFC] rounded-xl p-3 border border-[#E5E7EB]">
                    <p className="text-[10px] font-bold uppercase text-[#9CA3AF] mb-1">
                      {m.sender_name || m.sender_role}
                    </p>
                    <p>{m.message}</p>
                    {(m.attachment_urls || []).map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block mt-1 text-xs text-[#E23744]">
                        View attachment
                      </a>
                    ))}
                  </div>
                ))}
              </div>

              {detail.ticket.status !== "Closed" && (
                <div>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={3}
                    className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm mb-2"
                    placeholder="Reply to customer..."
                  />
                  <div className="flex gap-2">
                    <label className="text-xs font-bold text-[#E23744] cursor-pointer">
                      + Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const url = await uploadTicketImage(f);
                          setReplyImages((p) => [...p, url]);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={sendReply}
                      disabled={busy === "reply"}
                      className="ml-auto flex items-center gap-1 bg-[#E23744] text-white font-black px-4 py-2 rounded-xl text-sm"
                    >
                      <Send className="w-3.5 h-3.5" /> Send
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
