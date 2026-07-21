"use client";

import { ArrowRight, Utensils, Clock } from "lucide-react";

type Props = {
  restaurantName: string;
  items: { name: string; quantity: number; price?: number }[];
  subtotal: number;
  deliveryCharge?: number;
  tax?: number;
  discount: number;
  onPlaceOrder: () => void;
  isSubmitting?: boolean;
  buttonLabel?: string;
  estimatedDeliveryMinutes?: number;
};

export default function CheckoutSummary({
  restaurantName,
  items,
  subtotal,
  deliveryCharge = 50,
  tax,
  discount,
  onPlaceOrder,
  isSubmitting,
  buttonLabel = "Place Order",
  estimatedDeliveryMinutes = 30,
}: Props) {
  const taxes = tax !== undefined ? tax : Math.round(subtotal * 0.05);
  const grandTotal = Math.max(0, subtotal + deliveryCharge + taxes - discount);
  const etaLow = Math.max(10, estimatedDeliveryMinutes - 5);
  const etaHigh = estimatedDeliveryMinutes + 5;

  return (
    <div className="sticky top-[72px] lg:top-[100px] rounded-2xl border border-border bg-white p-4 sm:p-6 shadow-[0_12px_32px_rgba(28,28,28,0.08)] md:p-8 lg:sticky">
      <div className="mb-6 flex items-start gap-4 border-b border-border pb-6">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#F8F9FA]">
          <Utensils className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="mb-1 text-xl font-bold tracking-[-0.025em] text-foreground">{restaurantName}</h3>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Clock className="w-3.5 h-3.5" />
            Estimated Delivery: {etaLow}-{etaHigh} mins
          </div>
        </div>
      </div>

      <div className="mb-6 border-b border-border pb-6">
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted">Order Details</h4>
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-muted">
                <span className="mr-2 text-foreground">{item.quantity}x</span>
                {item.name}
              </span>
              {item.price !== undefined && (
                <span className="font-medium text-foreground">₹{item.price * item.quantity}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 text-sm text-muted">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="font-medium text-foreground">₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Delivery Charge</span>
          <span className="font-medium text-foreground">₹{deliveryCharge}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>GST (5%)</span>
          <span className="font-medium text-foreground">₹{taxes}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-green-400 font-medium">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-8">
        <span className="text-lg font-bold text-foreground">Grand Total</span>
        <span className="text-2xl font-black text-foreground">₹{grandTotal}</span>
      </div>

      <button
        type="button"
        onClick={onPlaceOrder}
        disabled={isSubmitting || items.length === 0}
        className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 min-h-[48px] font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:bg-primary-hover hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] disabled:opacity-50 touch-target text-sm"
      >
        {buttonLabel}
        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        By placing this order, you agree to our Terms & Conditions.
      </p>
    </div>
  );
}
