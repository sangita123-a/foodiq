"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Clock, Flame } from "lucide-react";

export default function HistoryAnalytics() {
  
  // Mock Data for the chart
  const weeklyData = [
    { day: "Mon", orders: 45, height: "45%" },
    { day: "Tue", orders: 52, height: "52%" },
    { day: "Wed", orders: 38, height: "38%" },
    { day: "Thu", orders: 65, height: "65%" },
    { day: "Fri", orders: 88, height: "88%" },
    { day: "Sat", orders: 110, height: "100%" }, // Peak
    { day: "Sun", orders: 95, height: "95%" }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Daily Order Trend Chart */}
      <div className="xl:col-span-2 bg-[#FFFFFF] rounded-3xl p-6 border border-[#E5E7EB] shadow-xl">
        <h3 className="text-xl font-black text-[#111827] flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-[#E23744]" /> Daily Order Trend
        </h3>
        
        <div className="h-64 flex items-end justify-between gap-2 md:gap-6 pt-4 border-b border-[#E5E7EB] pb-4">
          {weeklyData.map((data, idx) => (
            <div key={data.day} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="text-transparent group-hover:text-[#111827] text-xs font-bold mb-2 transition-colors">
                {data.orders}
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: data.height }}
                transition={{ duration: 1, delay: idx * 0.1, type: "spring" }}
                className={`w-full max-w-[40px] rounded-t-lg transition-colors ${data.height === '100%' ? 'bg-[#E23744]' : 'bg-[#F8FAFC] border-x border-t border-[#E5E7EB] group-hover:bg-[#F8FAFC]'}`}
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between px-2 pt-4">
          {weeklyData.map(data => (
            <div key={data.day} className="flex-1 text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
              {data.day}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#E5E7EB] shadow-xl flex flex-col gap-4">
        <h3 className="text-xl font-black text-[#111827] mb-2">Key Insights</h3>
        
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 flex items-center gap-4 group hover:border-[#E5E7EB] transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#E23744]/10 flex items-center justify-center border border-[#E23744]/20 group-hover:bg-[#E23744] group-hover:text-[#111827] transition-colors">
            <Flame className="w-6 h-6 text-[#E23744] group-hover:text-[#111827]" />
          </div>
          <div>
            <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider">Top Selling Dish</p>
            <p className="text-[#111827] font-bold">Hyderabadi Dum Biryani</p>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 flex items-center gap-4 group hover:border-[#E5E7EB] transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-[#111827] transition-colors">
            <Users className="w-6 h-6 text-blue-500 group-hover:text-[#111827]" />
          </div>
          <div>
            <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider">Most Active Area</p>
            <p className="text-[#111827] font-bold">Koramangala 4th Block</p>
          </div>
        </div>

        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 flex items-center gap-4 group hover:border-[#E5E7EB] transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-[#111827] transition-colors">
            <Clock className="w-6 h-6 text-purple-500 group-hover:text-[#111827]" />
          </div>
          <div>
            <p className="text-[#6B7280] text-xs font-bold uppercase tracking-wider">Peak Order Time</p>
            <p className="text-[#111827] font-bold">8:00 PM - 10:00 PM</p>
          </div>
        </div>
      </div>

    </div>
  );
}
