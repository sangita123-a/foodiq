"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import {
  createDriverTicket,
  fetchDriverTickets,
  fetchDriverTicketDetail,
  sendDriverMessage,
  markDriverMessagesRead,
  uploadSupportAttachment,
  type SupportTicketItem,
  type SupportMessageItem,
  type TicketPriority,
  type TicketStatus,
} from "@/services/deliverySupportApi";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  MessageSquare,
  PlusCircle,
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  CheckCheck,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  X,
  Loader2,
  Lock,
  Headphones,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  "General Inquiry",
  "Payout & Wallet",
  "Order & Pickup Issue",
  "Account & KYC",
  "App & Technical Bug",
  "Safety & Emergency",
];

const FAQS = [
  {
    q: "When will my wallet earnings be credited?",
    a: "Earnings are credited to your Foodiq wallet automatically as soon as a delivery is marked completed. You can track every credit under Wallet → Transactions.",
  },
  {
    q: "How long does a withdrawal request take?",
    a: "Withdrawal requests are usually reviewed by the finance team within 24–48 hours. You'll get a notification the moment it's approved or rejected.",
  },
  {
    q: "Why was my KYC document rejected?",
    a: "Documents are rejected if they're blurry, expired, or details don't match your profile. Check the rejection reason on the Documents page and re-upload a clear copy.",
  },
  {
    q: "What do I do if an order is cancelled after pickup?",
    a: "Raise a support ticket under 'Order & Pickup Issue' with your order ID. Cancellations after pickup are compensated based on your travel distance.",
  },
];

const STATUS_CONFIG: Record<TicketStatus, { label: string; bg: string; text: string; border: string }> = {
  open: { label: "Open", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20" },
  in_progress: { label: "In Progress", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20" },
  resolved: { label: "Resolved", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20" },
  closed: { label: "Closed", bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20" },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; badge: string }> = {
  low: { label: "Low", badge: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  medium: { label: "Medium", badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" },
  high: { label: "High", badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400" },
  urgent: { label: "Urgent", badge: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" },
};

export default function DeliverySupportPage() {
  const { data: dashboard } = useDeliveryDashboard();

  // State
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [messages, setMessages] = useState<SupportMessageItem[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Create Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createSubject, setCreateSubject] = useState("");
  const [createCategory, setCreateCategory] = useState("General Inquiry");
  const [createPriority, setCreatePriority] = useState<TicketPriority>("medium");
  const [createMessage, setCreateMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Messaging State
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // File Inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll Chat to Bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Load tickets list
  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await fetchDriverTickets({
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        search: search.trim() || undefined,
      });
      setTickets(res.tickets);

      // Auto select first ticket if none selected
      if (res.tickets.length > 0 && !selectedTicket) {
        loadTicketDetail(res.tickets[0].id);
      }
    } catch (err) {
      console.warn("Failed to load tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, [statusFilter, priorityFilter, search]);

  // Load single ticket details & messages
  const loadTicketDetail = async (ticketId: string) => {
    setLoadingDetail(true);
    try {
      const ticket = await fetchDriverTicketDetail(ticketId);
      setSelectedTicket(ticket);
      setMessages(ticket.messages || []);
      scrollToBottom();

      // Mark read if unread count > 0
      if (ticket.unread_count && ticket.unread_count > 0) {
        await markDriverMessagesRead(ticketId);
        // Clear local unread badge
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, unread_count: 0 } : t))
        );
      }
    } catch (err) {
      console.warn("Failed to load ticket detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Socket setup for real-time messages & typing
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: SupportMessageItem) => {
      if (selectedTicket && msg.ticket_id === selectedTicket.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
        // Mark read if chat is open
        if (msg.sender_type === "admin") {
          markDriverMessagesRead(selectedTicket.id).catch(() => {});
        }
      }
      // Update ticket list preview
      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === msg.ticket_id) {
            return {
              ...t,
              latest_message: msg.message || (msg.message_type === "image" ? "📷 Image" : "📁 Attachment"),
              latest_message_at: msg.created_at,
              unread_count: selectedTicket?.id === msg.ticket_id ? 0 : (t.unread_count || 0) + (msg.sender_type === "admin" ? 1 : 0),
            };
          }
          return t;
        })
      );
    };

    const handleTyping = (data: { ticket_id: string; sender_type: string }) => {
      if (selectedTicket && data.ticket_id === selectedTicket.id && data.sender_type === "admin") {
        setIsTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleStatusChange = (data: { ticket_id: string; status: TicketStatus; assigned_admin?: string }) => {
      setTickets((prev) =>
        prev.map((t) => (t.id === data.ticket_id ? { ...t, status: data.status, assigned_admin: data.assigned_admin || t.assigned_admin } : t))
      );
      if (selectedTicket && selectedTicket.id === data.ticket_id) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: data.status } : null));
      }
    };

    socket.on(SOCKET_EVENTS.SUPPORT_NEW_MESSAGE, handleNewMessage);
    socket.on(SOCKET_EVENTS.SUPPORT_TYPING_EVENT, handleTyping);
    socket.on(SOCKET_EVENTS.SUPPORT_STATUS_CHANGE, handleStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.SUPPORT_NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.SUPPORT_TYPING_EVENT, handleTyping);
      socket.off(SOCKET_EVENTS.SUPPORT_STATUS_CHANGE, handleStatusChange);
    };
  }, [selectedTicket]);

  // Submit Create Ticket Form
  const handleCreateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!createSubject.trim()) {
      setCreateError("Please enter a subject");
      return;
    }
    setCreating(true);
    setCreateError("");

    try {
      const ticket = await createDriverTicket({
        subject: createSubject.trim(),
        category: createCategory,
        priority: createPriority,
        description: createMessage.trim(),
        message: createMessage.trim(),
      });

      setShowCreateModal(false);
      setCreateSubject("");
      setCreateMessage("");
      setCreatePriority("medium");

      // Reload ticket list & select newly created ticket
      await loadTickets();
      loadTicketDetail(ticket.id);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err.message || "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  // Send Message in Active Chat
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !inputMessage.trim() || sending) return;

    if (selectedTicket.status === "closed") return;

    setSending(true);
    const text = inputMessage.trim();
    setInputMessage("");

    try {
      const newMsg = await sendDriverMessage({
        ticket_id: selectedTicket.id,
        message: text,
        message_type: "text",
      });

      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, latest_message: text, latest_message_at: new Date().toISOString() }
            : t
        )
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Upload Image or File Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedTicket) return;
    if (selectedTicket.status === "closed") return;

    const file = files[0];
    setUploading(true);

    try {
      const url = await uploadSupportAttachment(file);
      const newMsg = await sendDriverMessage({
        ticket_id: selectedTicket.id,
        attachment_url: url,
        message_type: type,
        message: type === "image" ? "Uploaded Image Attachment" : `Attachment: ${file.name}`,
      });

      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    } catch (err: any) {
      alert("Attachment upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <DeliveryShell title="Driver Support Chat" online={dashboard?.is_online}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Headphones className="w-6 h-6 text-primary" /> Driver Support Hub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Get 24/7 priority live support assistance from Foodiq operations team.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
        >
          <PlusCircle className="w-5 h-5" /> Raise New Ticket
        </button>
      </div>

      {/* Main Grid: Ticket Sidebar & Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left Column: Ticket List & Search (4 Cols) */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-4 flex flex-col h-[650px] shadow-sm">
          {/* Search & Filter Controls */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 font-medium text-foreground focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Ticket Cards Stream */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {loadingTickets && (
              <div className="p-8 text-center text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading tickets...
              </div>
            )}

            {!loadingTickets && tickets.length === 0 && (
              <div className="p-8 text-center text-gray-400 border border-dashed border-border rounded-xl">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No tickets found</p>
                <p className="text-xs text-gray-400 mt-1">Raise a new ticket to chat with support.</p>
              </div>
            )}

            {!loadingTickets &&
              tickets.map((t) => {
                const statusConf = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                const priorityConf = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                const isSelected = selectedTicket?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "bg-secondary/20 hover:bg-secondary/50 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-primary">{t.ticket_number}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityConf.badge}`}>
                          {priorityConf.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                          {statusConf.label}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-foreground line-clamp-1 mb-1">{t.subject}</h4>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="truncate max-w-[170px] text-gray-500 dark:text-gray-400">
                        {t.latest_message || "No messages yet"}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.unread_count && t.unread_count > 0 ? (
                          <span className="bg-red-500 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                            {t.unread_count}
                          </span>
                        ) : null}
                        <span className="text-[11px]">
                          {t.created_at ? new Date(t.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Chat Window & Details (8 Cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl flex flex-col h-[650px] overflow-hidden shadow-sm">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {selectedTicket.ticket_number}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">Category: {selectedTicket.category}</span>
                  </div>
                  <h3 className="font-bold text-base text-foreground mt-0.5">{selectedTicket.subject}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_CONFIG[selectedTicket.status]?.bg} ${STATUS_CONFIG[selectedTicket.status]?.text} ${STATUS_CONFIG[selectedTicket.status]?.border}`}>
                    {STATUS_CONFIG[selectedTicket.status]?.label}
                  </span>
                  <button
                    onClick={() => loadTicketDetail(selectedTicket.id)}
                    className="p-2 hover:bg-secondary rounded-lg text-gray-400 hover:text-foreground transition-colors"
                    title="Refresh Chat"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingDetail ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Closed Ticket Read-Only Warning Banner */}
              {selectedTicket.status === "closed" && (
                <div className="bg-slate-500/10 border-b border-slate-500/20 text-slate-600 dark:text-slate-400 px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  This support ticket is closed and read-only.
                </div>
              )}

              {/* Chat Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50 custom-scrollbar">
                {messages.length === 0 && !loadingDetail ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold">No conversation messages yet.</p>
                    <p className="text-xs">Type a message below to start chatting with support.</p>
                  </div>
                ) : null}

                {messages.map((m) => {
                  const isPartner = m.sender_type === "partner";

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isPartner ? "items-end" : "items-start"} space-y-1`}
                    >
                      <span className="text-[10px] font-medium text-gray-400 px-1">
                        {isPartner ? "You (Driver)" : m.sender_name || "Foodiq Support Agent"} •{" "}
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>

                      <div
                        className={`max-w-[78%] p-3 rounded-2xl text-sm shadow-sm ${
                          isPartner
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-secondary text-foreground border border-border rounded-tl-none"
                        }`}
                      >
                        {/* Text Message */}
                        {m.message ? <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p> : null}

                        {/* Image Attachment */}
                        {m.message_type === "image" && m.attachment_url ? (
                          <div className="mt-2 rounded-xl overflow-hidden border border-white/20">
                            <a href={m.attachment_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={m.attachment_url}
                                alt="Attachment"
                                className="max-h-52 w-auto object-cover hover:scale-105 transition-transform"
                              />
                            </a>
                          </div>
                        ) : null}

                        {/* File Attachment */}
                        {m.message_type === "file" && m.attachment_url ? (
                          <a
                            href={m.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 bg-black/20 hover:bg-black/30 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <FileText className="w-4 h-4" /> Download File Attachment
                          </a>
                        ) : null}

                        {/* Read Receipt */}
                        {isPartner && (
                          <div className="flex justify-end mt-1 text-[10px] opacity-75">
                            <CheckCheck className={`w-3.5 h-3.5 ${m.is_read ? "text-blue-200" : "text-white/60"}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                    <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    Support Agent is typing...
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Dock */}
              <div className="p-3 border-t border-border bg-card">
                {selectedTicket.status === "closed" ? (
                  <div className="text-center py-2 text-xs font-medium text-gray-400">
                    Ticket is closed. Re-open or create a new ticket to resume conversation.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Attachment Upload Buttons */}
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "image")}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx,.txt,.zip"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "file")}
                    />

                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => imageInputRef.current?.click()}
                      className="p-2.5 text-gray-400 hover:text-primary hover:bg-secondary rounded-xl transition-colors disabled:opacity-50"
                      title="Upload Image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-gray-400 hover:text-primary hover:bg-secondary rounded-xl transition-colors disabled:opacity-50"
                      title="Upload Document File"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type your reply here..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      className="flex-1 bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || sending || uploading}
                      className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl font-bold transition-all disabled:opacity-40"
                    >
                      {sending || uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
              <Headphones className="w-12 h-12 text-primary/40 mb-3" />
              <h3 className="font-bold text-lg text-foreground">Select a Support Ticket</h3>
              <p className="text-xs max-w-sm text-gray-400 mt-1">
                Choose a ticket from the left column or create a new ticket to chat live with Foodiq resolution team.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Frequently Asked Driver Questions</h3>
        <div className="space-y-3">
          {FAQS.map((faq, index) => (
            <div key={index} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-foreground bg-secondary/20 hover:bg-secondary/50 transition-colors"
              >
                <span>{faq.q}</span>
                {faqOpen === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {faqOpen === index && (
                <div className="p-4 text-xs text-gray-500 dark:text-gray-400 bg-card border-t border-border leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-foreground">Raise Support Ticket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-secondary rounded-lg text-gray-400 hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError ? (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-semibold">
                {createError}
              </div>
            ) : null}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Order payout discrepancy"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Category</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">Priority</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as TicketPriority)}
                    className="w-full bg-secondary/50 border border-border rounded-xl px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1">Description / Initial Message</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue with order IDs or details..."
                  value={createMessage}
                  onChange={(e) => setCreateMessage(e.target.value)}
                  className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-primary hover:bg-primary/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {creating ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DeliveryShell>
  );
}
