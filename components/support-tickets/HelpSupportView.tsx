"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuthToken } from "@/hooks/useAuthToken";
import { useToast } from "@/contexts/ToastContext";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  closeTicket,
  createSupportTicket,
  fetchMyTickets,
  fetchTicketDetail,
  replyToTicket,
  ticketDisplayId,
  statusColor,
  priorityColor,
  uploadTicketImage,
  type SupportTicket,
  type TicketMessage,
} from "@/services/ticketApi";
import { Headphones, MessageSquare, Plus, X, ImagePlus, Send } from "lucide-react";

function MessageBubble({ msg }: { msg: TicketMessage }) {
  const isCustomer = msg.sender_role === "customer";
  const attachments = msg.attachment_urls || [];
  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          isCustomer ? "bg-[#E23744] text-white" : "bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB]"
        }`}
      >
        <p className="text-[10px] font-bold uppercase opacity-70 mb-1">
          {msg.sender_name || msg.sender_role}
        </p>
        <p className="whitespace-pre-wrap">{msg.message}</p>
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-white/30" />
              </a>
            ))}
          </div>
        )}
        <p className="text-[10px] opacity-60 mt-1">
          {msg.created_at ? new Date(msg.created_at).toLocaleString("en-IN") : ""}
        </p>
      </div>
    </div>
  );
}

export default function HelpSupportView() {
  const hasToken = useAuthToken();
  const { showToast } = useToast();
  const { data, mutate, isLoading } = useSWR(hasToken ? "/api/tickets" : null, fetchMyTickets);
  const tickets = data?.tickets || [];

  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ ticket: SupportTicket; messages: TicketMessage[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [category, setCategory] = useState(TICKET_CATEGORIES[0]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [orderId, setOrderId] = useState("");
  const [createImages, setCreateImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [reply, setReply] = useState("");
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setView("detail");
    setLoadingDetail(true);
    try {
      const d = await fetchTicketDetail(id);
      setDetail(d);
    } catch {
      showToast("Could not load ticket", "error");
      setView("list");
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      showToast("Subject and description are required", "error");
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await createSupportTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        priority,
        order_id: orderId.trim() || undefined,
        attachment_urls: createImages,
      });
      showToast(`Ticket ${ticketDisplayId(ticket)} created`, "success");
      setSubject("");
      setDescription("");
      setOrderId("");
      setCreateImages([]);
      await mutate();
      await openDetail(ticket.id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create ticket";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedId || (!reply.trim() && !replyImages.length)) return;
    setSubmitting(true);
    try {
      const result = await replyToTicket(selectedId, {
        message: reply.trim() || undefined,
        attachment_urls: replyImages,
      });
      setDetail({ ticket: result.ticket, messages: [...(detail?.messages || []), result.message] });
      setReply("");
      setReplyImages([]);
      await mutate();
      showToast("Reply sent", "success");
    } catch {
      showToast("Failed to send reply", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    if (!selectedId) return;
    try {
      const ticket = await closeTicket(selectedId);
      setDetail((d) => (d ? { ...d, ticket } : d));
      await mutate();
      showToast("Ticket closed", "success");
    } catch {
      showToast("Could not close ticket", "error");
    }
  };

  const handleImageUpload = async (file: File, target: "create" | "reply") => {
    setUploading(true);
    try {
      const url = await uploadTicketImage(file);
      if (target === "create") setCreateImages((prev) => [...prev, url]);
      else setReplyImages((prev) => [...prev, url]);
    } catch {
      showToast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <Headphones className="w-12 h-12 text-[#E23744] mx-auto mb-4" />
          <h1 className="text-3xl font-black text-[#111827] mb-3">Help & Support</h1>
          <p className="text-[#6B7280] mb-6">Sign in to create support tickets and track your requests.</p>
          <Link href="/login" className="inline-block bg-[#E23744] text-white font-black px-8 py-3 rounded-xl">
            Sign In
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Headphones className="w-7 h-7 text-[#E23744]" />
              <h1 className="text-3xl md:text-4xl font-black text-[#111827]">Help & Support</h1>
            </div>
            <p className="text-[#6B7280]">Create tickets, upload photos, and track resolution status.</p>
          </div>
          {view === "list" && (
            <button
              type="button"
              onClick={() => setView("create")}
              className="flex items-center gap-2 bg-[#E23744] text-white font-black px-5 py-2.5 rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" /> New Ticket
            </button>
          )}
          {view !== "list" && (
            <button
              type="button"
              onClick={() => {
                setView("list");
                setSelectedId(null);
                setDetail(null);
              }}
              className="text-sm font-bold text-[#6B7280]"
            >
              ← Back to tickets
            </button>
          )}
        </div>

        {view === "list" && (
          <div className="space-y-3">
            {isLoading && <div className="h-32 bg-[#F8FAFC] animate-pulse rounded-2xl" />}
            {!isLoading && tickets.length === 0 && (
              <div className="text-center py-16 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
                <MessageSquare className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
                <p className="text-[#6B7280] mb-4">No support tickets yet.</p>
                <button
                  type="button"
                  onClick={() => setView("create")}
                  className="bg-[#E23744] text-white font-black px-6 py-2.5 rounded-xl text-sm"
                >
                  Create your first ticket
                </button>
              </div>
            )}
            {tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openDetail(t.id)}
                className="w-full text-left border border-[#E5E7EB] rounded-2xl p-5 hover:border-[#E23744]/40 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-xs font-bold text-[#9CA3AF]">{ticketDisplayId(t)}</p>
                    <p className="font-black text-[#111827]">{t.subject}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(t.status)}`}>
                    {t.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-[#6B7280]">
                  <span>{t.category}</span>
                  <span className={priorityColor(t.priority)}>Priority: {t.priority || "Medium"}</span>
                  <span>{t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN") : ""}</span>
                  {t.message_count != null && <span>{t.message_count} messages</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {view === "create" && (
          <form onSubmit={handleCreate} className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-1">Issue type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
              >
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-1">Subject</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
                placeholder="Brief summary of your issue"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-1">Order ID (optional)</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
                placeholder="Paste order ID for order-related issues"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-[#9CA3AF] mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
                placeholder="Describe your issue in detail..."
                required
              />
            </div>
            <div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-[#E23744]">
                <ImagePlus className="w-4 h-4" />
                Attach images
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleImageUpload(f, "create");
                    e.target.value = "";
                  }}
                />
              </label>
              {createImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {createImages.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <button
                        type="button"
                        onClick={() => setCreateImages((p) => p.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 bg-[#111827] text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#E23744] text-white font-black py-3 rounded-xl disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        )}

        {view === "detail" && (
          <div className="space-y-4">
            {loadingDetail || !detail ? (
              <div className="h-64 bg-[#F8FAFC] animate-pulse rounded-2xl" />
            ) : (
              <>
                <div className="border border-[#E5E7EB] rounded-2xl p-5">
                  <div className="flex flex-wrap justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs font-bold text-[#9CA3AF]">{ticketDisplayId(detail.ticket)}</p>
                      <h2 className="text-xl font-black text-[#111827]">{detail.ticket.subject}</h2>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full h-fit ${statusColor(detail.ticket.status)}`}>
                      {detail.ticket.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-[#6B7280] mb-2">
                    <span>{detail.ticket.category}</span>
                    <span className={priorityColor(detail.ticket.priority)}>
                      Priority: {detail.ticket.priority || "Medium"}
                    </span>
                    <span>Created {new Date(detail.ticket.created_at || "").toLocaleString("en-IN")}</span>
                  </div>
                  {!["Closed", "Resolved"].includes(detail.ticket.status) && (
                    <button
                      type="button"
                      onClick={handleClose}
                      className="text-xs font-bold text-[#6B7280] underline"
                    >
                      Close ticket
                    </button>
                  )}
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {detail.messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                </div>

                {!["Closed"].includes(detail.ticket.status) && (
                  <div className="border border-[#E5E7EB] rounded-2xl p-4">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm mb-3"
                      placeholder="Write a reply..."
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-bold text-[#E23744]">
                        <ImagePlus className="w-4 h-4" />
                        Add image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void handleImageUpload(f, "reply");
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleReply}
                        disabled={submitting}
                        className="flex items-center gap-2 bg-[#E23744] text-white font-black px-5 py-2 rounded-xl text-sm disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" /> Send Reply
                      </button>
                    </div>
                    {replyImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {replyImages.map((url, i) => (
                          <img key={i} src={url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
