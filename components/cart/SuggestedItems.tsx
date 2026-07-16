"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";

const suggestedItems = [
  {
    id: "s1",
    name: "Extra Mint Chutney",
    price: 15,
    image: "https://images.unsplash.com/photo-1606214306037-ea7693998f46?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "s2",
    name: "Thums Up (250ml)",
    price: 40,
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "s3",
    name: "Chocolate Brownie",
    price: 110,
    image: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "s4",
    name: "Garlic Breadsticks",
    price: 99,
    image: "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=200",
  }
];

export default function SuggestedItems() {
  return (
    <div className="mt-16 pt-12 border-t border-white/5">
      <h3 className="text-2xl font-bold text-white mb-6">You May Also Like</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {suggestedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-[#171717] rounded-2xl p-4 border border-white/5 hover:border-white/10 flex items-center gap-4 group"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            <div className="flex-1">
              <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">{item.name}</h4>
              <div className="text-[#A1A1A1] font-bold text-sm">₹{item.price}</div>
            </div>
            
            <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[#FF2D3B] transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
