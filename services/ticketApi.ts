import api from "@/services/api";
import { uploadMedia } from "@/services/mediaApi";

export type TicketCategory =
  | "Order Issue"
  | "Payment Issue"
  | "Refund Issue"
  | "Delivery Issue"
  | "Restaurant Complaint"
  | "Technical Issue";

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High";

export type SupportTicket = {
  id: string;
  ticket_number?: string;
  category: string;
  subject: string;
  description: string;
  status: TicketStatus | string;
  priority?: TicketPriority | string;
  order_id?: string;
  restaurant_id?: string;
  created_at?: string;
  updated_at?: string;
  resolved_at?: string;
  closed_at?: string;
  message_count?: number;
  user_name?: string;
  user_email?: string;
  agent_name?: string;
  restaurant_name?: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  sender_id?: string;
  sender_role: string;
  sender_name?: string;
  message: string;
  attachment_urls?: string[];
  created_at?: string;
};

export const TICKET_CATEGORIES: TicketCategory[] = [
  "Order Issue",
  "Payment Issue",
  "Refund Issue",
  "Delivery Issue",
  "Restaurant Complaint",
  "Technical Issue",
];

export const TICKET_PRIORITIES: TicketPriority[] = ["Low", "Medium", "High"];
export const TICKET_STATUSES: TicketStatus[] = ["Open", "In Progress", "Resolved", "Closed"];

export async function fetchMyTickets() {
  const res = await api.get("/api/tickets");
  return res.data.data as {
    tickets: SupportTicket[];
    categories: string[];
    priorities: string[];
  };
}

export async function fetchTicketDetail(id: string) {
  const res = await api.get(`/api/tickets/${id}`);
  return res.data.data as { ticket: SupportTicket; messages: TicketMessage[] };
}

export async function createSupportTicket(body: {
  category: string;
  subject: string;
  description: string;
  priority?: string;
  order_id?: string;
  restaurant_id?: string;
  attachment_urls?: string[];
}) {
  const res = await api.post("/api/tickets", body);
  return res.data.data as SupportTicket;
}

export async function replyToTicket(
  id: string,
  body: { message?: string; attachment_urls?: string[] }
) {
  const res = await api.post(`/api/tickets/${id}/messages`, body);
  return res.data.data as { message: TicketMessage; ticket: SupportTicket };
}

export async function closeTicket(id: string) {
  const res = await api.put(`/api/tickets/${id}/close`);
  return res.data.data as SupportTicket;
}

export async function uploadTicketImage(file: File) {
  const asset = await uploadMedia(file, { purpose: "document", entity_type: "support_ticket" });
  return asset.url;
}

export async function adminFetchTickets(status = "") {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await api.get(`/api/admin/tickets${qs}`);
  return res.data.data.tickets as SupportTicket[];
}

export async function adminFetchTicketDetail(id: string) {
  const res = await api.get(`/api/admin/tickets/${id}`);
  return res.data.data as { ticket: SupportTicket; messages: TicketMessage[] };
}

export async function adminAssignTicket(id: string, agentId?: string) {
  const res = await api.put(`/api/admin/tickets/${id}/assign`, { agent_id: agentId });
  return res.data.data as SupportTicket;
}

export async function adminUpdateTicketStatus(id: string, status: string, adminNotes?: string) {
  const res = await api.put(`/api/admin/tickets/${id}/status`, {
    status,
    admin_notes: adminNotes,
  });
  return res.data.data as SupportTicket;
}

export async function adminReplyTicket(
  id: string,
  body: { message?: string; attachment_urls?: string[] }
) {
  const res = await api.post(`/api/admin/tickets/${id}/messages`, body);
  return res.data.data;
}

export async function adminCloseTicket(id: string) {
  const res = await api.put(`/api/admin/tickets/${id}/close`);
  return res.data.data as SupportTicket;
}

export async function partnerFetchTickets(status = "") {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await api.get(`/api/partner/tickets${qs}`);
  return res.data.data.tickets as SupportTicket[];
}

export async function partnerFetchTicketDetail(id: string) {
  const res = await api.get(`/api/partner/tickets/${id}`);
  return res.data.data as { ticket: SupportTicket; messages: TicketMessage[] };
}

export async function partnerReplyTicket(
  id: string,
  body: { message?: string; attachment_urls?: string[] }
) {
  const res = await api.post(`/api/partner/tickets/${id}/messages`, body);
  return res.data.data;
}

export function ticketDisplayId(t: SupportTicket) {
  return t.ticket_number || `TKT-${String(t.id).slice(0, 8).toUpperCase()}`;
}

export function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "open") return "bg-amber-50 text-amber-700";
  if (s === "in progress") return "bg-blue-50 text-blue-700";
  if (s === "resolved") return "bg-emerald-50 text-emerald-700";
  return "bg-[#F3F4F6] text-[#6B7280]";
}

export function priorityColor(priority?: string) {
  const p = String(priority || "Medium").toLowerCase();
  if (p === "high") return "text-red-600";
  if (p === "low") return "text-[#9CA3AF]";
  return "text-[#111827]";
}
