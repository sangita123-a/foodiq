"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

export default function RevenueChart() {
  const chartData = [
    { day: "Mon", height: "40%", amount: "₹12k" },
    { day: "Tue", height: "60%", amount: "₹18k" },
    { day: "Wed", height: "35%", amount: "₹10k" },
    { day: "Thu", height: "75%", amount: "₹22k" },
    { day: "Fri", height: "90%", amount: "₹28k" },
    { day: "Sat", height: "100%", amount: "₹32k" },
    { day: "Sun", height: "85%", amount: "₹26k" }
  ];

  return (
    <div className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Revenue Overview <BarChart3 className="w-5 h-5 text-primary" />
        </h2>
        
        <div className="flex gap-4">
          <div className="bg-[#111] px-4 py-2 rounded-lg border border-white/5">
            <p className="text-gray-500 text-xs font-bold uppercase">Total Revenue</p>
            <p className="text-white font-bold text-lg">₹1,48,000</p>
          </div>
          <div className="bg-[#111] px-4 py-2 rounded-lg border border-white/5">
            <p className="text-gray-500 text-xs font-bold uppercase">Avg Order</p>
            <p className="text-white font-bold text-lg">₹320</p>
          </div>
        </div>
      </div>

      <div className="h-64 mt-4 flex items-end justify-between gap-2 pb-6 border-b border-white/10 relative">
        {chartData.map((data, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-primary mb-2">
              {data.amount}
            </div>
            <motion.div 
              initial={{ height: 0 }}
              whileInView={{ height: data.height }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1, type: "spring", bounce: 0.2 }}
              className="w-full max-w-[40px] bg-primary/20 border border-primary/50 rounded-t-lg group-hover:bg-primary transition-colors cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
            </motion.div>
            <span className="text-gray-400 text-xs mt-3 font-bold">{data.day}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
