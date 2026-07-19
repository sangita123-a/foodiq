"use client";

import { motion } from "framer-motion";
import { Flame, Zap, Gift } from "lucide-react";

const trendingItems = [
  {
    id: 1,
    title: "Most Ordered",
    subtitle: "Local favorites",
    icon: Flame,
    color: "from-[#FFF5F6] to-white",
    iconColor: "text-[#E23744]",
  },
  {
    id: 2,
    title: "Fast Delivery",
    subtitle: "Under 30 mins",
    icon: Zap,
    color: "from-[#FFF5F6] to-white",
    iconColor: "text-[#E23744]",
  },
  {
    id: 3,
    title: "Best Offers",
    subtitle: "Up to 50% off",
    icon: Gift,
    color: "from-[#FFF5F6] to-white",
    iconColor: "text-[#E23744]",
  }
];

export default function TrendingSection() {
  return (
    <div className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">Trending Near You</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {trendingItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className={`bg-gradient-to-br ${item.color} border border-[#E5E7EB] rounded-2xl p-6 flex items-center gap-5 cursor-pointer`}
          >
            <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 ${item.iconColor}`}>
              <item.icon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#111827] mb-1">{item.title}</h3>
              <p className="text-[var(--color-gray-text)] text-sm">{item.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
