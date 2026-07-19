"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import { FullAnalyticsData } from "./types";

interface RevenueAnalyticsProps {
  data: FullAnalyticsData["revenue"];
}

type ViewType = "daily" | "weekly" | "monthly" | "yearly";

export default function RevenueAnalytics({ data }: RevenueAnalyticsProps) {
  
  const [view, setView] = useState<ViewType>("weekly");

  const currentData = data[view];

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl mb-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-black text-[#111827] flex items-center gap-2 mb-1">
            <BarChart3 className="w-6 h-6 text-[#E23744]" /> Revenue Analytics
          </h3>
          <p className="text-[#6B7280] text-sm">Visualize your income streams over time.</p>
        </div>

        <div className="flex bg-[#F8FAFC] p-1 rounded-xl border border-[#E5E7EB] self-start">
          {(["daily", "weekly", "monthly", "yearly"] as ViewType[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors relative z-10 ${view === v ? 'text-[#111827]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}
            >
              {view === v && (
                <motion.div 
                  layoutId="revenueTab"
                  className="absolute inset-0 bg-[#F8FAFC] rounded-lg -z-10 border border-[#E5E7EB]"
                />
              )}
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full mt-4 flex items-end justify-between gap-2 md:gap-4 relative pt-10 border-b border-[#E5E7EB] pb-4">
        
        {/* Y-Axis lines (Simulated) */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
          <div className="w-full border-t border-[#E5E7EB] flex items-start"><span className="text-[10px] text-[#9CA3AF] -mt-2.5 bg-[#FFFFFF] pr-2">100%</span></div>
          <div className="w-full border-t border-[#E5E7EB] flex items-start"><span className="text-[10px] text-[#9CA3AF] -mt-2.5 bg-[#FFFFFF] pr-2">75%</span></div>
          <div className="w-full border-t border-[#E5E7EB] flex items-start"><span className="text-[10px] text-[#9CA3AF] -mt-2.5 bg-[#FFFFFF] pr-2">50%</span></div>
          <div className="w-full border-t border-[#E5E7EB] flex items-start"><span className="text-[10px] text-[#9CA3AF] -mt-2.5 bg-[#FFFFFF] pr-2">25%</span></div>
          <div className="w-full"></div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div 
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full flex items-end justify-between gap-1 md:gap-4 ml-8 relative z-10"
          >
            {currentData.map((d, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#FFFFFF] text-[#111827] text-xs font-bold px-2 py-1 rounded mb-2 whitespace-nowrap border border-[#E5E7EB]">
                  ₹{d.value.toLocaleString()}
                </div>
                
                {/* Bar */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: d.height }}
                  transition={{ duration: 0.8, delay: idx * 0.05, type: "spring", bounce: 0.2 }}
                  className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-[#E23744]/40 to-[#E23744] border-x border-t border-[#E23744]/50 group-hover:from-[#E23744]/60 group-hover:to-red-400 transition-colors relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </motion.div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

      </div>
      
      {/* X-Axis Labels */}
      <div className="flex justify-between ml-8 px-2 pt-4">
        {currentData.map((d, idx) => (
          <div key={idx} className="flex-1 text-center text-[10px] md:text-xs font-bold text-[#9CA3AF] uppercase tracking-wider truncate">
            {d.label}
          </div>
        ))}
      </div>

    </div>
  );
}
