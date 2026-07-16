"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

const categories = [
  { name: "Pizza", emoji: "🍕", image: "https://images.unsplash.com/photo-1513104890138-7c049485ea28?auto=format&fit=crop&q=80&w=200&h=200" },
  { name: "Burger", emoji: "🍔", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=200&h=200" },
  { name: "Biryani", emoji: "🍚", image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=80&w=200&h=200" },
  { name: "Chinese", emoji: "🍜", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&q=80&w=200&h=200" },
  { name: "Dessert", emoji: "🍰", image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=200&h=200" },
  { name: "Healthy", emoji: "🥗", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=200&h=200" },
];

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentCategory === categoryName) {
      params.delete("category"); // toggle off
    } else {
      params.set("category", categoryName);
    }
    router.push(`/restaurants?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-center gap-6 my-10">
      {categories.map((cat, idx) => {
        const isActive = currentCategory === cat.name;
        return (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => handleCategoryClick(cat.name)}
            className="flex flex-col items-center gap-3 cursor-pointer group"
          >
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 transition-colors shadow-lg relative ${isActive ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)] group-hover:border-[var(--color-primary)]'}`}>
              <div className={`absolute inset-0 transition-colors z-10 ${isActive ? 'bg-black/10' : 'bg-black/40 group-hover:bg-black/20'}`}></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-2xl drop-shadow-md">
                {cat.emoji}
              </span>
            </div>
            <span className={`font-medium text-sm md:text-base transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-white group-hover:text-[var(--color-primary)]'}`}>
              {cat.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
