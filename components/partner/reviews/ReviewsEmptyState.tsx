"use client";

import { MessageSquareOff, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ReviewsEmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#171717] rounded-3xl border border-white/5 p-12 flex flex-col items-center justify-center text-center shadow-xl mb-8"
    >
      <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 relative">
        <MessageSquareOff className="w-10 h-10 text-gray-500" />
        {/* Decorative elements */}
        <div className="absolute top-0 -right-2 w-4 h-4 bg-primary/20 rounded-full animate-ping"></div>
        <div className="absolute bottom-4 -left-4 w-6 h-6 bg-yellow-500/20 rounded-full animate-pulse"></div>
      </div>
      
      <h3 className="text-2xl font-black text-white mb-3">No customer reviews yet.</h3>
      <p className="text-gray-400 max-w-md mb-8 leading-relaxed">
        It looks like you don't have any reviews matching your current filters. As customers start rating your dishes, their feedback will appear here.
      </p>

      <Link 
        href="/partner/dashboard"
        className="px-6 py-3 bg-[#111] hover:bg-white/10 text-white rounded-xl font-bold flex items-center gap-2 transition-colors border border-white/10 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </Link>
    </motion.div>
  );
}
