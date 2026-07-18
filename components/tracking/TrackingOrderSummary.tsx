"use client";

import { Receipt, Download } from "lucide-react";

type OrderItem = {
  name: string;
  quantity: number;
  price_at_time?: number | string;
  price?: number | string;
};

type TrackingOrderSummaryProps = {
  items?: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  totalPaid?: number;
  paymentMethod?: string;
};

export default function TrackingOrderSummary({
  items = [],
  subtotal = 0,
  deliveryFee = 0,
  discount = 0,
  totalPaid = 0,
  paymentMethod = "UPI",
}: TrackingOrderSummaryProps) {
  const taxes = Math.round(subtotal * 0.05);

  return (
    <div className="bg-[#F8FAFC] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] mb-8">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E5E7EB]">
        <h3 className="text-xl font-bold text-[#111827] flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#6B7280]" />
          Order Summary
        </h3>
        <button
          type="button"
          className="text-primary text-sm font-bold flex items-center gap-1 hover:text-[#111827] transition-colors"
        >
          <Download className="w-4 h-4" /> Invoice
        </button>
      </div>

      <div className="mb-6">
        {items.length === 0 ? (
          <p className="text-[#9CA3AF] text-sm">No items found.</p>
        ) : (
          items.map((item, idx) => {
            const unitPrice = parseFloat(String(item.price_at_time || item.price || 0));
            return (
              <div key={idx} className="flex justify-between text-sm mb-3">
                <span className="text-[#6B7280]">
                  <span className="text-[#111827] font-medium mr-2">{item.quantity}x</span>
                  {item.name}
                </span>
                <span className="text-[#111827]">₹{unitPrice * item.quantity}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3 text-[#A1A1A1] text-sm mb-6 pb-6 border-b border-[#E5E7EB]">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="text-[#111827]">₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Delivery Fee</span>
          <span className="text-[#111827]">₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>GST</span>
          <span className="text-[#111827]">₹{taxes}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-green-500">
            <span>Discount (Promo)</span>
            <span>-₹{discount}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-lg text-[#111827] font-bold">Total Paid</span>
        <span className="text-2xl font-black text-[#111827]">₹{totalPaid}</span>
      </div>

      <div className="bg-white rounded-xl p-4 flex justify-between items-center text-sm border border-[#E5E7EB]">
        <span className="text-[#6B7280]">Payment Method</span>
        <span className="text-[#111827] font-bold">{paymentMethod}</span>
      </div>
    </div>
  );
}
