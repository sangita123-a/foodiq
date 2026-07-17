"use client";

import { TrendingUp } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

export default function PopularItems() {
  const items = [
    { name: "Hyderabadi Chicken Dum Biryani", orders: 48, revenue: "₹14,400", image: "/images/catalog/food/biryani.webp" },
    { name: "Paneer Butter Masala", orders: 32, revenue: "₹8,000", image: "/images/catalog/food/north-indian.webp" },
    { name: "Garlic Naan", orders: 124, revenue: "₹6,200", image: "/images/catalog/food/bakery.webp" }
  ];

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl h-full">
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
          Popular Items <TrendingUp className="w-5 h-5 text-green-400" />
        </h2>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E5E7EB] group hover:border-[#E5E7EB] transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <SafeImage src={item.image} fallback={FOOD_FALLBACK} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[#111827] font-bold text-sm truncate">{item.name}</h4>
              <p className="text-[#6B7280] text-xs mt-1">{item.orders} Orders Today</p>
            </div>
            <div className="text-right pr-2">
              <p className="text-green-400 font-bold">{item.revenue}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
