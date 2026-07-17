"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoryHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 text-sm text-[#9CA3AF] font-bold uppercase tracking-wider mb-4">
        <Link href="/partner/dashboard" className="hover:text-[#FC8019] transition-colors">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="hover:text-[#111827] transition-colors cursor-default">Orders</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-[#111827]">Order History</span>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-black text-[#111827] mb-2 flex items-center gap-3">
        📋 Order History
      </h1>
      <p className="text-[#6B7280]">
        View, search, and manage all completed, cancelled, and past customer orders.
      </p>
    </motion.div>
  );
}
