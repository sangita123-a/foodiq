"use client";

import { motion } from "framer-motion";
import { Star, Clock } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getRestaurantImage, RESTAURANT_FALLBACK } from "@/lib/images";

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
      whileHover={{ y: -5 }}
      className="food-card group flex flex-col h-full min-h-0"
    >
      <Link href={`/restaurant/${id}`} className="flex flex-col flex-grow">
        <div className="food-card-image">
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/80 to-transparent z-10" />
          <SafeImage
            src={imageUrl}
            fallback={RESTAURANT_FALLBACK}
            alt={name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
            <div className="flex items-center gap-1 bg-green-600 px-2 py-1 rounded text-white text-xs font-bold">
              <span>{rating}</span>
              <Star className="w-3 h-3 fill-white" />
            </div>
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-medium">
              <Clock className="w-3 h-3" />
              <span>{time}</span>
            </div>
          </div>
        </div>

        <div className="food-card-body flex flex-col flex-grow">
          <h3 className="food-card-title text-[#111827] mb-1 group-hover:text-[var(--color-primary)] transition-colors">
            {name}
          </h3>
          <p className="food-card-description mb-3 line-clamp-1">{cuisine}</p>

          <div className="mt-auto">
            <div className="h-px w-full bg-[#E5E7EB] mb-4" />
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-gray-text)] text-sm">{priceForTwo}</span>
              <span className="food-button min-h-0 px-3 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold rounded-lg group-hover:bg-[var(--color-primary)] group-hover:text-white text-xs">
                View Menu
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
