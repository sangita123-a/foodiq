/** Keep in sync with backend `services/notificationTypes.js`. */
export const NOTIFICATION_TYPES = {
  ORDER_PLACED: "order_placed",
  ORDER_ACCEPTED: "order_accepted",
  ORDER_PREPARING: "order_preparing",
  ORDER_READY: "order_ready",
  ORDER_PICKED_UP: "order_picked_up",
  OUT_FOR_DELIVERY: "out_for_delivery",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELLED: "order_cancelled",
  PAYMENT_SUCCESS: "payment_success",
  PAYMENT_FAILED: "payment_failed",
  REFUND_COMPLETED: "refund_completed",
  NEW_ORDER: "new_order",
  NEW_DELIVERY_REQUEST: "new_delivery_request",
} as const;

export type NotificationCategory = "All" | "Orders" | "Offers" | "Payments" | "Account";

export function mapTypeToCategory(type?: string | null, fallbackMessage?: string): NotificationCategory {
  const t = String(type || "").toLowerCase();
  const msg = String(fallbackMessage || "").toLowerCase();
  const blob = `${t} ${msg}`;
  if (blob.includes("offer") || blob.includes("coupon")) return "Offers";
  if (blob.includes("payment") || blob.includes("refund") || blob.includes("earning")) return "Payments";
  if (
    blob.includes("order") ||
    blob.includes("delivery") ||
    blob.includes("pickup") ||
    blob.includes("preparing") ||
    blob.includes("ready") ||
    blob.includes("accepted")
  ) {
    return "Orders";
  }
  return "Account";
}

/** Strip legacy `[type]` prefix from message body. */
export function cleanNotificationMessage(message: string) {
  return String(message || "").replace(/^\[[^\]]+\]\s*/, "");
}
