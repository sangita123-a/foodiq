import api from "@/services/api";

export type PaymentMethodApi =
  | "cod"
  | "upi"
  | "credit_card"
  | "debit_card"
  | "razorpay"
  | "wallet"
  | "net_banking";

export type RazorpayOrderResponse = {
  transaction_id: string;
  razorpay_order_id: string;
  amount: number;
  amount_paise: number;
  currency: string;
  key_id: string;
  mock: boolean;
  payment_method: string;
  /** Razorpay Checkout prefill.method: upi | card | netbanking | wallet */
  prefill_method?: string;
  summary: {
    subtotal: number;
    discount: number;
    delivery_charge: number;
    tax: number;
    grand_total: number;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
};

export type VerifyPaymentResponse = {
  order_id: string;
  payment_id?: string;
  razorpay_payment_id?: string;
  payment_status?: string;
  already_processed?: boolean;
  summary?: {
    estimated_delivery_minutes?: number;
    grand_total?: number;
  };
};

export async function createRazorpayOrder(payload: Record<string, unknown>) {
  const res = await api.post("/api/payments/razorpay/order", payload);
  return res.data.data as RazorpayOrderResponse;
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) {
  const res = await api.post("/api/payments/razorpay/verify", payload);
  return res.data.data as VerifyPaymentResponse;
}

export async function markRazorpayFailed(razorpay_order_id: string, reason?: string) {
  const res = await api.post("/api/payments/razorpay/fail", { razorpay_order_id, reason });
  return res.data.data;
}

export async function mockCompleteRazorpay(razorpay_order_id: string) {
  const res = await api.post("/api/payments/razorpay/mock-complete", { razorpay_order_id });
  return res.data.data as VerifyPaymentResponse;
}

export async function placeCodOrder(payload: Record<string, unknown>) {
  const res = await api.post("/api/orders/place", payload);
  return res.data.data as VerifyPaymentResponse & {
    payment_method: string;
    summary: {
      estimated_delivery_minutes?: number;
      grand_total?: number;
    };
  };
}

export async function fetchPaymentHistory() {
  const res = await api.get("/api/payments/history");
  return res.data.data as Array<Record<string, unknown>>;
}

export function invoiceUrl(paymentId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  return `${base}/api/payments/${paymentId}/invoice`;
}

export async function downloadInvoice(paymentId: string) {
  const res = await api.get(`/api/payments/${paymentId}/invoice`, {
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function retryOrderPayment(orderId: string, amount: number, method: string) {
  const res = await api.post("/api/payments/create", {
    order_id: orderId,
    amount,
    method,
  });
  return res.data.data as {
    razorpay_order_id: string;
    amount: number;
    amount_paise: number;
    currency: string;
    key_id: string;
    mock: boolean;
    order_id: string;
    payment_method?: string;
    prefill_method?: string;
  };
}
