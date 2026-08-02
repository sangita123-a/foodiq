"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import AdminShell from "@/components/admin/AdminShell";
import {
  fetchAdminDriverTickets,
  fetchAdminDriverTicketDetail,
  assignAdminToDriverTicket,
  updateDriverTicketStatus,
  sendAdminDriverMessage,
  uploadSupportAttachment,
  type SupportTicketItem,
  type SupportMessageItem,
  type SupportAnalytics,
  type TicketStatus,
  type TicketPriority,
} from "@/services/deliverySupportApi";
import { getSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socketEvents";
import {
  Headphones,
  Search,
  Send,
  Paperclip,
  Image as ImageIcon,
  CheckCheck,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Lock,
  User,
  Phone,
  Mail,
  Truck,
  Star,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  ShieldAlert,
  BarChart3,
  UserCheck,
} from "lucide-react";

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

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [messages, setMessages] = useState<SupportMessageItem[]>([]);
  const [analytics, setAnalytics] = useState<SupportAnalytics | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Messaging & Status Update State
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assigningAdmin, setAssigningAdmin] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  // File Inputs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Load tickets for Admin
  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      let statusParam: string | undefined = undefined;
      if (tabFilter === "open") statusParam = "open";
      if (tabFilter === "in_progress") statusParam = "in_progress";
      if (tabFilter === "resolved") statusParam = "resolved";

      const res = await fetchAdminDriverTickets({
        status: statusParam,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        search: search.trim() || undefined,
      });

      setTickets(res.tickets);
      if (res.analytics) setAnalytics(res.analytics);

      if (res.tickets.length > 0 && !selectedTicket) {
        loadTicketDetail(res.tickets[0].id);
      }
    } catch (err) {
      console.warn("Failed to load admin support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  }, [tabFilter, priorityFilter, search]);

  // Load single ticket details & messages
  const loadTicketDetail = async (ticketId: string) => {
    setLoadingDetail(true);
    try {
      const ticket = await fetchAdminDriverTicketDetail(ticketId);
      setSelectedTicket(ticket);
      setMessages(ticket.messages || []);
      scrollToBottom();
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
      }

      setTickets((prev) =>
        prev.map((t) => {
          if (t.id === msg.ticket_id) {
            return {
              ...t,
              latest_message: msg.message || (msg.message_type === "image" ? "📷 Image" : "📁 Attachment"),
              latest_message_at: msg.created_at,
              unread_count: selectedTicket?.id === msg.ticket_id ? 0 : (t.unread_count || 0) + (msg.sender_type === "partner" ? 1 : 0),
            };
          }
          return t;
        })
      );
    };

    const handlePartnerTyping = (data: { ticket_id: string; sender_type: string }) => {
      if (selectedTicket && data.ticket_id === selectedTicket.id && data.sender_type === "partner") {
        setIsPartnerTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsPartnerTyping(false), 3000);
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
    socket.on(SOCKET_EVENTS.SUPPORT_TYPING_EVENT, handlePartnerTyping);
    socket.on(SOCKET_EVENTS.SUPPORT_STATUS_CHANGE, handleStatusChange);

    return () => {
      socket.off(SOCKET_EVENTS.SUPPORT_NEW_MESSAGE, handleNewMessage);
      socket.off(SOCKET_EVENTS.SUPPORT_TYPING_EVENT, handlePartnerTyping);
      socket.off(SOCKET_EVENTS.SUPPORT_STATUS_CHANGE, handleStatusChange);
    };
  }, [selectedTicket]);

  // Admin Sends Message
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTicket || !inputMessage.trim() || sending) return;
    if (selectedTicket.status === "closed") return;

    setSending(true);
    const text = inputMessage.trim();
    setInputMessage("");

    try {
      const newMsg = await sendAdminDriverMessage({
        ticket_id: selectedTicket.id,
        message: text,
        message_type: "text",
      });

      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();

      // Update local ticket list
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id
            ? { ...t, latest_message: text, latest_message_at: new Date().toISOString(), status: t.status === "open" ? "in_progress" : t.status }
            : t
        )
      );

      if (selectedTicket.status === "open") {
        setSelectedTicket((prev) => (prev ? { ...prev, status: "in_progress" } : null));
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to send admin message");
    } finally {
      setSending(false);
    }
  };

  // Upload Attachment File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedTicket) return;
    if (selectedTicket.status === "closed") return;

    const file = files[0];
    setUploading(true);

    try {
      const url = await uploadSupportAttachment(file);
      const newMsg = await sendAdminDriverMessage({
        ticket_id: selectedTicket.id,
        attachment_url: url,
        message_type: type,
        message: type === "image" ? "Uploaded Image Attachment" : `Attachment: ${file.name}`,
      });

      setMessages((prev) => [...prev, newMsg]);
      scrollToBottom();
    } catch (err: any) {
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Status Changer
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!selectedTicket || statusUpdating) return;
    setStatusUpdating(true);

    try {
      const updated = await updateDriverTicketStatus({
        ticket_id: selectedTicket.id,
        status: newStatus,
      });

      setSelectedTicket(updated);
      setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t)));
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update ticket status");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Assign Admin
  const handleAssignAdmin = async () => {
    if (!selectedTicket || assigningAdmin) return;
    setAssigningAdmin(true);

    try {
      const updated = await assignAdminToDriverTicket({
        ticket_id: selectedTicket.id,
      });

      setSelectedTicket(updated);
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, assigned_admin: updated.assigned_admin } : t))
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to assign admin");
    } finally {
      setAssigningAdmin(false);
    }
  };

  return (
    <AdminShell title="Driver Support Management">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Headphones className="w-6 h-6 text-primary" /> Driver Support Operations
          </h1>
          <p className="text-sm text-gray-400">
            Real-time resolution console for delivery partner tickets and live support chats.
          </p>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-3.5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase">Total Tickets</p>
          <p className="text-2xl font-black text-foreground mt-1">{analytics?.total_tickets || 0}</p>
        </div>

        <div className="bg-card border border-amber-500/20 rounded-xl p-3.5 shadow-sm">
          <p className="text-xs font-bold text-amber-500 uppercase">Open</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{analytics?.open_tickets || 0}</p>
        </div>

        <div className="bg-card border border-blue-500/20 rounded-xl p-3.5 shadow-sm">
          <p className="text-xs font-bold text-blue-500 uppercase">In Progress</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{analytics?.in_progress_tickets || 0}</p>
        </div>

        <div className="bg-card border border-emerald-500/20 rounded-xl p-3.5 shadow-sm">
          <p className="text-xs font-bold text-emerald-500 uppercase">Resolved</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{analytics?.resolved_tickets || 0}</p>
        </div>

        <div className="bg-card border border-slate-500/20 rounded-xl p-3.5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase">Closed</p>
          <p className="text-2xl font-black text-slate-400 mt-1">{analytics?.closed_tickets || 0}</p>
        </div>

        <div className="bg-card border border-red-500/20 rounded-xl p-3.5 shadow-sm">
          <p className="text-xs font-bold text-red-500 uppercase">Urgent</p>
          <p className="text-2xl font-black text-red-500 mt-1">{analytics?.urgent_tickets || 0}</p>
        </div>
      </div>

      {/* Main Grid Layout: Ticket List (4 cols) & Live Chat/Partner Info (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[660px]">
        {/* Left Column: Tickets Stream & Filters */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-4 flex flex-col h-[670px] shadow-sm">
          {/* Tabs Filter */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl mb-3 text-xs font-bold">
            <button
              onClick={() => setTabFilter("all")}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${tabFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-gray-400"}`}
            >
              All
            </button>
            <button
              onClick={() => setTabFilter("open")}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${tabFilter === "open" ? "bg-card text-amber-500 shadow-sm" : "text-gray-400"}`}
            >
              Open
            </button>
            <button
              onClick={() => setTabFilter("in_progress")}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${tabFilter === "in_progress" ? "bg-card text-blue-500 shadow-sm" : "text-gray-400"}`}
            >
              Active
            </button>
            <button
              onClick={() => setTabFilter("resolved")}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${tabFilter === "resolved" ? "bg-card text-emerald-500 shadow-sm" : "text-gray-400"}`}
            >
              Resolved
            </button>
          </div>

          {/* Search & Priority Selector */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search partner, ticket #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-secondary/50 border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent First</option>
              <option value="high">🟠 High Priority</option>
              <option value="medium">🔵 Medium Priority</option>
              <option value="low">⚪ Low Priority</option>
            </select>
          </div>

          {/* Ticket Stream */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {loadingTickets && (
              <div className="p-8 text-center text-gray-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading tickets...
              </div>
            )}

            {!loadingTickets && tickets.length === 0 && (
              <div className="p-8 text-center text-gray-400 border border-dashed border-border rounded-xl text-xs">
                No support tickets match your filter criteria.
              </div>
            )}

            {!loadingTickets &&
              tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                const statusConf = STATUS_CONFIG[t.status] || STATUS_CONFIG.open;
                const priorityConf = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;

                return (
                  <div
                    key={t.id}
                    onClick={() => loadTicketDetail(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "bg-secondary/20 hover:bg-secondary/50 border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-primary">{t.ticket_number}</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priorityConf.badge}`}>
                          {priorityConf.label}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}>
                          {statusConf.label}
                        </span>
                      </div>
                    </div>

                    <p className="font-bold text-xs text-foreground line-clamp-1">{t.subject}</p>
                    <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Partner: {t.partner_name || "Delivery Partner"}</p>

                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1.5">
                      <span className="truncate max-w-[160px]">{t.latest_message || "No messages yet"}</span>
                      {t.unread_count && t.unread_count > 0 ? (
                        <span className="bg-red-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                          {t.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Live Chat & Partner Details (8 cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-2xl flex flex-col h-[670px] overflow-hidden shadow-sm">
          {selectedTicket ? (
            <>
              {/* Ticket Action Header */}
              <div className="p-4 border-b border-border bg-secondary/30 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {selectedTicket.ticket_number}
                    </span>
                    <span className="text-xs text-gray-400">Partner ID: {selectedTicket.partner_id.slice(0, 8)}...</span>
                  </div>
                  <h3 className="font-bold text-base text-foreground mt-0.5">{selectedTicket.subject}</h3>
                </div>

                {/* Status Switcher & Assign Dropdown */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAssignAdmin}
                    disabled={assigningAdmin}
                    className="inline-flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                    {selectedTicket.assigned_admin ? "Assigned" : "Claim Ticket"}
                  </button>

                  <select
                    value={selectedTicket.status}
                    disabled={statusUpdating}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="open">Set Open</option>
                    <option value="in_progress">Set In Progress</option>
                    <option value="resolved">Set Resolved</option>
                    <option value="closed">Set Closed</option>
                  </select>
                </div>
              </div>

              {/* Partner Details Banner */}
              <div className="bg-secondary/20 border-b border-border px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-gray-300">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" /> {selectedTicket.partner_name || "Partner"}
                  </span>
                  {selectedTicket.partner_phone ? (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Phone className="w-3 h-3" /> {selectedTicket.partner_phone}
                    </span>
                  ) : null}
                  {selectedTicket.partner_vehicle ? (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Truck className="w-3 h-3" /> {selectedTicket.partner_vehicle}
                    </span>
                  ) : null}
                </div>

                {selectedTicket.partner_rating ? (
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <Star className="w-3 h-3 fill-amber-400" /> {selectedTicket.partner_rating} Rating
                  </span>
                ) : null}
              </div>

              {/* Chat Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-background/50 custom-scrollbar">
                {messages.length === 0 && !loadingDetail ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    No messages recorded yet. Write an agent response below.
                  </div>
                ) : null}

                {messages.map((m) => {
                  const isAdmin = m.sender_type === "admin";

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"} space-y-1`}
                    >
                      <span className="text-[10px] font-medium text-gray-400 px-1">
                        {isAdmin ? "You (Admin)" : m.sender_name || "Driver Partner"} •{" "}
                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>

                      <div
                        className={`max-w-[78%] p-3 rounded-2xl text-sm shadow-sm ${
                          isAdmin
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-secondary text-foreground border border-border rounded-tl-none"
                        }`}
                      >
                        {m.message ? <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p> : null}

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
                      </div>
                    </div>
                  );
                })}

                {isPartnerTyping && (
                  <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                    <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    Delivery partner is typing...
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Dock */}
              <div className="p-3 border-t border-border bg-card">
                {selectedTicket.status === "closed" ? (
                  <div className="text-center py-2 text-xs font-medium text-gray-400">
                    This ticket is closed. Change status above to resume support communication.
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
                      placeholder="Type admin response..."
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
              <h3 className="font-bold text-lg text-foreground">Select a Driver Support Ticket</h3>
              <p className="text-xs max-w-sm text-gray-400 mt-1">
                Choose a ticket from the left stream to inspect partner details and converse in live chat.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
