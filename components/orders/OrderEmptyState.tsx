"use client";

import { motion } from "framer-motion";
import { Utensils, Search } from "lucide-react";
import Link from "next/link";

export default function OrderEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#F8FAFC] rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-[#E5E7EB] min-h-[400px]"
    >
      <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6 relative">
        <Utensils className="w-10 h-10 text-[#6B7280]" />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-[#F8FAFC]">
          <Search className="w-4 h-4 text-[#111827]" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">No orders found</h3>
      <p className="text-[#6B7280] max-w-sm mb-8">
        Looks like you haven't placed any orders in this category yet. Explore restaurants and place your first order!
      </p>

      <Link 
        href="/"
        className="bg-primary hover:bg-[#C81E34] text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(226, 55, 68,0.3)] hover:-translate-y-1 block"
      >
        Explore Restaurants
      </Link>
    </motion.div>
  );
}
