"use client";

import { SearchX, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HistoryEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-background rounded-3xl border border-border p-12 flex flex-col items-center justify-center text-center shadow-xl mb-8"
    >
      <div className="w-24 h-24 bg-section rounded-full flex items-center justify-center mb-6 border border-border relative">
        <SearchX className="w-10 h-10 text-[#9CA3AF]" />
        {/* Decorative elements */}
        <div className="absolute top-0 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-4 -left-4 w-6 h-6 bg-blue-500/20 rounded-full animate-pulse"></div>
      </div>
      
      <h3 className="text-2xl font-black text-foreground mb-3">No previous orders found.</h3>
      <p className="text-gray-text max-w-md mb-8 leading-relaxed">
        We couldn't find any historical orders matching your current filters. Try adjusting your search criteria or check your live queue.
      </p>

      <Link 
        href="/partner/orders"
        className="px-6 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 group"
      >
        Go to Incoming Orders 
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}
