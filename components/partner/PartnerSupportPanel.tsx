"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  partnerFetchTicketDetail,
  partnerFetchTickets,
  partnerReplyTicket,
  ticketDisplayId,
  statusColor,
  type SupportTicket,
  type TicketMessage,
} from "@/services/ticketApi";
import { MessageSquare, Send } from "lucide-react";

export default function PartnerSupportPanel() {
  const hasToken = useAuthToken();
  const { data: tickets = [], mutate } = useSWR(
    hasToken ? "/api/partner/tickets" : null,
    () => partnerFetchTickets()
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: SupportTicket; messages: TicketMessage[] } | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const open = async (id: string) => {
    setSelectedId(id);
    setDetail(await partnerFetchTicketDetail(id));
  };

  const send = async () => {
    if (!selectedId || !reply.trim()) return;
    setBusy(true);
    try {
      const result = await partnerReplyTicket(selectedId, { message: reply.trim() });
      setDetail({
        ticket: result.ticket,
        messages: [...(detail?.messages || []), result.message],
      });
      setReply("");
      await mutate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] pt-[90px]">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#111827]">Restaurant Complaints</h1>
            <p className="text-sm text-[#6B7280]">Respond to customer complaints about your restaurant.</p>
          </div>
          <Link href="/partner/dashboard" className="text-sm font-bold text-[#E23744]">
            ← Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] divide-y max-h-[70vh] overflow-y-auto">
            {(tickets as SupportTicket[]).length === 0 ? (
              <p className="p-6 text-sm text-[#9CA3AF]">No restaurant complaints.</p>
            ) : (
              (tickets as SupportTicket[]).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => open(t.id)}
                  className={`w-full text-left p-4 hover:bg-[#F8FAFC] ${selectedId === t.id ? "bg-[#E23744]/5" : ""}`}
                >
                  <p className="font-bold text-sm">{t.subject}</p>
                  <p className="text-xs text-[#9CA3AF]">
                    {ticketDisplayId(t)} · {t.user_name}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 min-h-[360px]">
            {!detail ? (
              <div className="flex flex-col items-center justify-center h-full text-[#9CA3AF]">
                <MessageSquare className="w-10 h-10 mb-2" />
                <p className="text-sm">Select a complaint to respond</p>
              </div>
            ) : (
              <>
                <h2 className="font-black text-lg mb-1">{detail.ticket.subject}</h2>
                <p className="text-xs text-[#9CA3AF] mb-4">{ticketDisplayId(detail.ticket)}</p>
                <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
                  {detail.messages.map((m) => (
                    <div key={m.id} className="text-sm bg-[#F8FAFC] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-[#9CA3AF]">{m.sender_role}</p>
                      <p>{m.message}</p>
                    </div>
                  ))}
                </div>
                {detail.ticket.status !== "Closed" && (
                  <div className="flex gap-2">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={2}
                      className="flex-1 border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm"
                      placeholder="Your response..."
                    />
                    <button
                      type="button"
                      onClick={send}
                      disabled={busy}
                      className="bg-[#E23744] text-white px-4 rounded-xl"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
