"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

const recommendations = [
  {
    id: "r1",
    name: "Mutton Dum Biryani",
    price: 449,
    image: "/images/catalog/food/biryani.webp",
  },
  {
    id: "r2",
    name: "Butter Chicken",
    price: 399,
    image: "/images/catalog/food/north-indian.webp",
  },
  {
    id: "r3",
    name: "Gulab Jamun (2 pcs)",
    price: 99,
    image: "/images/catalog/food/desserts.webp",
  },
  {
    id: "r4",
    name: "Mint Mojito",
    price: 129,
    image: "/images/catalog/food/beverages.webp",
  }
];

export default function RecommendedNextOrder() {
  return (
    <div className="mt-8 pt-8 border-t border-[#E5E7EB]">
      <h3 className="text-2xl font-bold text-white mb-6">Recommended for your next order</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-[#F8FAFC] rounded-2xl overflow-hidden border border-[#E5E7EB] hover:border-[#E5E7EB] group cursor-pointer shadow-lg"
          >
            <div className="h-32 w-full overflow-hidden">
              <SafeImage 
                src={item.image} 
                fallback={FOOD_FALLBACK}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h4 className="text-white font-bold text-sm mb-1 line-clamp-1">{item.name}</h4>
                <div className="text-[#6B7280] text-sm">₹{item.price}</div>
              </div>
              <button className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-white hover:bg-primary transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
