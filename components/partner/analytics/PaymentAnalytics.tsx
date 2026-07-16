"use client";

import { motion } from "framer-motion";
import { WalletCards } from "lucide-react";
import { PaymentDataPoint } from "./types";

interface PaymentAnalyticsProps {
  data: PaymentDataPoint[];
}

export default function PaymentAnalytics({ data }: PaymentAnalyticsProps) {
  
  // Calculate SVG stroke-dasharray segments for donut chart.
  // Cumulative offsets are derived without mutation during render.
  const segments = data.map((item, idx) => {
    const cumulativePercent = data
      .slice(0, idx)
      .reduce((sum, prev) => sum + prev.percentage, 0);
    const dashArray = `${item.percentage} ${100 - item.percentage}`;
    const dashOffset = 100 - cumulativePercent;
    return { ...item, dashArray, dashOffset: -dashOffset + 100 };
  });

  return (
    <div className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl flex flex-col h-full">
      <h3 className="text-xl font-black text-white flex items-center gap-2 mb-8">
        <WalletCards className="w-6 h-6 text-green-500" /> Payment Methods
      </h3>

      <div className="flex flex-col xl:flex-row items-center gap-8 flex-1">
        
        {/* CSS Donut Chart */}
        <div className="relative w-48 h-48 shrink-0">
          <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
            {segments.map((segment, idx) => (
              <motion.circle
                key={segment.method}
                initial={{ strokeDasharray: `0 100` }}
                animate={{ strokeDasharray: segment.dashArray }}
                transition={{ duration: 1.5, delay: idx * 0.2, ease: "easeOut" }}
                cx="16" cy="16" r="15.915"
                fill="transparent"
                stroke={segment.color}
                strokeWidth="6"
                strokeDashoffset={segment.dashOffset}
                className="drop-shadow-lg"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Top Method</span>
            <span className="text-white font-black text-sm">{data[0].method}</span>
          </div>
        </div>

        {/* Legend / Stats */}
        <div className="flex-1 w-full space-y-3">
          {data.map((item, idx) => (
            <motion.div 
              key={item.method}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#111] border border-white/5 group hover:border-white/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}></div>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{item.method}</span>
              </div>
              <span className="text-white font-black">{item.percentage}%</span>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
