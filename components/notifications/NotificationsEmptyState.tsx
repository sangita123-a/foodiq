"use client";

import { motion } from "framer-motion";
import { BellOff, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NotificationsEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#F8FAFC] rounded-3xl p-12 flex flex-col items-center justify-center text-center border border-[#E5E7EB] min-h-[500px]"
    >
      <div className="w-24 h-24 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-6 relative">
        <BellOff className="w-10 h-10 text-[#6B7280]" />
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-3">You're all caught up!</h3>
      <p className="text-[#6B7280] max-w-sm mb-8">
        No new notifications at the moment. We'll alert you here when you receive offers, order updates, or reward points.
      </p>

      <Link 
        href="/"
        className="bg-primary hover:bg-[#C81E34] text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(226, 55, 68,0.3)] hover:-translate-y-1 inline-flex items-center gap-2"
      >
        Explore Restaurants
        <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}
