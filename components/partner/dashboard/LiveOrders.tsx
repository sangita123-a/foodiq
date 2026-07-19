"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Order } from "@/components/partner/orders/types";
import { formatCurrency, formatRelativeTime } from "@/services/partnerApi";

type LiveOrdersProps = {
  orders?: Order[];
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
};

export default function LiveOrders({ orders = [], onAccept, onReject }: LiveOrdersProps) {
  const live = orders.filter((o) => o.status === "New" || o.status === "Accepted").slice(0, 5);
  const newCount = orders.filter((o) => o.status === "New").length;

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl h-full">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#111827]">Live Orders</h2>
          {newCount > 0 && (
            <span className="bg-red-500/20 text-[#E23744] text-xs font-bold px-2 py-1 rounded-md animate-pulse">
              {newCount} New
            </span>
          )}
        </div>
        <Link href="/partner/orders" className="text-sm font-bold text-[#6B7280] hover:text-[#111827] transition-colors">
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {live.length === 0 && (
          <p className="text-[#6B7280] text-sm py-8 text-center">No live orders right now.</p>
        )}
        {live.map((order, idx) => (
          <motion.div 
            key={order.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#E5E7EB] hover:border-[#E5E7EB] transition-colors group"
          >
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-[#E23744] font-bold">
                    #{String(order.id).slice(0, 8)}
                  </span>
                  <span className="text-xs text-[#9CA3AF] flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatRelativeTime(order.orderTime)}
                  </span>
                </div>
                <h4 className="text-[#111827] font-bold text-lg mb-1">{order.customerName}</h4>
                <p className="text-[#6B7280] text-sm">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </p>
                <div className="mt-3 font-bold text-[#111827]">{formatCurrency(order.grandTotal)}</div>
              </div>

              {order.status === "New" && (
                <div className="flex flex-col gap-2 justify-center sm:w-32">
                  <button
                    type="button"
                    onClick={() => onAccept?.(order.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject?.(order.id)}
                    className="w-full bg-[#F8FAFC] hover:bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4 text-red-400" /> Reject
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
