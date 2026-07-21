"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Receipt, Star, Navigation, RefreshCw, Download } from "lucide-react";
import { OrderFilter } from "./OrderFilterTabs";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";

export type OrderItemType = {
  name: string;
  qty: number;
  price: number;
};

export type OrderType = {
  id: string;
  restaurant: string;
  image: string;
  date: string;
  items: OrderItemType[];
  subtotal: number;
  taxes: number;
  discount: number;
  total: number;
  paymentMethod: string;
  address: string;
  status: string;
  onCancel?: (id: string) => void;
};

type Props = {
  order: OrderType;
};

export default function OrderCard({ order }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Status styling logic
  let statusBadge = "";
  if (order.status === "Delivered") statusBadge = "bg-green-500/10 text-green-400 border-green-500/20";
  if (order.status === "Preparing") statusBadge = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  if (order.status === "On the Way") statusBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  if (order.status === "Cancelled") statusBadge = "bg-red-500/10 text-red-400 border-red-500/20";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group mb-6 rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D4D4D4] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] md:p-8"
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
        
        {/* Resto Info */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0">
            <SafeImage src={order.image} fallback={RESTAURANT_FALLBACK} alt={order.restaurant} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h3 className="mb-1 text-xl font-bold tracking-[-0.025em] text-[#1C1C1C] md:text-2xl">{order.restaurant}</h3>
            <p className="mb-2 text-sm text-[#686B78]">{order.date} • {order.id}</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusBadge}`}>
              {order.status === "Delivered" && "🟢"}
              {order.status === "Preparing" && "🟡"}
              {order.status === "On the Way" && "🔵"}
              {order.status === "Cancelled" && "🔴"}
              {order.status}
            </span>
          </div>
        </div>

        {/* Pricing Summary (always visible) */}
        <div className="text-left md:text-right">
          <p className="mb-1 text-sm text-[#686B78]">Total Amount</p>
          <p className="text-2xl font-black text-[#1C1C1C]">₹{order.total}</p>
        </div>

      </div>

      <div className="mb-6 flex items-center gap-2 border-b border-[#EAEAEA] pb-6 text-sm text-[#686B78]">
        <MapPin className="w-4 h-4" />
        <span className="line-clamp-1">{order.address}</span>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 rounded-lg text-sm font-bold text-[#686B78] transition-colors hover:text-[#1C1C1C]"
        >
          View Details
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <Link
          href={`/my-orders/${order.id}`}
          className="text-primary hover:text-[#111827] font-bold text-sm transition-colors"
        >
          Full Details →
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {(order.status === "Preparing" || order.status === "On the Way" || order.status === "Accepted" || order.status === "Ready for pickup" || order.status === "Picked up") && (
            <Link
              href={`/track-order?id=${order.id}`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Navigation className="w-4 h-4" /> Track Order
            </Link>
          )}

          {order.status === "Delivered" && (
            <Link
              href={`/my-orders/${order.id}#feedback`}
              className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-500 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Star className="w-4 h-4 fill-yellow-500" /> Rate Order
            </Link>
          )}

          <Link
            href={`/my-orders/${order.id}`}
              className="flex items-center gap-2 rounded-xl border border-[#EAEAEA] bg-white px-5 py-2.5 text-sm font-bold text-[#1C1C1C] transition-all hover:border-[#D4D4D4] hover:bg-[#FAFAFA]"
          >
            <Download className="w-4 h-4" /> Invoice
          </Link>

          {order.status === "Pending" && order.onCancel && (
            <button 
              onClick={() => order.onCancel!(order.id)}
              className="bg-[#E23744]/10 hover:bg-[#E23744]/20 text-[#E23744] border border-[#E23744]/20 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              Cancel Order
            </button>
          )}

          {(order.status === "Delivered" || order.status === "Cancelled") && (
            <Link
              href="/order-online"
              className="bg-[#E23744] hover:bg-[#C81E32] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              <RefreshCw className="w-4 h-4" /> Reorder
            </Link>
          )}
        </div>
      </div>

      {/* Expandable Order Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 flex flex-col gap-8 border-t border-[#EAEAEA] pt-6 md:flex-row">
              
              {/* Items List */}
              <div className="flex-1">
                <h4 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#686B78]">
                  <Receipt className="w-4 h-4" /> Itemized Bill
                </h4>
                <div className="flex flex-col gap-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-[#686B78]">
                        <span className="mr-2 font-bold text-[#1C1C1C]">{item.qty}x</span> 
                        {item.name}
                      </span>
                      <span className="text-[#1C1C1C]">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="flex-1 rounded-2xl border border-[#EAEAEA] bg-[#F8F9FA] p-6">
                <div className="mb-4 flex flex-col gap-3 border-b border-[#EAEAEA] pb-4 text-sm text-[#686B78]">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="text-[#1C1C1C]">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxes & Fees</span>
                    <span className="text-[#1C1C1C]">₹{order.taxes}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center text-green-400">
                      <span>Discount applied</span>
                      <span>-₹{order.discount}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-[#1C1C1C]">Final Total</span>
                  <span className="text-xl font-black text-[#1C1C1C]">₹{order.total}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#686B78]">Payment Method</span>
                  <span className="font-bold text-[#686B78]">{order.paymentMethod}</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
