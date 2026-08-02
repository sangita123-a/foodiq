import api from "@/services/api";

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SenderType = "partner" | "admin";
export type MessageType = "text" | "image" | "file";

export interface SupportMessageItem {
  id: string;
  ticket_id: string;
  sender_type: SenderType;
  sender_id: string;
  sender_name?: string;
  message: string | null;
  attachment_url: string | null;
  message_type: MessageType;
  is_read: boolean;
  created_at: string;
}

export interface SupportTicketLogItem {
  id: string;
  ticket_id: string;
  action: string;
  performed_by: string | null;
  performed_by_name?: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

export interface SupportTicketItem {
  id: string;
  ticket_number: string;
  partner_id: string;
  partner_name?: string;
  partner_email?: string;
  partner_phone?: string;
  partner_rating?: number;
  partner_vehicle?: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_admin: string | null;
  assigned_admin_name?: string;
  assigned_admin_email?: string;
  unread_count?: number;
  latest_message?: string | null;
  latest_message_at?: string | null;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  messages?: SupportMessageItem[];
  logs?: SupportTicketLogItem[];
}

export interface SupportAnalytics {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  urgent_tickets: number;
}

export interface TicketListResponse {
  tickets: SupportTicketItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  analytics?: SupportAnalytics;
}

function unwrap<T>(res: { data?: { data?: T; success?: boolean } }): T {
  return res.data?.data as T;
}

/* ── Delivery Partner API Endpoints ──────────────────────────────────── */

export async function createDriverTicket(payload: {
  subject: string;
  category?: string;
  priority?: TicketPriority;
  message?: string;
  description?: string;
}) {
  const res = await api.post("/api/delivery/support/ticket", payload);
  return unwrap<SupportTicketItem>(res);
}

export async function fetchDriverTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  search?: string;
}) {
  const res = await api.get("/api/delivery/support/tickets", { params });
  return unwrap<TicketListResponse>(res);
}

export async function fetchDriverTicketDetail(id: string) {
  const res = await api.get(`/api/delivery/support/ticket/${id}`);
  return unwrap<SupportTicketItem>(res);
}

export async function sendDriverMessage(payload: {
  ticket_id: string;
  message?: string;
  attachment_url?: string;
  message_type?: MessageType;
}) {
  const res = await api.post("/api/delivery/support/message", payload);
  return unwrap<SupportMessageItem>(res);
}

export async function markDriverMessagesRead(ticket_id: string) {
  const res = await api.patch("/api/delivery/support/read", { ticket_id });
  return unwrap<{ ticket_id: string; marked_read_count: number }>(res);
}

/* ── Admin Console API Endpoints ─────────────────────────────────────── */

export async function fetchAdminDriverTickets(params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  assigned_admin?: string;
  search?: string;
}) {
  const res = await api.get("/api/admin/support/tickets", { params });
  return unwrap<TicketListResponse>(res);
}

export async function fetchAdminDriverTicketDetail(id: string) {
  const res = await api.get(`/api/admin/support/ticket/${id}`);
  return unwrap<SupportTicketItem>(res);
}

export async function assignAdminToDriverTicket(payload: {
  ticket_id: string;
  assigned_admin?: string;
}) {
  const res = await api.patch("/api/admin/support/assign", payload);
  return unwrap<SupportTicketItem>(res);
}

export async function updateDriverTicketStatus(payload: {
  ticket_id: string;
  status: TicketStatus;
  notes?: string;
}) {
  const res = await api.patch("/api/admin/support/status", payload);
  return unwrap<SupportTicketItem>(res);
}

export async function sendAdminDriverMessage(payload: {
  ticket_id: string;
  message?: string;
  attachment_url?: string;
  message_type?: MessageType;
}) {
  const res = await api.post("/api/admin/support/message", payload);
  return unwrap<SupportMessageItem>(res);
}

/* ── Attachment Upload Helper ────────────────────────────────────────── */

export async function uploadSupportAttachment(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", "document");

  // Attempt delivery document upload endpoint first
  try {
    const res = await api.post("/api/delivery/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const data = unwrap<{ url?: string; document_url?: string }>(res);
    return data?.url || data?.document_url || "";
  } catch (err) {
    // Fallback: local object URL or data URL for offline demonstration if server fails
    console.warn("Server upload fallback:", err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }
}
