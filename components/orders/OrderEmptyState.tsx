"use client";

import { motion } from "framer-motion";
import { Utensils, Search } from "lucide-react";
import Link from "next/link";

export default function OrderEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#171717] rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-white/5 min-h-[400px]"
    >
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
        <Utensils className="w-10 h-10 text-gray-400" />
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center border-4 border-[#171717]">
          <Search className="w-4 h-4 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">No orders found</h3>
      <p className="text-gray-400 max-w-sm mb-8">
        Looks like you haven't placed any orders in this category yet. Explore restaurants and place your first order!
      </p>

      <Link 
        href="/"
        className="bg-primary hover:bg-[#e02633] text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)] hover:-translate-y-1 block"
      >
        Explore Restaurants
      </Link>
    </motion.div>
  );
}
