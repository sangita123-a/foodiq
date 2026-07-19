"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { LocationData } from "./types";

interface LocationInsightsProps {
  data: LocationData[];
}

export default function LocationInsights({ data }: LocationInsightsProps) {
  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-[#111827] flex items-center gap-2">
          <MapPin className="w-6 h-6 text-[#E23744]" /> Location Insights
        </h3>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 flex-1">
        
        {/* Heatmap Placeholder */}
        <div className="flex-1 min-h-[200px] bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] relative overflow-hidden group">
          {/* Abstract map pattern simulation */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent bg-[length:20px_20px]"></div>
          
          {/* Simulated heat spots */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/4 w-24 h-24 bg-red-500/40 blur-xl rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-[#E23744]/40 blur-xl rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-1/2 right-1/4 w-16 h-16 bg-yellow-500/40 blur-xl rounded-full"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-[#E23744] px-4 py-2 rounded-xl text-white font-bold text-sm">Interactive Map Coming Soon</span>
          </div>
        </div>

        {/* Top Areas List */}
        <div className="w-full xl:w-64 flex flex-col justify-center space-y-4">
          <h4 className="text-sm font-bold text-[#6B7280] uppercase tracking-wider mb-2">Top Delivery Areas</h4>
          {data.map((loc, idx) => (
            <motion.div 
              key={loc.area}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#111827] font-bold">{loc.area}</span>
                <span className="text-[#6B7280] font-bold">{loc.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${loc.percentage}%` }}
                  transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                  className="h-full bg-[#E23744] rounded-full"
                />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
