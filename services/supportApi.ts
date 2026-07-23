import api from "@/services/api";

export type OrderTimelineStep = {
  key: string;
  label: string;
  state: "completed" | "current" | "upcoming" | "cancelled";
};

export type TrackedOrder = {
  id: string;
  restaurant_name?: string;
  status?: string;
  total_amount?: number;
  order_date?: string;
  created_at?: string;
  payment_method?: string;
  delivery_address?: string;
  delivery_partner?: string | null;
  estimated_delivery_at?: string | number | null;
  estimated_delivery_time?: string | number | null;
  ordered_items?: Array<{
    id?: string;
    name: string;
    quantity: number;
    price?: number;
  }>;
  items?: Array<{ name: string; quantity: number; price_at_time?: number }>;
  timeline?: OrderTimelineStep[];
};

export type PaymentRecord = {
  id: string;
  order_id?: string;
  amount?: number;
  method?: string;
  status?: string;
  created_at?: string;
  transaction_time?: string;
  refund?: { id: string; status: string; amount?: number } | null;
  refund_request?: { id: string; status: string; amount?: number } | null;
  invoice_url?: string;
};

export type SupportHistoryItem = {
  id: string;
  db_id?: string;
  type: "complaint" | "refund" | "email" | "chat" | string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved" | string;
  date: string;
  unread?: number;
};

function unwrap<T>(res: { data?: { data?: T; success?: boolean } }): T {
  return res.data?.data as T;
}

export async function trackOrder(orderId: string) {
  const res = await api.get(`/api/orders/${encodeURIComponent(orderId.trim())}`);
  return unwrap<TrackedOrder>(res);
}

export async function fetchPayments() {
  const res = await api.get("/api/payments");
  const data = unwrap<PaymentRecord[] | { payments?: PaymentRecord[] }>(res);
  if (Array.isArray(data)) return data;
  return (data as { payments?: PaymentRecord[] })?.payments || [];
}

export async function fetchPaymentDetail(id: string) {
  const res = await api.get(`/api/payments/${id}`);
  return unwrap<PaymentRecord>(res);
}

export async function retryPayment(payload: { payment_id?: string; order_id?: string }) {
  const res = await api.post("/api/payments/retry", payload);
  return unwrap<{
    payment: PaymentRecord;
    checkout_hint?: string;
    retry?: boolean;
  }>(res);
}

export async function fetchRefund(id: string) {
  const res = await api.get(`/api/refunds/${id}`);
  return unwrap<Record<string, unknown>>(res);
}

export async function downloadInvoice(paymentId: string) {
  const res = await api.get(`/api/payments/${paymentId}/invoice`, {
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function submitOrderProblem(form: FormData) {
  const res = await api.post("/api/support/order-problem", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<{
    ticket_number: string;
    status: string;
    expected_resolution_time?: string;
    expected_resolution_hours?: number;
  }>(res);
}

export async function submitEmailSupport(form: FormData) {
  const res = await api.post("/api/support/email", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrap<{ ticket_number: string; status: string }>(res);
}

export async function fetchSupportHistory() {
  const res = await api.get("/api/support/history");
  return unwrap<{
    tickets: SupportHistoryItem[];
    complaints: unknown[];
    refunds: Array<{ id: string; status?: string; amount?: number; order_id?: string }>;
    emails: unknown[];
    chats: unknown[];
  }>(res);
}

export async function fetchUserOrders() {
  const res = await api.get("/api/orders");
  const data = unwrap<unknown>(res);
  if (Array.isArray(data)) return data as Array<{ id: string; restaurant_name?: string; status?: string }>;
  const obj = data as { orders?: Array<{ id: string }> };
  return obj.orders || [];
}
