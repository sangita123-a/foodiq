"use client";

import { SearchX, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HistoryEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB] p-12 flex flex-col items-center justify-center text-center shadow-xl mb-8"
    >
      <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6 border border-[#E5E7EB] relative">
        <SearchX className="w-10 h-10 text-[#9CA3AF]" />
        {/* Decorative elements */}
        <div className="absolute top-0 -right-2 w-4 h-4 bg-[#E23744]/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-4 -left-4 w-6 h-6 bg-blue-500/20 rounded-full animate-pulse"></div>
      </div>
      
      <h3 className="text-2xl font-black text-[#111827] mb-3">No previous orders found.</h3>
      <p className="text-[#6B7280] max-w-md mb-8 leading-relaxed">
        We couldn't find any historical orders matching your current filters. Try adjusting your search criteria or check your live queue.
      </p>

      <Link 
        href="/partner/orders"
        className="px-6 py-3 bg-[#E23744] hover:bg-[#C81E34] text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#E23744]/20 group"
      >
        Go to Incoming Orders 
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}
