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
}: Props) {
  const taxes = tax !== undefined ? tax : Math.round(subtotal * 0.05);
  const grandTotal = subtotal + deliveryCharge + taxes - discount;

  return (
    <div className="sticky top-[100px] rounded-2xl border border-[#ECECEC] bg-white p-6 shadow-[0_12px_32px_rgba(28,28,28,0.08)] md:p-8">
      <div className="mb-6 flex items-start gap-4 border-b border-[#ECECEC] pb-6">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[#F8F9FA]">
          <Utensils className="h-6 w-6 text-[#FC8019]" />
        </div>
        <div>
          <h3 className="mb-1 text-xl font-bold tracking-[-0.025em] text-[#1C1C1C]">{restaurantName}</h3>
          <div className="flex items-center gap-1.5 text-xs text-[#686B78]">
            <Clock className="w-3.5 h-3.5" />
            Estimated Delivery: 20-25 mins
          </div>
        </div>
      </div>

      <div className="mb-6 border-b border-[#ECECEC] pb-6">
        <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#686B78]">Order Details</h4>
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-[#686B78]">
                <span className="mr-2 text-[#1C1C1C]">{item.quantity}x</span>
                {item.name}
              </span>
              {item.price !== undefined && (
                <span className="font-medium text-[#1C1C1C]">₹{item.price * item.quantity}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 border-b border-[#ECECEC] pb-6 text-sm text-[#686B78]">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="font-medium text-[#1C1C1C]">₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Delivery Charge</span>
          <span className="font-medium text-[#1C1C1C]">₹{deliveryCharge}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>GST (5%)</span>
          <span className="font-medium text-[#1C1C1C]">₹{taxes}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-green-400 font-medium">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-8">
        <span className="text-lg font-bold text-[#1C1C1C]">Grand Total</span>
        <span className="text-2xl font-black text-[#FC8019]">₹{grandTotal}</span>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FC8019] py-4 font-bold text-white shadow-[0_8px_20px_rgba(252,128,25,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#EF4F5F] hover:shadow-[0_12px_26px_rgba(239,79,95,0.22)] disabled:opacity-50"
      >
        {buttonLabel}
        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-[#686B78]">
        By placing this order, you agree to our Terms & Conditions.
      </p>
    </div>
  );
}
