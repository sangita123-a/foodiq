"use client";

import { motion } from "framer-motion";

export default function PartnerWelcome() {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-[#111827] mb-2">Welcome Back, Paradise Biryani! 👋</h1>
          <p className="text-[#6B7280]">Here's what's happening with your restaurant today.</p>
        </div>
        <div className="bg-[#FFFFFF] px-5 py-2.5 rounded-xl border border-[#E5E7EB] inline-flex self-start md:self-auto">
          <span className="text-sm font-bold text-[#6B7280]">{currentDate}</span>
        </div>
      </div>
    </motion.div>
  );
}
