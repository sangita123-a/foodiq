"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { formatCurrency } from "@/services/partnerApi";

type ChartPoint = { day: string; height: string; amount: string };

type RevenueChartProps = {
  chartData?: ChartPoint[];
  totalRevenue?: number;
  avgOrder?: number;
};

export default function RevenueChart({
  chartData,
  totalRevenue = 0,
  avgOrder = 0,
}: RevenueChartProps) {
  const data =
    chartData && chartData.length > 0
      ? chartData
      : [
          { day: "Mon", height: "10%", amount: "₹0" },
          { day: "Tue", height: "10%", amount: "₹0" },
          { day: "Wed", height: "10%", amount: "₹0" },
          { day: "Thu", height: "10%", amount: "₹0" },
          { day: "Fri", height: "10%", amount: "₹0" },
          { day: "Sat", height: "10%", amount: "₹0" },
          { day: "Sun", height: "10%", amount: "₹0" },
        ];

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
          Revenue Overview <BarChart3 className="w-5 h-5 text-[#FC8019]" />
        </h2>
        
        <div className="flex gap-4">
          <div className="bg-[#F8FAFC] px-4 py-2 rounded-lg border border-[#E5E7EB]">
            <p className="text-[#9CA3AF] text-xs font-bold uppercase">Total Revenue</p>
            <p className="text-[#111827] font-bold text-lg">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-[#F8FAFC] px-4 py-2 rounded-lg border border-[#E5E7EB]">
            <p className="text-[#9CA3AF] text-xs font-bold uppercase">Avg Order</p>
            <p className="text-[#111827] font-bold text-lg">{formatCurrency(avgOrder)}</p>
          </div>
        </div>
      </div>

      <div className="h-64 mt-4 flex items-end justify-between gap-2 pb-6 border-b border-[#E5E7EB] relative">
        {data.map((point, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-[#FC8019] mb-2">
              {point.amount}
            </div>
            <motion.div 
              initial={{ height: 0 }}
              whileInView={{ height: point.height }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: idx * 0.1, type: "spring", bounce: 0.2 }}
              className="w-full max-w-[40px] bg-[#FC8019]/20 border border-[#FC8019]/50 rounded-t-lg group-hover:bg-[#FC8019] transition-colors cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
            </motion.div>
            <span className="text-[#6B7280] text-xs mt-3 font-bold">{point.day}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
