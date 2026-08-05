"use client";

import { useState, type FormEvent } from "react";
import { X, Send, Loader2, UserCheck, User, Store, Bike, FileText } from "lucide-react";
import { useSupportTicketDetail } from "@/hooks/useSupportTickets";
import {
  replyToUnifiedTicket,
  assignUnifiedTicket,
  updateUnifiedTicketStatus,
  type UnifiedTicket,
  type UnifiedStatus,
} from "@/services/supportCenterApi";
import { useSWRConfig } from "swr";

const REQUESTER_ICON: Record<UnifiedTicket["requester_type"], React.ComponentType<{ className?: string }>> = {
  customer: User,
  restaurant: Store,
  partner: Bike,
};

export default function SupportTicketDrawer({
  ticketId,
  source,
  onClose,
}: {
  ticketId: string;
  source: "ticket" | "partner";
  onClose: () => void;
}) {
  const { data, isLoading, mutate } = useSupportTicketDetail(ticketId, source);
  const { mutate: globalMutate } = useSWRConfig();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const ticket = data?.ticket;
  const RequesterIcon = ticket ? REQUESTER_ICON[ticket.requester_type] : User;

  const refreshLists = () => {
    globalMutate((key) => typeof key === "string" && key.startsWith("support-center:tickets:"));
    globalMutate("support-center:analytics");
  };

  const handleSend = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await replyToUnifiedTicket(ticketId, source, message.trim());
      setMessage("");
      await mutate();
      refreshLists();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: UnifiedStatus) => {
    if (statusUpdating) return;
    setStatusUpdating(true);
    try {
      await updateUnifiedTicketStatus(ticketId, source, status);
      await mutate();
      refreshLists();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (assigning) return;
    setAssigning(true);
    try {
      await assignUnifiedTicket(ticketId, source);
      await mutate();
      refreshLists();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign ticket");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} role="presentation" />
      <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-mono text-xs font-bold text-primary">{ticket?.ticket_number || "..."}</p>
            <h3 className="font-black text-base text-foreground tracking-tight">{ticket?.subject || "Loading..."}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-section text-gray-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading || !ticket ? (
          <div className="flex-1 flex items-center justify-center text-gray-text text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading ticket...
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-border bg-section/40 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                <RequesterIcon className="w-3.5 h-3.5 text-primary" />
                {ticket.customer_name || ticket.partner_name || ticket.restaurant_name || "Requester"}
                {ticket.partner_phone ? <span className="text-gray-text font-normal">• {ticket.partner_phone}</span> : null}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="inline-flex items-center gap-1.5 bg-section hover:bg-border/40 border border-border text-foreground font-bold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  {ticket.agent_name ? "Reassign to me" : "Claim ticket"}
                </button>
                <select
                  value={ticket.status}
                  disabled={statusUpdating}
                  onChange={(e) => handleStatusChange(e.target.value as UnifiedStatus)}
                  className="bg-section border border-border rounded-xl px-2.5 py-1.5 font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
              {(data?.messages || []).length === 0 ? (
                <p className="text-center text-gray-text text-xs py-10">No messages yet.</p>
              ) : (
                data!.messages.map((m) => {
                  const isAgent = m.sender_role === "admin" || m.sender_role === "agent";
                  return (
                    <div key={m.id} className={`flex flex-col ${isAgent ? "items-end" : "items-start"} gap-1`}>
                      <span className="text-[10px] text-gray-text px-1">
                        {isAgent ? "Support Agent" : m.sender_name || "Requester"} •{" "}
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div
                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
                          isAgent ? "bg-primary text-white rounded-tr-sm" : "bg-section text-foreground border border-border rounded-tl-sm"
                        }`}
                      >
                        {m.message && <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>}
                        {m.attachment_urls.map((url) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 flex items-center gap-1.5 underline text-xs"
                          >
                            <FileText className="w-3.5 h-3.5" /> Attachment
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-border flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a reply..."
                disabled={ticket.status === "closed"}
                className="flex-1 bg-section border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!message.trim() || sending || ticket.status === "closed"}
                className="bg-primary hover:bg-primary-hover text-white p-2.5 rounded-xl disabled:opacity-40"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
