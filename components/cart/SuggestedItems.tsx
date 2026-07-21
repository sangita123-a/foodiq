"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

const suggestedItems = [
  {
    id: "s1",
    name: "Extra Mint Chutney",
    price: 15,
    image: "/images/catalog/food/indian.webp",
  },
  {
    id: "s2",
    name: "Thums Up (250ml)",
    price: 40,
    image: "/images/catalog/food/beverages.webp",
  },
  {
    id: "s3",
    name: "Chocolate Brownie",
    price: 110,
    image: "/images/catalog/food/desserts.webp",
  },
  {
    id: "s4",
    name: "Garlic Breadsticks",
    price: 99,
    image: "/images/catalog/food/bakery.webp",
  }
];

export default function SuggestedItems() {
  return (
    <div className="mt-16 pt-12 border-t border-border">
      <h3 className="text-2xl font-bold text-white mb-6">You May Also Like</h3>
      
      <div className="food-grid">
        {suggestedItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="food-card p-3 flex items-center gap-3 group"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white">
              <SafeImage 
                src={item.image} 
                fallback={FOOD_FALLBACK}
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            <div className="flex-1">
              <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">{item.name}</h4>
              <div className="text-[#A1A1A1] font-bold text-sm">₹{item.price}</div>
            </div>
            
            <button className="w-8 h-8 rounded-full bg-section flex items-center justify-center text-white hover:bg-primary transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
