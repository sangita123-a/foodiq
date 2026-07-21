/** @architecture UNUSED — not imported by any route. Safe to ignore. */
"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";

type RecommendationItem = {
  id: number | string;
  name: string;
  restaurant: string;
  price: string;
  image: string;
};

export default function FoodRecommendation() {
  const { data: menuItems, isLoading } = useSWR("/api/menu-items?limit=4");

  const items: RecommendationItem[] = (menuItems || []).slice(0, 4).map((item: any, index: number) => ({
    id: item.id || index,
    name: item.name,
    restaurant: item.restaurant_name || "Foodiq Kitchen",
    price: `₹${item.discount_price || item.price}`,
    image: getFoodImage(item.image_url),
  }));

  return (
    <div className="mb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recommended For You</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-56 bg-section rounded-2xl animate-pulse border border-border"
              />
            ))
          : items.map((food, idx) => (
          <motion.div
            key={food.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl overflow-hidden border border-border hover:border-[var(--color-primary)] transition-all group"
          >
            <div className="w-full h-40 overflow-hidden relative">
              <SafeImage
                src={food.image}
                fallback={FOOD_FALLBACK}
                alt={food.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-foreground mb-1 truncate group-hover:text-[var(--color-primary)] transition-colors">
                {food.name}
              </h3>
              <p className="text-[var(--color-gray-text)] text-xs mb-3 truncate">{food.restaurant}</p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-foreground font-bold">{food.price}</span>
                <button className="w-8 h-8 rounded-full bg-section flex items-center justify-center text-foreground hover:bg-[var(--color-primary)] hover:text-foreground transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
