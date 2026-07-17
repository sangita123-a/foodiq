export type OrderSummaryData = {
  subtotal: number;
  discount: number;
  delivery_charge: number;
  tax: number;
  grand_total: number;
  estimated_delivery_minutes?: number;
};

export type CheckoutDraft = {
  addressId: string;
  couponCode: string | null;
  discountEstimate: number;
  instructions: string;
  deliveryMode: string;
  selectedDate: string;
  selectedTime: string;
  contactPhone?: string;
  orderId?: string;
  orderSummary?: OrderSummaryData;
  cartItems?: { name: string; quantity: number; price?: number }[];
  restaurantName?: string;
};

const CHECKOUT_DRAFT_KEY = "foodiq_checkout_draft";

export function saveCheckoutDraft(draft: CheckoutDraft) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
  }
}

export function getCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
  }
}

export function buildPlaceOrderPayload(draft: {
  addressId: string;
  couponCode?: string | null;
  instructions?: string;
  deliveryMode?: string;
  scheduledFor?: string | null;
}) {
  const payload: {
    address_id: string;
    coupon_code?: string;
    delivery_instructions?: string | null;
    delivery_mode?: string;
    scheduled_for?: string;
  } = {
    address_id: draft.addressId,
    delivery_instructions: draft.instructions || null,
    delivery_mode: draft.deliveryMode === "Schedule" ? "Schedule" : "Now",
  };

  if (draft.couponCode?.trim()) {
    payload.coupon_code = draft.couponCode.trim().toUpperCase();
  }
  if (draft.deliveryMode === "Schedule" && draft.scheduledFor) {
    payload.scheduled_for = draft.scheduledFor;
  }

  return payload;
}

export function buildScheduledFor(
  deliveryMode: string,
  selectedDate: string,
  selectedTime: string
): string | null {
  if (deliveryMode !== "Schedule") return null;

  const base = new Date();
  if (selectedDate === "Tomorrow") {
    base.setDate(base.getDate() + 1);
  }

  const match = selectedTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return base.toISOString();

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  base.setHours(hours, minutes, 0, 0);
  return base.toISOString();
}
