"use client";

import { TrendingUp } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { formatCurrency } from "@/services/partnerApi";

type PopularItem = {
  name: string;
  orders: number;
  revenue: number | string;
  image?: string;
};

type PopularItemsProps = {
  items?: PopularItem[];
};

export default function PopularItems({ items = [] }: PopularItemsProps) {
  const display = items.slice(0, 5);

  return (
    <div className="bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-xl h-full">
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2">
          Popular Items <TrendingUp className="w-5 h-5 text-green-400" />
        </h2>
      </div>

      <div className="space-y-4">
        {display.length === 0 && (
          <p className="text-[#6B7280] text-sm py-6 text-center">No sales data yet.</p>
        )}
        {display.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E5E7EB] group hover:border-[#E5E7EB] transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <SafeImage src={item.image || FOOD_FALLBACK} fallback={FOOD_FALLBACK} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[#111827] font-bold text-sm truncate">{item.name}</h4>
              <p className="text-[#6B7280] text-xs mt-1">{item.orders} Orders</p>
            </div>
            <div className="text-right pr-2">
              <p className="text-green-400 font-bold">
                {typeof item.revenue === "number" ? formatCurrency(item.revenue) : item.revenue}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
