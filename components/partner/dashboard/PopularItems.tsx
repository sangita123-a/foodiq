"use client";

import { TrendingUp } from "lucide-react";

export default function PopularItems() {
  const items = [
    { name: "Hyderabadi Chicken Dum Biryani", orders: 48, revenue: "₹14,400", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=200" },
    { name: "Paneer Butter Masala", orders: 32, revenue: "₹8,000", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=200" },
    { name: "Garlic Naan", orders: 124, revenue: "₹6,200", image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&q=80&w=200" }
  ];

  return (
    <div className="bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 shadow-xl h-full">
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Popular Items <TrendingUp className="w-5 h-5 text-green-400" />
        </h2>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 bg-[#111] p-3 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors cursor-pointer">
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-sm truncate">{item.name}</h4>
              <p className="text-gray-400 text-xs mt-1">{item.orders} Orders Today</p>
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
