"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, UserCheck, Heart } from "lucide-react";
import { CustomerInsightsData } from "./types";

interface CustomerInsightsProps {
  data: CustomerInsightsData;
}

export default function CustomerInsights({ data }: CustomerInsightsProps) {
  
  const total = 100;
  const newDash = (data.newPercentage / total) * 100;
  const returningDash = (data.returningPercentage / total) * 100;

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl flex flex-col h-full">
      <h3 className="text-xl font-black text-[#111827] flex items-center gap-2 mb-8">
        <Users className="w-6 h-6 text-pink-500" /> Customer Insights
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-8 mb-8 flex-1">
        
        {/* CSS Donut Chart */}
        <div className="relative w-40 h-40 shrink-0 group">
          <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
            {/* Returning (Background/Base) */}
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E5E7EB" strokeWidth="4"></circle>
            <motion.circle 
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${returningDash}, 100` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="18" cy="18" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="4" 
              className="drop-shadow-[0_0_4px_rgba(168,85,247,0.4)]"
            ></motion.circle>
            {/* New */}
            <motion.circle 
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray: `${newDash}, 100` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
              cx="18" cy="18" r="15.915" fill="transparent" stroke="#ec4899" strokeWidth="4" strokeDashoffset={`-${returningDash}`}
              className="drop-shadow-[0_0_4px_rgba(236,72,153,0.4)]"
            ></motion.circle>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-[#111827]">{data.returningPercentage}%</span>
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Returning</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                <UserPlus className="w-4 h-4 text-pink-500" />
              </div>
              <span className="text-sm font-bold text-[#6B7280]">New</span>
            </div>
            <span className="text-[#111827] font-black">{data.newPercentage}%</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <UserCheck className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm font-bold text-[#6B7280]">Returning</span>
            </div>
            <span className="text-[#111827] font-black">{data.returningPercentage}%</span>
          </div>
        </div>

      </div>

      <div className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6B7280] font-bold flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500"/> Satisfaction Rate</span>
            <span className="text-[#111827] font-black">{data.satisfaction}%</span>
          </div>
          <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E5E7EB]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data.satisfaction}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#6B7280] font-bold flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-blue-500"/> Repeat Order %</span>
            <span className="text-[#111827] font-black">{data.repeatPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#E5E7EB]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${data.repeatPercentage}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
            />
          </div>
        </div>
      </div>

    </div>
  );
}
