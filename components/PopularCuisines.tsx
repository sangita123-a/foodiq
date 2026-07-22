"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import CuisineCard, { CuisineCardData } from "@/components/cuisines/CuisineCard";
import { resolveBackendUrl } from "@/lib/images";

const cuisineCategories = [
  {
    name: "Indian",
    slug: "indian",
    description: "Rich curries, fragrant spices and comforting classics.",
    image: "/images/catalog/cuisines/indian.webp",
  },
  {
    name: "Chinese",
    slug: "chinese",
    description: "Wok-tossed noodles, dim sum and bold Asian flavors.",
    image: "/images/catalog/cuisines/chinese.webp",
  },
  {
    name: "North Indian",
    slug: "north-indian",
    description: "Tandoori favorites, creamy curries and fresh breads.",
    image: "/images/catalog/cuisines/north-indian.webp",
  },
  {
    name: "South Indian",
    slug: "south-indian",
    description: "Crispy dosas, fluffy idlis and wholesome meals.",
    image: "/images/catalog/cuisines/south-indian.webp",
  },
  {
    name: "Pizza",
    slug: "pizza",
    description: "Cheesy, oven-fresh pizzas made for every craving.",
    image: "/images/catalog/cuisines/pizza.webp",
  },
  {
    name: "Burger",
    slug: "burger",
    description: "Juicy burgers stacked with fresh, flavorful fillings.",
    image: "/images/catalog/cuisines/burger.webp",
  },
  {
    name: "Biryani",
    slug: "biryani",
    description: "Aromatic rice, tender bites and royal Indian spices.",
    image: "/images/catalog/cuisines/biryani.webp",
  },
  {
    name: "Italian",
    slug: "italian",
    description: "Classic pastas, rustic sauces and Italian favorites.",
    image: "/images/catalog/cuisines/italian.webp",
  },
  {
    name: "Street Food",
    slug: "street-food",
    description: "Chaat, rolls and irresistible local street favorites.",
    image: "/images/catalog/cuisines/street-food.webp",
  },
  {
    name: "Healthy",
    slug: "healthy",
    description: "Fresh, balanced meals packed with feel-good flavor.",
    image: "/images/catalog/cuisines/healthy.webp",
  },
  {
    name: "Desserts",
    slug: "desserts",
    description: "Cakes, ice creams and treats for your sweet tooth.",
    image: "/images/catalog/cuisines/desserts.webp",
  },
  {
    name: "Beverages",
    slug: "beverages",
    description: "Coolers, coffees and refreshing drinks for every mood.",
    image: "/images/catalog/cuisines/beverages.webp",
  },
] as const;

export default function PopularCuisines() {
  const { data } = useSWR<CuisineCardData[]>("/api/cuisines");
  const cuisineBySlug = new Map(
    (data ?? []).map((cuisine) => [cuisine.slug, cuisine])
  );

  return (
    <section className="relative w-full overflow-hidden border-y border-border bg-section">
      <div className="food-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-4 flex items-end justify-between gap-3 md:mb-7 md:gap-4"
        >
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-[-0.03em] text-foreground sm:text-2xl md:text-[28px]">
              <span aria-hidden="true">🍽️ </span>
              Popular Cuisines Around You
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-gray-text md:mt-2 md:text-sm md:leading-6">
              Discover delicious cuisines loved by food lovers near your location.
            </p>
          </div>
          <Link
            href="/popular-cuisines"
            className="group/view-all inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1.5 text-[10px] font-semibold text-foreground shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-[color,border-color,background-color] duration-300 sm:px-4 sm:py-2 sm:text-sm md:hover:border-border md:hover:bg-section md:hover:text-primary"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/view-all:translate-x-0.5" />
          </Link>
        </motion.div>

        {/* Mobile: horizontal scroll */}
        <div className="scroll-row pb-1 md:hidden">
          {cuisineCategories.map((category) => {
            const cuisine = cuisineBySlug.get(category.slug);
            const image =
              resolveBackendUrl(cuisine?.image_url) ||
              resolveBackendUrl(cuisine?.preview_images?.find(Boolean)) ||
              resolveBackendUrl(category.image) ||
              category.image;

            return (
              <Link
                key={category.slug}
                href={`/cuisine/${category.slug}`}
                className="flex w-[64px] shrink-0 flex-col items-center gap-1 touch-target"
                aria-label={`Explore ${category.name} cuisine`}
              >
                <div className="h-[52px] w-[52px] overflow-hidden rounded-full bg-section ring-2 ring-border">
                  <SafeImage
                    src={image}
                    fallback={resolveBackendUrl(category.image) || category.image}
                    alt={category.name}
                    width={60}
                    height={60}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="w-full text-center text-[11px] font-bold leading-tight text-foreground line-clamp-2">
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:grid md:grid-cols-[repeat(4,minmax(0,190px))] lg:grid-cols-[repeat(5,minmax(0,190px))] 2xl:grid-cols-[repeat(6,minmax(0,190px))] justify-center gap-3 sm:gap-4">
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
                fallbackImage={resolveBackendUrl(category.image) || category.image}
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
