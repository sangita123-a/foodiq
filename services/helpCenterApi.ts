import api, { fetcher } from "@/services/api";

export const helpCenterFetcher = fetcher;

export type HelpOverview = {
  contact: { email: string; phone: string; whatsapp: string };
  ticket_categories: string[];
  bot_name: string;
  agents_online: boolean;
};

export type ChatMessage = {
  role: string;
  content: string;
  at?: string;
  bot?: string;
};

export type SupportTicket = {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at?: string;
  satisfaction_score?: number;
};

export type LiveMessage = {
  id: string;
  message: string;
  sender_role: string;
  sender_name?: string;
  attachment_url?: string;
  attachment_type?: string;
  created_at?: string;
};

export async function fetchHelpOverview() {
  const res = await api.get("/api/help-center/overview");
  return res.data.data as HelpOverview;
}

export async function sendAiMessage(message: string, sessionId?: string) {
  const res = await api.post("/api/help-center/chat", { message, session_id: sessionId });
  return res.data.data as {
    session_id: string;
    reply: string;
    messages: ChatMessage[];
    bot_name: string;
  };
}

export async function fetchMyTickets() {
  const res = await api.get("/api/help-center/tickets");
  return res.data.data as SupportTicket[];
}

export async function createTicket(body: {
  category: string;
  subject: string;
  description: string;
  session_id?: string;
}) {
  const res = await api.post("/api/help-center/tickets", body);
  return res.data.data as SupportTicket;
}

export async function startLiveChat(subject?: string) {
  const res = await api.post("/api/help-center/live-chat", { subject });
  return res.data.data as { id: string; status: string };
}

export async function fetchLiveChat(chatId: string) {
  const res = await api.get(`/api/help-center/live-chat/${chatId}`);
  return res.data.data as { chat: Record<string, unknown>; messages: LiveMessage[] };
}

export async function sendLiveMessage(
  chatId: string,
  body: { message?: string; attachment_url?: string; attachment_type?: string }
) {
  const res = await api.post(`/api/help-center/live-chat/${chatId}/messages`, body);
  return res.data.data as LiveMessage;
}

export async function fetchAgentStatus() {
  const res = await api.get("/api/help-center/agents/status");
  return res.data.data as { online: boolean; message: string; active_chats: number };
}

export async function closeLiveChat(chatId: string, satisfactionScore?: number) {
  const res = await api.post(`/api/help-center/live-chat/${chatId}/close`, {
    satisfaction_score: satisfactionScore,
  });
  return res.data.data;
}

export async function rateTicket(ticketId: string, score: number) {
  await api.post(`/api/help-center/tickets/${ticketId}/rate`, { score });
}

export const HELP_FAQ_SECTIONS = [
  {
    id: "order",
    title: "Order Help",
    items: [
      { q: "How do I track my order?", a: "Go to My Orders and select your active order for live tracking on the map." },
      { q: "How can I cancel an order?", a: "Cancel from My Orders while status is Pending, usually within 60 seconds without penalty." },
      { q: "Can I modify my order?", a: "Contact support immediately via Live Chat if you need to change items before preparation starts." },
    ],
  },
  {
    id: "payment",
    title: "Payment Help",
    items: [
      { q: "What payment methods are accepted?", a: "UPI, credit/debit cards, net banking, wallets, and COD where available." },
      { q: "Payment failed but money was deducted?", a: "Failed payments are auto-refunded within 2–4 hours. Create a Payment Issue ticket if not resolved." },
    ],
  },
  {
    id: "refund",
    title: "Refund Help",
    items: [
      { q: "How long do refunds take?", a: "UPI/wallets: 2–4 hours. Cards: 5–7 business days after cancellation." },
      { q: "How do I request a refund?", a: "Cancelled orders are refunded automatically. For delivered order issues, submit a Refund ticket." },
    ],
  },
  {
    id: "delivery",
    title: "Delivery Help",
    items: [
      { q: "My order is late", a: "Check live tracking. If significantly delayed, use Live Chat or submit a Delivery Complaint." },
      { q: "Wrong address?", a: "Contact support immediately if the order hasn't been picked up yet." },
    ],
  },
  {
    id: "restaurant",
    title: "Restaurant Help",
    items: [
      { q: "Missing items in my order?", a: "Submit an Order Issue ticket with your order ID and we'll resolve it with the restaurant." },
      { q: "Food quality issue?", a: "Create a Restaurant Complaint ticket with photos if possible." },
    ],
  },
  {
    id: "membership",
    title: "Membership Help",
    items: [
      { q: "How do I earn reward points?", a: "Earn on orders, referrals, reviews, daily login, and first order bonus. Visit /rewards." },
      { q: "What are Silver, Gold, Platinum?", a: "Tiered membership with free delivery, extra discounts, and exclusive coupons at higher tiers." },
    ],
  },
];
