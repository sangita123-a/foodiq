"use client";

import Link from "next/link";
import useSWR from "swr";
import { CheckCircle2, Navigation, Package, Clock, ShoppingBag, MapPin } from "lucide-react";
import { motion } from "framer-motion";

type OrderSuccessProps = {
  orderId: string;
  etaMinutes?: number;
  asPage?: boolean;
};

type OrderDetails = {
  id: string;
  restaurant_name?: string;
  total_amount?: string | number;
  subtotal?: string | number;
  delivery_fee?: string | number;
  discount_amount?: string | number;
  estimated_delivery_time?: number;
  payment_method?: string;
  street?: string;
  house_no?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  full_name?: string;
  items?: { name: string; quantity: number; price_at_time?: string | number }[];
};

const paymentLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  upi: "UPI",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  razorpay: "Razorpay",
  wallet: "Wallet",
  net_banking: "Net Banking",
};

export default function OrderSuccess({ orderId, etaMinutes = 30, asPage = false }: OrderSuccessProps) {
  const { data: order } = useSWR<OrderDetails>(orderId ? `/api/orders/${orderId}` : null);
  const displayId = orderId.length > 12 ? `ORD-${orderId.slice(0, 8).toUpperCase()}` : orderId;
  const eta = order?.estimated_delivery_time || etaMinutes;
  const etaLabel = `${Math.max(10, eta - 5)} - ${eta + 5} Minutes`;
  const addressLine = order
    ? [order.house_no, order.street, order.city, order.state, order.zip_code].filter(Boolean).join(", ")
    : "";
  const total = Number(order?.total_amount || 0);
  const items = order?.items || [];

  const content = (
    <motion.div
      initial={{ scale: 0.9, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-[#F8FAFC] rounded-3xl p-8 md:p-12 max-w-lg w-full border border-[#E5E7EB] shadow-[0_20px_60px_rgba(226, 55, 68,0.2)] text-center relative overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/20 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <h2 className="text-3xl font-black text-[#111827] mb-2 relative z-10">Order Placed!</h2>
      <p className="text-[#6B7280] mb-8 relative z-10">
        Your food is being prepared and will be with you shortly.
      </p>

      <div className="bg-white rounded-2xl p-4 mb-6 border border-[#E5E7EB] relative z-10 text-left">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#E5E7EB]">
          <Package className="w-5 h-5 text-primary" />
          <div>
            <div className="text-xs text-[#9CA3AF]">Order ID</div>
            <div className="font-bold text-[#111827]">{displayId}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#E5E7EB]">
          <Clock className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-xs text-[#9CA3AF]">Estimated Delivery</div>
            <div className="font-bold text-[#111827]">{etaLabel}</div>
          </div>
        </div>
        {addressLine && (
          <div className="flex items-start gap-3 mb-4 pb-4 border-b border-[#E5E7EB]">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <div className="text-xs text-[#9CA3AF]">Delivery Address</div>
              <div className="font-bold text-[#111827] text-sm leading-relaxed">
                {order?.full_name ? `${order.full_name} · ` : ""}
                {addressLine}
              </div>
            </div>
          </div>
        )}
        {items.length > 0 && (
          <div className="mb-4 pb-4 border-b border-[#E5E7EB]">
            <div className="text-xs text-[#9CA3AF] mb-2">Ordered Items</div>
            <div className="flex flex-col gap-2">
              {items.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">
                    <span className="text-[#111827] font-medium mr-2">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="text-[#111827] font-medium">
                    ₹{Number(item.price_at_time || 0) * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-[#9CA3AF]">Total Amount</div>
            <div className="font-black text-xl text-primary">
              {total > 0 ? `₹${total.toFixed(2)}` : "—"}
            </div>
          </div>
          {order?.payment_method && (
            <div className="text-right">
              <div className="text-xs text-[#9CA3AF]">Payment</div>
              <div className="font-bold text-[#111827] text-sm">
                {paymentLabels[order.payment_method] || order.payment_method}
              </div>
            </div>
          )}
        </div>
      </div>

      <Link
        href={`/track-order?id=${orderId}`}
        className="w-full bg-[#E23744] hover:bg-[#C81E34] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-1 relative z-10"
      >
        <Navigation className="w-5 h-5" />
        Track Your Order
      </Link>

      <Link
        href="/restaurants"
        className="w-full mt-4 bg-white border border-[#E5E7EB] hover:bg-[#F8FAFC] text-[#111827] py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all relative z-10"
      >
        <ShoppingBag className="w-5 h-5" />
        Continue Shopping
      </Link>
    </motion.div>
  );

  if (asPage) return content;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-md"
    >
      {content}
    </motion.div>
  );
}
