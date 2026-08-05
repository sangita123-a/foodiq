import api, { fetcher } from "@/services/api";
import {
  adminFetchTickets,
  adminFetchTicketDetail,
  adminAssignTicket,
  adminUpdateTicketStatus,
  adminReplyTicket,
  adminCloseTicket,
  ticketDisplayId,
  type SupportTicket,
  type TicketMessage,
} from "@/services/ticketApi";
import {
  fetchAdminDriverTickets,
  fetchAdminDriverTicketDetail,
  assignAdminToDriverTicket,
  updateDriverTicketStatus,
  sendAdminDriverMessage,
  type SupportTicketItem,
  type SupportMessageItem,
} from "@/services/deliverySupportApi";

/**
 * Unified admin Support Center — a read/write client that fans out to the two
 * existing admin ticket surfaces (`/api/admin/tickets/*` for customer/restaurant
 * tickets, `/api/admin/support/tickets*` for partner tickets) and normalizes both
 * into one shape. Deliberately does NOT introduce a third ticket-list endpoint —
 * see project plan for why the two existing surfaces are reused as-is.
 */

export type UnifiedRequesterType = "customer" | "partner" | "restaurant";
export type UnifiedStatus = "open" | "in_progress" | "resolved" | "closed";
export type UnifiedPriority = "low" | "medium" | "high" | "urgent";

export interface UnifiedTicket {
  id: string;
  source: "ticket" | "partner";
  ticket_number: string;
  category: string;
  subject: string;
  status: UnifiedStatus;
  priority: UnifiedPriority;
  requester_type: UnifiedRequesterType;
  customer_name?: string | null;
  restaurant_name?: string | null;
  partner_name?: string | null;
  partner_phone?: string | null;
  agent_name?: string | null;
  latest_message?: string | null;
  unread_count?: number;
  created_at: string;
  updated_at: string;
}

export interface UnifiedMessage {
  id: string;
  sender_role: string;
  sender_name?: string | null;
  message: string | null;
  attachment_urls: string[];
  created_at: string;
}

export interface SupportCenterAnalytics {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  critical_tickets: number;
  today_tickets: number;
  avg_resolution_hours: number;
  live_chats: number;
  agents_online: number;
  sos_active: number;
  refunds_pending: number;
}

export interface AgentPerformanceRow {
  agent_id: string;
  agent_name: string | null;
  total_tickets: number;
  resolved_tickets: number;
  avg_resolution_hours: number;
}

const normalizeStatus = (status: string): UnifiedStatus => {
  const s = status.toLowerCase().replace(/\s+/g, "_");
  if (s === "in_progress" || s === "pending" || s === "assigned") return "in_progress";
  if (s === "resolved") return "resolved";
  if (s === "closed") return "closed";
  return "open";
};

const normalizePriority = (priority?: string): UnifiedPriority => {
  const p = (priority || "medium").toLowerCase();
  if (p === "low") return "low";
  if (p === "high") return "high";
  if (p === "urgent") return "urgent";
  return "medium";
};

function fromTicket(t: SupportTicket): UnifiedTicket {
  const isRestaurant = t.category === "Restaurant Complaint" && !!t.restaurant_name;
  return {
    id: t.id,
    source: "ticket",
    ticket_number: ticketDisplayId(t),
    category: t.category,
    subject: t.subject,
    status: normalizeStatus(String(t.status)),
    priority: normalizePriority(t.priority),
    requester_type: isRestaurant ? "restaurant" : "customer",
    customer_name: t.user_name,
    restaurant_name: t.restaurant_name,
    agent_name: t.agent_name,
    created_at: t.created_at || "",
    updated_at: t.updated_at || t.created_at || "",
  };
}

function fromPartnerTicket(t: SupportTicketItem): UnifiedTicket {
  return {
    id: t.id,
    source: "partner",
    ticket_number: t.ticket_number,
    category: t.category,
    subject: t.subject,
    status: normalizeStatus(t.status),
    priority: normalizePriority(t.priority),
    requester_type: "partner",
    partner_name: t.partner_name,
    partner_phone: t.partner_phone,
    agent_name: t.assigned_admin_name,
    latest_message: t.latest_message,
    unread_count: t.unread_count,
    created_at: t.created_at,
    updated_at: t.updated_at,
  };
}

export interface UnifiedTicketFilters {
  status?: UnifiedStatus | "";
  priority?: UnifiedPriority | "";
  requesterType?: UnifiedRequesterType | "";
  search?: string;
}

export async function fetchUnifiedTickets(filters: UnifiedTicketFilters = {}): Promise<UnifiedTicket[]> {
  const wantsPartner = !filters.requesterType || filters.requesterType === "partner";
  const wantsTicket = !filters.requesterType || filters.requesterType === "customer" || filters.requesterType === "restaurant";

  const [ticketRows, partnerRows] = await Promise.all([
    wantsTicket ? adminFetchTickets(filters.status ? titleCaseStatus(filters.status) : "") : Promise.resolve([]),
    wantsPartner
      ? fetchAdminDriverTickets({
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          search: filters.search || undefined,
        }).then((r) => r.tickets)
      : Promise.resolve([]),
  ]);

  let unified: UnifiedTicket[] = [
    ...ticketRows.map(fromTicket),
    ...partnerRows.map(fromPartnerTicket),
  ];

  if (filters.requesterType) {
    unified = unified.filter((t) => t.requester_type === filters.requesterType);
  }
  if (filters.priority) {
    unified = unified.filter((t) => t.priority === filters.priority);
  }
  if (filters.status) {
    unified = unified.filter((t) => t.status === filters.status);
  }
  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    unified = unified.filter(
      (t) =>
        t.ticket_number.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (t.customer_name || "").toLowerCase().includes(q) ||
        (t.partner_name || "").toLowerCase().includes(q) ||
        (t.restaurant_name || "").toLowerCase().includes(q)
    );
  }

  return unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function titleCaseStatus(status: UnifiedStatus): string {
  const map: Record<UnifiedStatus, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };
  return map[status];
}

export interface UnifiedTicketDetail {
  ticket: UnifiedTicket;
  messages: UnifiedMessage[];
}

export async function fetchUnifiedTicketDetail(id: string, source: "ticket" | "partner"): Promise<UnifiedTicketDetail> {
  if (source === "partner") {
    const t = await fetchAdminDriverTicketDetail(id);
    return {
      ticket: fromPartnerTicket(t),
      messages: (t.messages || []).map((m: SupportMessageItem) => ({
        id: m.id,
        sender_role: m.sender_type,
        sender_name: m.sender_name,
        message: m.message,
        attachment_urls: m.attachment_url ? [m.attachment_url] : [],
        created_at: m.created_at,
      })),
    };
  }

  const { ticket, messages } = await adminFetchTicketDetail(id);
  return {
    ticket: fromTicket(ticket),
    messages: (messages || []).map((m: TicketMessage) => ({
      id: m.id,
      sender_role: m.sender_role,
      sender_name: m.sender_name,
      message: m.message,
      attachment_urls: m.attachment_urls || [],
      created_at: m.created_at || "",
    })),
  };
}

export async function replyToUnifiedTicket(id: string, source: "ticket" | "partner", message: string) {
  if (source === "partner") {
    return sendAdminDriverMessage({ ticket_id: id, message, message_type: "text" });
  }
  return adminReplyTicket(id, { message });
}

export async function assignUnifiedTicket(id: string, source: "ticket" | "partner") {
  if (source === "partner") {
    return assignAdminToDriverTicket({ ticket_id: id });
  }
  return adminAssignTicket(id);
}

export async function updateUnifiedTicketStatus(id: string, source: "ticket" | "partner", status: UnifiedStatus) {
  if (source === "partner") {
    return updateDriverTicketStatus({ ticket_id: id, status });
  }
  if (status === "closed") {
    return adminCloseTicket(id);
  }
  const titleStatus = titleCaseStatus(status) as "Open" | "In Progress" | "Resolved" | "Closed";
  return adminUpdateTicketStatus(id, titleStatus);
}

export async function fetchSupportCenterAnalytics(): Promise<SupportCenterAnalytics> {
  return fetcher("/api/admin/support-center/analytics");
}

export async function fetchAgentPerformance(): Promise<AgentPerformanceRow[]> {
  return fetcher("/api/admin/support-center/agent-performance");
}
