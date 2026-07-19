"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { getRestaurantImage, RESTAURANT_FALLBACK } from "@/lib/images";
import { fetchCollections } from "@/services/featuresApi";

type CollectionData = {
  id: string;
  title: string;
  description: string;
  places: string;
  image: string;
  slug?: string;
};

const fallbackCollections: CollectionData[] = [
  {
    id: "c1",
    title: "Best Biryani Near You",
    description: "Authentic, rich, and aromatic biryanis.",
    places: "24 Places",
    image: "/images/catalog/restaurants/biryani.webp",
    slug: "best-biryani",
  },
  {
    id: "c2",
    title: "Top Rated Restaurants",
    description: "The absolute best rated spots in the city.",
    places: "32 Places",
    image: "/images/catalog/restaurants/north-indian.webp",
    slug: "top-rated",
  },
  {
    id: "c3",
    title: "Newly Opened",
    description: "Explore the newest flavors in your area.",
    places: "15 Places",
    image: "/images/catalog/restaurants/italian.webp",
    slug: "newly-opened",
  },
  {
    id: "c4",
    title: "Pure Veg Delights",
    description: "Wholesome vegetarian favourites.",
    places: "28 Places",
    image: "/images/catalog/restaurants/south-indian.webp",
    slug: "pure-veg",
  },
];

export default function FeaturedCollections() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data } = useSWR("feature-collections", fetchCollections);

  const collectionsData: CollectionData[] =
    Array.isArray(data) && data.length
      ? data.map((c) => ({
          id: String(c.id),
          title: String(c.title),
          description: String(c.description || ""),
          places: `${c.restaurant_count || 0} Places`,
          image: getRestaurantImage(c.image_url as string),
          slug: String(c.slug || ""),
        }))
      : fallbackCollections;

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-white w-full overflow-hidden">
      <div className="food-section">
        <div className="food-section-heading flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight mb-2">
              Featured Collections
            </h2>
            <p>Curated restaurant collections for every mood.</p>
          </motion.div>

          <div className="hidden sm:flex gap-3">
            <button
              onClick={() => scroll("left")}
              className="food-button w-10 h-10 min-h-0 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#111827] hover:bg-[#E23744] hover:border-[#E23744] hover:text-[#111827]"
              aria-label="Scroll left"
              type="button"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="food-button w-10 h-10 min-h-0 rounded-full border border-[#E5E7EB] bg-white flex items-center justify-center text-[#111827] hover:bg-[#E23744] hover:border-[#E23744] hover:text-[#111827]"
              aria-label="Scroll right"
              type="button"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory custom-scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {collectionsData.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.5,
                  ease: "easeOut",
                  delay: index * 0.1,
                }}
                className="food-card snap-start flex-shrink-0 w-[240px] md:w-[250px] h-[320px] relative group/card cursor-pointer"
              >
                <div className="absolute inset-0 w-full h-full">
                  <SafeImage
                    src={collection.image}
                    fallback={RESTAURANT_FALLBACK}
                    alt={collection.title}
                    className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75 via-[#111827]/30/50 to-transparent opacity-90 group-hover/card:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                  <span className="text-sm font-semibold text-[#6B7280] mb-2 bg-black/40 backdrop-blur-sm w-fit px-3 py-1 rounded-full border border-[#E5E7EB]">
                    {collection.places}
                  </span>
                  <h3 className="text-lg font-semibold text-white mb-1 leading-tight">
                    {collection.title}
                  </h3>
                  <p className="text-[#6B7280] text-sm mb-4 line-clamp-2">
                    {collection.description}
                  </p>

                  <Link
                    href={
                      collection.slug
                        ? `/collections?slug=${collection.slug}`
                        : "/collections"
                    }
                    className="flex items-center gap-2 text-white font-medium text-sm group-hover/card:text-[#E23744] transition-colors w-fit"
                  >
                    Explore Collection
                    <ArrowRight className="w-4 h-4 transform group-hover/card:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
