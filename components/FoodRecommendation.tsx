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
  const { data: restaurants } = useSWR("/api/restaurants?limit=4");
  const firstRestaurantId = restaurants?.[0]?.id;
  const { data: menuItems } = useSWR(
    firstRestaurantId ? `/api/restaurants/${firstRestaurantId}/menu` : null
  );

  const recommendations: RecommendationItem[] = (menuItems || []).slice(0, 4).map((item: any, index: number) => ({
    id: item.id || index,
    name: item.name,
    restaurant: restaurants?.[0]?.name || "Foodiq Partner",
    price: `₹${item.discount_price || item.price}`,
    image: getFoodImage(item.image_url),
  }));

  const fallbackRecommendations: RecommendationItem[] = [
    {
      id: 1,
      name: "Truffle Mushroom Burger",
      restaurant: "Burger House",
      price: "₹249",
      image: "/images/catalog/food/burger.webp",
    },
    {
      id: 2,
      name: "Margherita Pizza",
      restaurant: "Luigi's Italian",
      price: "₹399",
      image: "/images/catalog/food/pizza.webp",
    },
    {
      id: 3,
      name: "Hyderabadi Chicken Dum Biryani",
      restaurant: "Paradise",
      price: "₹349",
      image: "/images/catalog/food/biryani.webp",
    },
    {
      id: 4,
      name: "Hakka Noodles",
      restaurant: "Wok This Way",
      price: "₹199",
      image: "/images/catalog/food/chinese.webp",
    },
  ];

  const items: RecommendationItem[] = recommendations.length > 0 ? recommendations : fallbackRecommendations;

  return (
    <div className="mb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">Recommended For You</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((food, idx) => (
          <motion.div
            key={food.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] hover:border-[var(--color-primary)] transition-all group"
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
              <h3 className="text-lg font-bold text-[#111827] mb-1 truncate group-hover:text-[var(--color-primary)] transition-colors">
                {food.name}
              </h3>
              <p className="text-[var(--color-gray-text)] text-xs mb-3 truncate">{food.restaurant}</p>

              <div className="flex items-center justify-between mt-auto">
                <span className="text-[#111827] font-bold">{food.price}</span>
                <button className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#111827] hover:bg-[var(--color-primary)] hover:text-[#111827] transition-colors">
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
