"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

type BestSeller = {
  name: string;
  orders: number;
  revenue: string;
  image: string;
};

type MenuBestSellersProps = {
  bestSellers?: BestSeller[];
};

export default function MenuBestSellers({ bestSellers = [] }: MenuBestSellersProps) {

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        All-Time Best Sellers <TrendingUp className="w-5 h-5 text-primary" />
      </h2>

      <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {bestSellers.length === 0 && (
          <p className="text-gray-text text-sm py-4">No best sellers yet.</p>
        )}
        {bestSellers.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="min-w-[280px] bg-background rounded-2xl border border-border overflow-hidden group hover:border-border transition-colors cursor-pointer"
          >
            <div className="h-32 w-full overflow-hidden relative">
              <SafeImage
                src={item.image}
                fallback={FOOD_FALLBACK}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/80 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-white font-bold text-lg truncate">{item.name}</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[#9CA3AF] text-xs font-bold uppercase mb-1">Orders</p>
                <p className="text-gray-text font-bold">{item.orders}</p>
              </div>
              <div className="text-right">
                <p className="text-[#9CA3AF] text-xs font-bold uppercase mb-1">Revenue</p>
                <p className="text-green-400 font-bold">{item.revenue}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
