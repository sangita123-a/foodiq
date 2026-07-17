"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ChevronRight, Clock } from "lucide-react";

export default function LiveOrders() {
  const orders = [
    { id: "#ORD-8924", customer: "Rahul Sharma", items: "2x Chicken Biryani, 1x Coke", amount: "₹850", time: "2 min ago" },
    { id: "#ORD-8925", customer: "Priya Patel", items: "1x Paneer Butter Masala, 2x Naan", amount: "₹420", time: "5 min ago" },
    { id: "#ORD-8926", customer: "Amit Kumar", items: "1x Mutton Rogan Josh", amount: "₹650", time: "12 min ago" }
  ];

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl h-full">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#111827]">Live Orders</h2>
          <span className="bg-red-500/20 text-[#FC8019] text-xs font-bold px-2 py-1 rounded-md animate-pulse">3 New</span>
        </div>
        <button className="text-sm font-bold text-[#6B7280] hover:text-[#111827] transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order, idx) => (
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
                  <span className="font-mono text-sm text-[#FC8019] font-bold">{order.id}</span>
                  <span className="text-xs text-[#9CA3AF] flex items-center gap-1"><Clock className="w-3 h-3" /> {order.time}</span>
                </div>
                <h4 className="text-[#111827] font-bold text-lg mb-1">{order.customer}</h4>
                <p className="text-[#6B7280] text-sm">{order.items}</p>
                <div className="mt-3 font-bold text-[#111827]">{order.amount}</div>
              </div>

              <div className="flex flex-col gap-2 justify-center sm:w-32">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Accept
                </button>
                <button className="w-full bg-[#F8FAFC] hover:bg-[#F8FAFC] text-[#111827] border border-[#E5E7EB] py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1">
                  <XCircle className="w-4 h-4 text-red-400" /> Reject
                </button>
              </div>

            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
}
