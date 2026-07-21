"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function OffersHeader() {
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
        <span className="hover:text-foreground transition-colors cursor-default">Marketing</span>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Offers & Discounts</span>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2 flex items-center gap-3">
        🎟️ Offers & Discounts
      </h1>
      <p className="text-gray-text">
        Create, manage, and track promotional campaigns to increase orders.
      </p>
    </motion.div>
  );
}
