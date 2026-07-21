"use client";

import { motion } from "framer-motion";
import { Utensils, TrendingUp, TrendingDown, DollarSign, Zap } from "lucide-react";
import { FullAnalyticsData, MenuPerformanceItem } from "./types";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

interface MenuPerformanceProps {
  data: FullAnalyticsData["menu"];
}

function MenuCard({ item, title, icon: Icon, colorClass, gradientClass, delay }: { item: MenuPerformanceItem, title: string, icon: any, colorClass: string, gradientClass: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="relative h-48 rounded-3xl overflow-hidden group cursor-default shadow-lg"
    >
      <SafeImage src={item.image} fallback={FOOD_FALLBACK} alt={item.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      <div className={`absolute inset-0 bg-gradient-to-t ${gradientClass} to-transparent opacity-80 group-hover:opacity-90 transition-opacity`}></div>
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} to-transparent opacity-50`}></div>

      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="bg-black/50 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#E5E7EB] flex items-center gap-1.5">
            <Icon className={`w-3 h-3 ${colorClass}`} /> {title}
          </span>
        </div>

        <div>
          <h4 className="text-xl font-black text-white mb-1 line-clamp-1 group-hover:-translate-y-1 transition-transform">{item.name}</h4>
          <p className="text-white text-sm font-bold bg-black/30 w-max px-2 py-1 rounded backdrop-blur-sm border border-[#E5E7EB] group-hover:-translate-y-1 transition-transform delay-75">
            <span className="text-[10px] uppercase tracking-wider text-white/80 mr-1">{item.metricLabel}:</span>
            <span className={colorClass}>{item.metricValue}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function MenuPerformance({ data }: MenuPerformanceProps) {
  const topSeller = data.topSelling[0] ?? data.highestRevenue;
  const needsAttention = data.leastOrdered[0] ?? data.fastestPrep;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-[#111827] flex items-center gap-2">
          <Utensils className="w-6 h-6 text-[#E23744]" /> Menu Performance
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MenuCard
          item={topSeller}
          title="Top Seller"
          icon={TrendingUp}
          colorClass="text-green-400"
          gradientClass="from-green-900/90"
          delay={0}
        />
        <MenuCard
          item={data.highestRevenue}
          title="Highest Revenue"
          icon={DollarSign}
          colorClass="text-yellow-400"
          gradientClass="from-yellow-900/90"
          delay={0.1}
        />
        <MenuCard
          item={data.fastestPrep}
          title="Fastest Prep"
          icon={Zap}
          colorClass="text-cyan-400"
          gradientClass="from-cyan-900/90"
          delay={0.2}
        />
        <MenuCard
          item={needsAttention}
          title="Needs Attention"
          icon={TrendingDown}
          colorClass="text-red-400"
          gradientClass="from-red-900/90"
          delay={0.3}
        />
      </div>
    </div>
  );
}
