"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart2, Star, Target } from "lucide-react";
import { OffersAnalyticsData } from "./types";

interface OffersAnalyticsProps {
  data: OffersAnalyticsData;
}

export default function OffersAnalytics({ data }: OffersAnalyticsProps) {
  
  // Mock Data for the chart
  const weeklyData = [
    { day: "Mon", usage: 45, height: "45%" },
    { day: "Tue", usage: 52, height: "52%" },
    { day: "Wed", usage: 38, height: "38%" },
    { day: "Thu", usage: 65, height: "65%" },
    { day: "Fri", usage: 88, height: "88%" },
    { day: "Sat", usage: 110, height: "100%" }, // Peak
    { day: "Sun", usage: 95, height: "95%" }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      
      {/* Daily Usage Chart */}
      <div className="xl:col-span-2 bg-background rounded-3xl p-6 border border-border shadow-xl">
        <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-6">
          <BarChart2 className="w-5 h-5 text-primary" /> Daily Coupon Usage
        </h3>
        
        <div className="h-64 flex items-end justify-between gap-2 md:gap-6 pt-4 border-b border-border pb-4">
          {weeklyData.map((d, idx) => (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full group">
              <div className="text-transparent group-hover:text-foreground text-xs font-bold mb-2 transition-colors">
                {d.usage}
              </div>
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: d.height }}
                transition={{ duration: 1, delay: idx * 0.1, type: "spring" }}
                className={`w-full max-w-[40px] rounded-t-lg transition-colors ${d.height === '100%' ? 'bg-primary' : 'bg-section border-x border-t border-border group-hover:bg-section'}`}
              />
            </div>
          ))}
        </div>
        
        <div className="flex justify-between px-2 pt-4">
          {weeklyData.map(d => (
            <div key={d.day} className="flex-1 text-center text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">
              {d.day}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="bg-background rounded-3xl p-6 border border-border shadow-xl flex flex-col gap-4">
        <h3 className="text-xl font-black text-foreground mb-2">Performance Insights</h3>
        
        <div className="bg-section border border-border rounded-2xl p-4 flex items-center gap-4 group hover:border-border transition-colors">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:bg-green-500 group-hover:text-foreground transition-colors">
            <Star className="w-6 h-6 text-green-500 group-hover:text-foreground" />
          </div>
          <div>
            <p className="text-gray-text text-xs font-bold uppercase tracking-wider">Most Successful Campaign</p>
            <p className="text-foreground font-bold">Summer Weekend Blast</p>
          </div>
        </div>

        <div className="bg-section border border-border rounded-2xl p-4 flex items-center gap-4 group hover:border-border transition-colors">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-foreground transition-colors">
            <Target className="w-6 h-6 text-blue-500 group-hover:text-foreground" />
          </div>
          <div>
            <p className="text-gray-text text-xs font-bold uppercase tracking-wider">Top Performing Coupon</p>
            <p className="text-foreground font-bold text-lg">FLAT50</p>
          </div>
        </div>

        <div className="bg-section border border-border rounded-2xl p-4 flex items-center gap-4 group hover:border-border transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-foreground transition-colors">
            <TrendingUp className="w-6 h-6 text-purple-500 group-hover:text-foreground" />
          </div>
          <div>
            <p className="text-gray-text text-xs font-bold uppercase tracking-wider">Avg. Revenue / Promo</p>
            <p className="text-foreground font-bold">₹24,500</p>
          </div>
        </div>
      </div>

    </div>
  );
}
