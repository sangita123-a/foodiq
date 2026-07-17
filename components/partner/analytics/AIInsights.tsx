"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Star, Clock, Utensils } from "lucide-react";

interface AIInsightsProps {
  insights: string[];
}

export default function AIInsights({ insights }: AIInsightsProps) {
  
  // Mapping insights to icons purely for visual flair based on mock text
  const getIcon = (text: string) => {
    if (text.toLowerCase().includes("revenue")) return <TrendingUp className="w-5 h-5 text-green-400" />;
    if (text.toLowerCase().includes("rating") || text.toLowerCase().includes("customer")) return <Star className="w-5 h-5 text-yellow-400" />;
    if (text.toLowerCase().includes("time")) return <Clock className="w-5 h-5 text-blue-400" />;
    return <Utensils className="w-5 h-5 text-orange-400" />;
  };

  return (
    <div className="bg-gradient-to-br from-[#FFFFFF] to-[#FC8019]/5 rounded-3xl p-6 md:p-8 border border-[#FC8019]/20 shadow-[0_0_30px_rgba(252,128,25,0.05)] mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#FC8019]/20 flex items-center justify-center border border-[#FC8019]/30">
          <Sparkles className="w-5 h-5 text-[#FC8019]" />
        </div>
        <div>
          <h3 className="text-xl font-black text-[#111827]">AI Business Insights</h3>
          <p className="text-[#FC8019] text-xs font-bold uppercase tracking-wider">Generated from your real-time data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 hover:border-[#FC8019]/30 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              {getIcon(insight)}
            </div>
            <p className="text-[#6B7280] text-sm font-bold leading-relaxed">
              {insight}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
