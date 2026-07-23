/**
 * Shared cart / checkout fee rules — must stay aligned with
 * foodiq-frontend/foodiq-backend/services/checkoutService.js
 */

export const DELIVERY_FEE = 50;
export const FREE_DELIVERY_THRESHOLD = 500;
export const PLATFORM_FEE = 5;
export const GST_RATE = 0.05;

export type BillBreakdown = {
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  grandTotal: number;
};

export function calcDeliveryFee(subtotal: number, freeDelivery = false): number {
  if (freeDelivery || subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function calcPlatformFee(subtotal: number): number {
  return subtotal > 0 ? PLATFORM_FEE : 0;
}

export function calcGst(subtotal: number): number {
  return Math.round(subtotal * GST_RATE);
}

export function calcBill(params: {
  subtotal: number;
  discount?: number;
  freeDelivery?: boolean;
}): BillBreakdown {
  const subtotal = Math.max(0, Number(params.subtotal) || 0);
  const discount = Math.max(0, Number(params.discount) || 0);
  const deliveryFee = calcDeliveryFee(subtotal, Boolean(params.freeDelivery));
  const platformFee = calcPlatformFee(subtotal);
  const tax = calcGst(subtotal);
  const grandTotal = Math.max(0, subtotal + deliveryFee + platformFee + tax - discount);
  return { subtotal, deliveryFee, platformFee, tax, discount, grandTotal };
}
