"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { resolveBackendUrl } from "@/lib/images";

export type CuisineCardData = {
  id?: number | string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  preview_images?: string[];
  restaurant_count?: number;
};

type Props = {
  cuisine: CuisineCardData;
  fallbackImage: string;
  fallbackDescription?: string;
  index?: number;
};

export default function CuisineCard({
  cuisine,
  fallbackImage,
  fallbackDescription = "Discover delicious favorites from restaurants near you.",
  index = 0,
}: Props) {
  const image =
    resolveBackendUrl(cuisine.image_url) ||
    resolveBackendUrl(cuisine.preview_images?.find(Boolean)) ||
    resolveBackendUrl(fallbackImage) ||
    fallbackImage;
  const restaurantCount = cuisine.restaurant_count ?? 0;

  return (
    <Link
      href={`/cuisine/${cuisine.slug}`}
      className="block h-full cursor-pointer rounded-[18px] focus-visible:outline-offset-4"
      aria-label={`Explore ${cuisine.name} cuisine`}
    >
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -5 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{
          opacity: { duration: 0.4, delay: (index % 6) * 0.04 },
          y: { duration: 0.3, ease: "easeOut" },
        }}
        className="group flex h-[232px] flex-col items-center overflow-hidden rounded-[18px] border border-[#EAEAEA] bg-white px-3.5 py-4 text-center shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow,background-color] duration-300 hover:border-[#D4D4D4] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
      >
        <div className="relative mb-3 h-[76px] w-[76px] shrink-0 overflow-hidden rounded-full bg-[#F8FAFC] shadow-[0_6px_18px_rgba(0,0,0,0.35)] ring-2 ring-[#E5E7EB]">
          <SafeImage
            src={image}
            fallback={fallbackImage}
            alt={cuisine.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
          />
        </div>

        <h3 className="line-clamp-1 text-base font-bold leading-5 tracking-[-0.02em] text-[#1C1C1C] transition-colors duration-300 group-hover:text-[#696969]">
          {cuisine.name}
        </h3>
        <p className="mt-1 text-xs font-medium text-[#9CA3AF]">
          {restaurantCount} {restaurantCount === 1 ? "Restaurant" : "Restaurants"}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-[18px] text-[#6B7280]">
          {cuisine.description || fallbackDescription}
        </p>

        <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-[#696969] transition-colors duration-300 group-hover:text-[#9C9C9C]">
          Explore
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </motion.article>
    </Link>
  );
}
