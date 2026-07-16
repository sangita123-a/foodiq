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
  const platformFee = 15;
  const taxes = Math.round(subtotal * 0.05);

  return (
    <div className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 mb-8">
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-gray-400" />
          Order Summary
        </h3>
        <button className="text-primary text-sm font-bold flex items-center gap-1 hover:text-white transition-colors">
          <Download className="w-4 h-4" /> Invoice
        </button>
      </div>

      <div className="mb-6">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No items found.</p>
        ) : (
          items.map((item, idx) => {
            const unitPrice = parseFloat(String(item.price_at_time || item.price || 0));
            return (
              <div key={idx} className="flex justify-between text-sm mb-3">
                <span className="text-gray-300">
                  <span className="text-white font-medium mr-2">{item.quantity}x</span>
                  {item.name}
                </span>
                <span className="text-white">₹{unitPrice * item.quantity}</span>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-3 text-[#A1A1A1] text-sm mb-6 pb-6 border-b border-white/10">
        <div className="flex justify-between items-center">
          <span>Subtotal</span>
          <span className="text-white">₹{subtotal}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Delivery Fee</span>
          <span className="text-white">₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Platform Fee</span>
          <span className="text-white">₹{platformFee}</span>
        </div>
        <div className="flex justify-between items-center">
          <span>GST</span>
          <span className="text-white">₹{taxes}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between items-center text-green-400">
            <span>Discount (Promo)</span>
            <span>-₹{discount}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-lg text-white font-bold">Total Paid</span>
        <span className="text-2xl font-black text-white">₹{totalPaid}</span>
      </div>

      <div className="bg-[#111] rounded-xl p-4 flex justify-between items-center text-sm border border-white/5">
        <span className="text-gray-400">Payment Method</span>
        <span className="text-white font-bold">{paymentMethod}</span>
      </div>
    </div>
  );
}
