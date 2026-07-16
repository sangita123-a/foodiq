"use client";

import { useState } from "react";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";
import api from "@/services/api";

type OrderSummaryProps = {
  subtotal: number;
  taxes?: number;
  delivery?: number;
  discount?: number;
};

export default function OrderSummary({
  subtotal,
  taxes: extTaxes,
  delivery: extDelivery,
  discount: extDiscount,
}: OrderSummaryProps) {
  const [couponCode, setCouponCode] = useState("");
  const [localDiscount, setLocalDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");

  const deliveryFee = extDelivery !== undefined ? extDelivery : 49;
  const platformFee = 15;
  const taxes = extTaxes !== undefined ? extTaxes : Math.round(subtotal * 0.05);
  const discount = (extDiscount || 0) + localDiscount;

  const grandTotal = subtotal + deliveryFee + platformFee + taxes - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");

    try {
      const res = await api.post("/api/coupons/apply", { code: couponCode.trim() });
      setLocalDiscount(parseFloat(res.data.data.discount));
    } catch (err: any) {
      setLocalDiscount(0);
      setCouponError(err.response?.data?.message || "Invalid or expired coupon code.");
    }
  };

  return (
    <div className="bg-[#171717] rounded-[24px] p-6 md:p-8 shadow-xl border border-white/5 sticky top-[100px]">
      <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>

      <div className="flex flex-col gap-4 text-[#A1A1A1] text-sm mb-6 pb-6 border-b border-white/10">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="text-white font-medium">₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Delivery Fee</span>
          <span className="text-white font-medium">₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Platform Fee</span>
          <span className="text-white font-medium">₹{platformFee}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Taxes (5% GST)</span>
          <span className="text-white font-medium">₹{taxes}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-green-400 font-medium">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="text-xs text-[#A1A1A1] uppercase tracking-wider font-bold mb-2 block">
          Have a Coupon?
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Enter Code (e.g. WELCOME50)"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponError("");
              }}
              className="w-full bg-[#0B0B0B] text-white border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#FF2D3B]/50 transition-colors uppercase"
            />
          </div>
          <button
            onClick={handleApplyCoupon}
            className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl text-sm font-bold transition-colors"
          >
            Apply
          </button>
        </div>
        {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
      </div>

      <div className="flex justify-between items-center mb-8">
        <span className="text-lg text-white font-bold">Grand Total</span>
        <span className="text-2xl font-black text-[#FF2D3B]">₹{grandTotal}</span>
      </div>

      <Link
        href="/checkout"
        className="w-full bg-[#FF2D3B] hover:bg-[#e02633] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,45,59,0.4)] hover:-translate-y-1 transition-all duration-300"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5" />
      </Link>

      <p className="text-[#A1A1A1] text-xs text-center mt-4">
        By proceeding, you agree to our Terms & Conditions.
      </p>
    </div>
  );
}
