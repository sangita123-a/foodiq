"use client";

import Link from "next/link";
import { CheckCircle2, Navigation, Package, Clock, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

type OrderSuccessProps = {
  orderId: string;
  etaMinutes?: number;
  asPage?: boolean;
};

export default function OrderSuccess({ orderId, etaMinutes = 30, asPage = false }: OrderSuccessProps) {
  const displayId = orderId.length > 12 ? `ORD-${orderId.slice(0, 8).toUpperCase()}` : orderId;
  const etaLabel = `${etaMinutes - 5} - ${etaMinutes + 5} Minutes`;

  const content = (
    <motion.div
      initial={{ scale: 0.9, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-[#F8FAFC] rounded-3xl p-8 md:p-12 max-w-md w-full border border-[#E5E7EB] shadow-[0_20px_60px_rgba(252,128,25,0.2)] text-center relative overflow-hidden"
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

      <h2 className="text-3xl font-black text-white mb-2 relative z-10">Order Placed!</h2>
      <p className="text-[#6B7280] mb-8 relative z-10">
        Your food is being prepared and will be with you shortly.
      </p>

      <div className="bg-white rounded-2xl p-4 mb-8 border border-[#E5E7EB] relative z-10 text-left">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#E5E7EB]">
          <Package className="w-5 h-5 text-primary" />
          <div>
            <div className="text-xs text-[#9CA3AF]">Order ID</div>
            <div className="font-bold text-[#111827]">{displayId}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-400" />
          <div>
            <div className="text-xs text-[#9CA3AF]">Estimated Delivery</div>
            <div className="font-bold text-[#111827]">{etaLabel}</div>
          </div>
        </div>
      </div>

      <Link
        href={`/track-order?id=${orderId}`}
        className="w-full bg-[#FC8019] hover:bg-[#E76F0B] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-1 relative z-10"
      >
        <Navigation className="w-5 h-5" />
        Track Your Order
      </Link>

      <Link
        href="/restaurants"
        className="w-full mt-4 bg-[#F8FAFC] hover:bg-[#F8FAFC] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all relative z-10"
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
