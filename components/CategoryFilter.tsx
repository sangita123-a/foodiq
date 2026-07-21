/** @architecture UNUSED — not imported by any route. Safe to ignore. */
"use client";

import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

const categories = [
  { name: "Pizza", slug: "pizza", emoji: "🍕", image: "/images/catalog/cuisines/pizza.webp" },
  { name: "Burger", slug: "burger", emoji: "🍔", image: "/images/catalog/cuisines/burger.webp" },
  { name: "Biryani", slug: "biryani", emoji: "🍚", image: "/images/catalog/cuisines/biryani.webp" },
  { name: "Chinese", slug: "chinese", emoji: "🍜", image: "/images/catalog/cuisines/chinese.webp" },
  { name: "Dessert", slug: "desserts", emoji: "🍰", image: "/images/catalog/cuisines/desserts.webp" },
  { name: "Healthy", slug: "healthy", emoji: "🥗", image: "/images/catalog/cuisines/healthy.webp" },
];

export default function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentCategory === slug) {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    params.delete("page");
    router.push(`/order-online?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-center gap-6 my-10">
      {categories.map((cat, idx) => {
        const isActive = currentCategory === cat.slug;
        return (
          <motion.button
            key={cat.slug}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => handleCategoryClick(cat.slug)}
            aria-pressed={isActive}
            aria-label={`Filter by ${cat.name}`}
            className="flex flex-col items-center gap-3 cursor-pointer group bg-transparent border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E23744]"
          >
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 transition-colors shadow-lg relative ${
                isActive
                  ? "border-[var(--color-primary)]"
                  : "border-[var(--color-border)] group-hover:border-[var(--color-primary)]"
              }`}
            >
              <div
                className={`absolute inset-0 transition-colors z-10 ${
                  isActive ? "bg-black/10" : "bg-black/40 group-hover:bg-black/20"
                }`}
              />
              <SafeImage
                src={cat.image}
                fallback={FOOD_FALLBACK}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 text-2xl drop-shadow-md" aria-hidden="true">
                {cat.emoji}
              </span>
            </div>
            <span
              className={`font-medium text-sm md:text-base transition-colors ${
                isActive ? "text-[var(--color-primary)]" : "text-[#111827] group-hover:text-[var(--color-primary)]"
              }`}
            >
              {cat.name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
