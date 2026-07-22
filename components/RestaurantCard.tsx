"use client";

import { motion } from "framer-motion";
import { Star, Clock } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getRestaurantImage, RESTAURANT_FALLBACK } from "@/lib/images";
import { CARD_IMAGE_SIZES } from "@/lib/performance/assets";

interface RestaurantCardProps {
  id: string | number;
  name: string;
  image: string;
  rating: string;
  time: string;
  cuisine: string;
  priceForTwo: string;
  delay?: number;
}

export default function RestaurantCard({
  id,
  name,
  image,
  rating,
  time,
  cuisine,
  priceForTwo,
  delay = 0,
}: RestaurantCardProps) {
  const imageUrl = getRestaurantImage(image);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -4 }}
      className="food-card group flex h-full min-h-0 flex-col max-md:shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
    >
      <Link href={`/restaurant/${id}`} className="flex flex-grow flex-col">
        <div className="food-card-image max-md:rounded-t-xl">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#111827]/75/80 to-transparent" />
          <SafeImage
            src={imageUrl}
            fallback={RESTAURANT_FALLBACK}
            alt={name}
            fill
            sizes={CARD_IMAGE_SIZES}
            className="h-full w-full object-cover"
          />
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 max-md:bottom-1.5 max-md:left-1.5 max-md:max-w-[calc(100%-12px)] max-md:gap-1 md:bottom-3 md:left-4 md:gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-section px-1.5 py-0.5 text-[10px] font-bold text-foreground max-md:gap-0.5 max-md:rounded-md max-md:px-1 max-md:py-0.5 max-md:text-[9px] md:gap-1 md:px-2 md:py-1 md:text-xs">
              <span>{rating}</span>
              <Star className="h-2.5 w-2.5 fill-[#F4B400] text-[#F4B400] max-md:h-2 max-md:w-2 md:h-3 md:w-3" />
            </div>
            <div className="flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md max-md:min-w-0 max-md:gap-0.5 max-md:px-1 max-md:py-0.5 max-md:text-[9px] md:gap-1 md:px-2 md:py-1 md:text-xs">
              <Clock className="h-2.5 w-2.5 max-md:h-2 max-md:w-2 max-md:shrink-0 md:h-3 md:w-3" />
              <span className="max-md:truncate">{time}</span>
            </div>
          </div>
        </div>

        <div className="food-card-body flex flex-grow flex-col">
          <h3 className="food-card-title mb-1 text-sm text-foreground transition-colors group-hover:text-foreground max-md:mb-0.5 max-md:text-[13px] md:text-lg">
            {name}
          </h3>
          <p className="food-card-description mb-2 line-clamp-1 text-xs max-md:mb-1 max-md:text-[11px] md:mb-3 md:text-sm">
            {cuisine}
          </p>

          <div className="mt-auto space-y-3">
            <div className="mb-3 h-px w-full bg-[#E5E7EB] max-md:hidden md:mb-4" />
            <div className="flex flex-col gap-2 max-md:gap-0 md:flex-row md:items-center md:justify-between">
              <span className="text-xs text-[var(--color-gray-text)] max-md:text-[11px] md:text-sm">
                {priceForTwo}
              </span>
              <span className="food-button food-button-secondary min-h-0 w-full px-3 py-2 text-center text-xs max-md:hidden md:w-auto md:inline-flex">
                View Menu
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
