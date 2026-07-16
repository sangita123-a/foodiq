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
}) {
  const payload: {
    address_id: string;
    coupon_code?: string;
    delivery_instructions?: string | null;
  } = {
    address_id: draft.addressId,
    delivery_instructions: draft.instructions || null,
  };

  if (draft.couponCode?.trim()) {
    payload.coupon_code = draft.couponCode.trim().toUpperCase();
  }

  return payload;
}
