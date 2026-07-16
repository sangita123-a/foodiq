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
  const platformFee = 15;
  const taxes = tax !== undefined ? tax : Math.round(subtotal * 0.05);
  const grandTotal = subtotal + deliveryCharge + platformFee + taxes - discount;

  return (
    <div className="bg-[#171717] rounded-[24px] p-6 md:p-8 shadow-xl border border-white/5 sticky top-[100px]">
      <div className="flex items-start gap-4 pb-6 border-b border-white/10 mb-6">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
          <Utensils className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{restaurantName}</h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            Estimated Delivery: 20-25 mins
          </div>
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-white/10">
        <h4 className="text-sm font-bold text-gray-300 uppercase mb-4">Order Details</h4>
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-400">
                <span className="text-white mr-2">{item.quantity}x</span>
                {item.name}
              </span>
              {item.price !== undefined && (
                <span className="text-white">₹{item.price * item.quantity}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 text-[#A1A1A1] text-sm mb-6 pb-6 border-b border-white/10">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="text-white font-medium">₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Delivery Charge</span>
          <span className="text-white font-medium">₹{deliveryCharge}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Platform Fee</span>
          <span className="text-white font-medium">₹{platformFee}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>GST (5%)</span>
          <span className="text-white font-medium">₹{taxes}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-green-400 font-medium">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-8">
        <span className="text-lg text-white font-bold">Grand Total</span>
        <span className="text-2xl font-black text-[#FF2D3B]">₹{grandTotal}</span>
      </div>

      <button
        onClick={onPlaceOrder}
        disabled={isSubmitting}
        className="w-full bg-[#FF2D3B] hover:bg-[#e02633] disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,45,59,0.4)] transition-all duration-300"
      >
        {buttonLabel}
        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
      </button>

      <p className="text-[#A1A1A1] text-xs text-center mt-4">
        By placing this order, you agree to our Terms & Conditions.
      </p>
    </div>
  );
}
