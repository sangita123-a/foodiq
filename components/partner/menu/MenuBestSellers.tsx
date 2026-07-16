"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function MenuBestSellers() {
  const bestSellers = [
    { name: "Chicken Dum Biryani", orders: 1245, revenue: "₹3,73,500", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=300" },
    { name: "Mutton Rogan Josh", orders: 890, revenue: "₹4,00,500", image: "https://images.unsplash.com/photo-1544025162-811114215b01?auto=format&fit=crop&q=80&w=300" },
    { name: "Paneer Butter Masala", orders: 1102, revenue: "₹2,75,500", image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=300" },
    { name: "Garlic Naan", orders: 3450, revenue: "₹1,72,500", image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?auto=format&fit=crop&q=80&w=300" },
  ];

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
        All-Time Best Sellers <TrendingUp className="w-5 h-5 text-primary" />
      </h2>
      
      <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
        {bestSellers.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="min-w-[280px] bg-[#171717] rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors cursor-pointer"
          >
            <div className="h-32 w-full overflow-hidden relative">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-white font-bold text-lg truncate">{item.name}</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Orders</p>
                <p className="text-gray-300 font-bold">{item.orders}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs font-bold uppercase mb-1">Revenue</p>
                <p className="text-green-400 font-bold">{item.revenue}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
