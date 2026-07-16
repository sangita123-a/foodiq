"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, Receipt, Star, Navigation, RefreshCw, Download } from "lucide-react";
import { OrderFilter } from "./OrderFilterTabs";
import Link from "next/link";

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
      className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 hover:border-white/10 transition-all duration-300 shadow-lg group mb-6"
    >
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
        
        {/* Resto Info */}
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden flex-shrink-0">
            <img src={order.image} alt={order.restaurant} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{order.restaurant}</h3>
            <p className="text-[#A1A1A1] text-sm mb-2">{order.date} • {order.id}</p>
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
          <p className="text-gray-400 text-sm mb-1">Total Amount</p>
          <p className="text-2xl font-black text-white">₹{order.total}</p>
        </div>

      </div>

      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6 pb-6 border-b border-white/10">
        <MapPin className="w-4 h-4" />
        <span className="line-clamp-1">{order.address}</span>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-300 hover:text-white font-bold text-sm flex items-center gap-2 transition-colors"
        >
          View Details
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </button>

        <Link href={`/my-orders/${order.id}`}>
          <button className="text-primary hover:text-white font-bold text-sm transition-colors">
            Full Details →
          </button>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          {(order.status === "Preparing" || order.status === "On the Way" || order.status === "Accepted" || order.status === "Ready for pickup" || order.status === "Picked up") && (
            <Link href={`/track-order?id=${order.id}`}>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Navigation className="w-4 h-4" /> Track Order
              </button>
            </Link>
          )}

          {order.status === "Delivered" && (
            <Link href={`/my-orders/${order.id}`}>
              <button className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-500 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                <Star className="w-4 h-4 fill-yellow-500" /> Rate Restaurant
              </button>
            </Link>
          )}

          <Link href={`/my-orders/${order.id}`}>
            <button className="bg-white/5 hover:bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" /> Invoice
            </button>
          </Link>

          {order.status === "Pending" && order.onCancel && (
            <button 
              onClick={() => order.onCancel!(order.id)}
              className="bg-[#FF2D3B]/10 hover:bg-[#FF2D3B]/20 text-[#FF2D3B] border border-[#FF2D3B]/20 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              Cancel Order
            </button>
          )}

          {(order.status === "Delivered" || order.status === "Cancelled") && (
            <Link href="/restaurants">
              <button className="bg-[#FF2D3B] hover:bg-[#e02633] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,45,59,0.3)]">
                <RefreshCw className="w-4 h-4" /> Reorder
              </button>
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
            <div className="pt-6 mt-6 border-t border-white/5 flex flex-col md:flex-row gap-8">
              
              {/* Items List */}
              <div className="flex-1">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Itemized Bill
                </h4>
                <div className="flex flex-col gap-3">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-300">
                        <span className="text-white font-bold mr-2">{item.qty}x</span> 
                        {item.name}
                      </span>
                      <span className="text-white">₹{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="flex-1 bg-[#111] rounded-2xl p-6 border border-white/5">
                <div className="flex flex-col gap-3 text-sm text-gray-400 mb-4 pb-4 border-b border-white/10">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="text-white">₹{order.subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Taxes & Fees</span>
                    <span className="text-white">₹{order.taxes}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center text-green-400">
                      <span>Discount applied</span>
                      <span>-₹{order.discount}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-bold">Final Total</span>
                  <span className="text-xl font-black text-white">₹{order.total}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Payment Method</span>
                  <span className="text-gray-300 font-bold">{order.paymentMethod}</span>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
