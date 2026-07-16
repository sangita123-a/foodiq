"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

const recommendations = [
  {
    id: "r1",
    name: "Mutton Dum Biryani",
    price: 449,
    image: "https://images.unsplash.com/photo-1589302168068-964664d93cb0?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "r2",
    name: "Butter Chicken",
    price: 399,
    image: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "r3",
    name: "Gulab Jamun (2 pcs)",
    price: 99,
    image: "https://images.unsplash.com/photo-1598971701140-192fde1e2a51?auto=format&fit=crop&q=80&w=300",
  },
  {
    id: "r4",
    name: "Mint Mojito",
    price: 129,
    image: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&q=80&w=300",
  }
];

export default function RecommendedNextOrder() {
  return (
    <div className="mt-8 pt-8 border-t border-white/5">
      <h3 className="text-2xl font-bold text-white mb-6">Recommended for your next order</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-[#171717] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 group cursor-pointer shadow-lg"
          >
            <div className="h-32 w-full overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
                <div className="text-gray-400 text-sm">₹{item.price}</div>
              </div>
              <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
