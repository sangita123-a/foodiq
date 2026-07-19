"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Order } from "@/components/partner/orders/types";
import { Eye, Download, Printer, RotateCw, MoreVertical } from "lucide-react";
import { useState } from "react";

interface HistoryTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

export default function HistoryTable({ orders, onViewDetails }: HistoryTableProps) {
  
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "Delivered": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Completed": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Refunded": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-gray-500/20 text-[#6B7280] border-[#E5E7EB]/30";
    }
  };

  return (
    <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xl mb-8">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC]">
              <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Order Info</th>
              <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Customer</th>
              <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Amount & Payment</th>
              <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {orders.map((order, idx) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  key={order.id} 
                  className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC] transition-colors group"
                >
                  
                  {/* Order Info */}
                  <td className="px-6 py-4">
                    <p className="text-[#111827] font-mono font-black">{order.id}</p>
                    <p className="text-[#6B7280] text-xs mt-1">{order.orderTime}</p>
                    <div className="text-[#9CA3AF] text-xs mt-2 line-clamp-1 max-w-[200px]">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-6 py-4">
                    <p className="text-[#111827] font-bold text-sm">{order.customerName}</p>
                    <p className="text-[#6B7280] text-xs mt-1">{order.customerPhone}</p>
                  </td>

                  {/* Amount & Payment */}
                  <td className="px-6 py-4">
                    <p className="text-[#111827] font-black">₹{order.grandTotal}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${order.paymentStatus === 'Paid' ? 'text-green-400' : 'text-[#E23744]'}`}>
                        {order.paymentStatus}
                      </span>
                      <span className="text-[#9CA3AF] text-xs">• {order.paymentMethod}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button 
                        onClick={() => onViewDetails(order)}
                        className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280] hover:text-[#E23744] hover:bg-[#E23744]/20 hover:border-[#E23744]/50 transition-colors tooltip-trigger relative"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button 
                        onClick={() => setActiveDropdown(activeDropdown === order.id ? null : order.id)}
                        className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {activeDropdown === order.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 top-12 w-48 bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl shadow-2xl overflow-hidden z-20 text-left"
                          >
                            <button className="w-full px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 border-b border-[#E5E7EB]">
                              <Download className="w-4 h-4 text-blue-400" /> Download Invoice
                            </button>
                            <button className="w-full px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2 border-b border-[#E5E7EB]">
                              <Printer className="w-4 h-4 text-[#6B7280]" /> Print Receipt
                            </button>
                            <button className="w-full px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] transition-colors flex items-center gap-2">
                              <RotateCw className="w-4 h-4 text-[#E23744]" /> Reorder Summary
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>

                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
