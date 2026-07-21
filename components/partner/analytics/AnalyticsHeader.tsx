"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function AnalyticsHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 text-sm text-[#9CA3AF] font-bold uppercase tracking-wider mb-4">
        <Link href="/partner/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Analytics</span>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 flex items-center gap-3">
        📊 Analytics Dashboard
      </h1>
      <p className="text-gray-text">
        Monitor your restaurant's performance with real-time insights and business analytics.
      </p>
    </motion.div>
  );
}
