"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import CuisineCard, { CuisineCardData } from "@/components/cuisines/CuisineCard";

const cuisineCategories = [
  {
    name: "Indian",
    slug: "indian",
    description: "Rich curries, fragrant spices and comforting classics.",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400",
  },
  {
    name: "Chinese",
    slug: "chinese",
    description: "Wok-tossed noodles, dim sum and bold Asian flavors.",
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400",
  },
  {
    name: "North Indian",
    slug: "north-indian",
    description: "Tandoori favorites, creamy curries and fresh breads.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400",
  },
  {
    name: "South Indian",
    slug: "south-indian",
    description: "Crispy dosas, fluffy idlis and wholesome meals.",
    image: "https://images.unsplash.com/photo-1630383249896-424e482df921?w=400",
  },
  {
    name: "Pizza",
    slug: "pizza",
    description: "Cheesy, oven-fresh pizzas made for every craving.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
  },
  {
    name: "Burger",
    slug: "burger",
    description: "Juicy burgers stacked with fresh, flavorful fillings.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
  },
  {
    name: "Biryani",
    slug: "biryani",
    description: "Aromatic rice, tender bites and royal Indian spices.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
  },
  {
    name: "Italian",
    slug: "italian",
    description: "Classic pastas, rustic sauces and Italian favorites.",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400",
  },
  {
    name: "Street Food",
    slug: "street-food",
    description: "Chaat, rolls and irresistible local street favorites.",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880f44?w=400",
  },
  {
    name: "Healthy",
    slug: "healthy",
    description: "Fresh, balanced meals packed with feel-good flavor.",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
  },
  {
    name: "Desserts",
    slug: "desserts",
    description: "Cakes, ice creams and treats for your sweet tooth.",
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400",
  },
  {
    name: "Beverages",
    slug: "beverages",
    description: "Coolers, coffees and refreshing drinks for every mood.",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
  },
] as const;

export default function PopularCuisines() {
  const { data } = useSWR<CuisineCardData[]>("/api/cuisines");
  const cuisineBySlug = new Map(
    (data ?? []).map((cuisine) => [cuisine.slug, cuisine])
  );

  return (
    <section className="relative w-full overflow-hidden border-y border-[#E5E7EB] bg-[radial-gradient(circle_at_50%_0%,rgba(252,128,25,0.08),transparent_34%),linear-gradient(180deg,#FFFFFF_0%,#F8FAFC_50%,#FFFFFF_100%)]">
      <div className="food-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-7 flex items-end justify-between gap-4"
        >
          <div className="min-w-0">
            <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#111827] sm:text-2xl md:text-[28px]">
              <span aria-hidden="true">🍽️ </span>
              Popular Cuisines Around You
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">
              Discover delicious cuisines loved by food lovers near your location.
            </p>
          </div>
          <Link
            href="/popular-cuisines"
            className="group/view-all inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-semibold text-[#111827] shadow-sm transition-[color,border-color,background-color] duration-300 hover:border-[#FC8019]/50 hover:bg-[#FFF7ED] hover:text-[#FC8019] sm:px-4 sm:text-sm"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/view-all:translate-x-0.5" />
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 justify-center gap-3 sm:gap-4 md:grid-cols-[repeat(4,minmax(0,190px))] lg:grid-cols-[repeat(5,minmax(0,190px))] 2xl:grid-cols-[repeat(6,minmax(0,190px))]">
          {cuisineCategories.map((category, index) => {
            const cuisine = cuisineBySlug.get(category.slug);

            return (
              <CuisineCard
                key={category.slug}
                cuisine={{
                  ...cuisine,
                  name: category.name,
                  slug: category.slug,
                  description: cuisine?.description || category.description,
                }}
                fallbackImage={category.image}
                fallbackDescription={category.description}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
