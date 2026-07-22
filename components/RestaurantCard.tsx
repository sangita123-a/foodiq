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
      className="food-card group flex flex-col h-full min-h-0"
    >
      <Link href={`/restaurant/${id}`} className="flex flex-col flex-grow">
        <div className="food-card-image">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/80 to-transparent z-10" />
          <SafeImage
            src={imageUrl}
            fallback={RESTAURANT_FALLBACK}
            alt={name}
            fill
            sizes={CARD_IMAGE_SIZES}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 md:bottom-3 md:left-4 z-20 flex items-center gap-1.5 md:gap-2">
            <div className="flex items-center gap-0.5 md:gap-1 text-foreground text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-lg bg-section border border-border">
              <span>{rating}</span>
              <Star className="w-2.5 h-2.5 md:w-3 md:h-3 fill-[#F4B400] text-[#F4B400]" />
            </div>
            <div className="flex items-center gap-0.5 md:gap-1 bg-black/60 backdrop-blur-md px-1.5 md:px-2 py-0.5 md:py-1 rounded text-white text-[10px] md:text-xs font-medium">
              <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
              <span>{time}</span>
            </div>
          </div>
        </div>

        <div className="food-card-body flex flex-col flex-grow">
          <h3 className="food-card-title text-foreground mb-1 group-hover:text-foreground transition-colors text-sm md:text-lg">
            {name}
          </h3>
          <p className="food-card-description mb-2 md:mb-3 line-clamp-1 text-xs md:text-sm">{cuisine}</p>

          <div className="mt-auto space-y-3">
            <div className="h-px w-full bg-[#E5E7EB] mb-3 md:mb-4" />
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span className="text-[var(--color-gray-text)] text-xs md:text-sm">{priceForTwo}</span>
              <span className="food-button food-button-secondary min-h-0 w-full md:w-auto px-3 py-2 text-xs text-center">
                View Menu
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
