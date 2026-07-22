"use client";

import { motion } from "framer-motion";
import { Star, Clock, Utensils, IndianRupee, CheckCircle2 } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getPriceForTwo, getRestaurantCoverImage, RESTAURANT_FALLBACK } from "@/lib/images";

export default function FeaturedRestaurant() {
  const { data, isLoading } = useSWR('/api/restaurants?sort=popular&limit=1');
  const restaurant = data?.[0];

  if (isLoading) {
    return (
      <section className="bg-section w-full py-[100px] overflow-hidden">
        <div className="w-[90%] max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 xl:gap-16 items-center">
            <div className="w-full lg:w-[55%] aspect-[4/3] bg-[#ECECEC] animate-pulse rounded-[20px]"></div>
            <div className="w-full lg:w-[45%] flex flex-col gap-4">
              <div className="w-32 h-6 bg-[#E5E7EB] animate-pulse rounded-full"></div>
              <div className="w-3/4 h-12 bg-[#E5E7EB] animate-pulse rounded"></div>
              <div className="w-full h-8 bg-[#E5E7EB] animate-pulse rounded mt-4"></div>
              <div className="w-full h-24 bg-[#E5E7EB] animate-pulse rounded mt-4"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!restaurant) return null;

  return (
    <section className="w-full overflow-hidden border-y border-border bg-section py-6 sm:py-16 md:py-20 lg:py-[100px]">
      <div className="mx-auto w-[calc(100%-24px)] max-w-7xl sm:w-[90%]">
        <div className="flex flex-col items-center gap-5 sm:gap-12 lg:flex-row xl:gap-16">
          
          {/* Left Side - Image (55%) */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group relative w-full overflow-hidden rounded-2xl border border-border shadow-[0_20px_50px_rgba(28,28,28,0.12)] lg:w-[55%]"
          >
            <div className="relative aspect-[16/10] w-full md:aspect-[4/3]">
              <SafeImage
                src={getRestaurantCoverImage(String(restaurant.id), restaurant.image_url)}
                fallback={RESTAURANT_FALLBACK}
                alt={restaurant.name}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />
              {/* Dark overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/80 via-[#111827]/30/20 to-transparent pointer-events-none"></div>
            </div>
          </motion.div>

          {/* Right Side - Content (45%) */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex w-full flex-col lg:w-[45%]"
          >
            {/* Badge */}
            <div className="mb-3 inline-flex w-fit items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-yellow-500 md:mb-6 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs">
              <Star className="h-3 w-3 fill-yellow-500 md:h-3.5 md:w-3.5" />
              FEATURED THIS WEEK
            </div>

            {/* Main Heading */}
            <h2 className="mb-3 text-xl font-bold leading-tight tracking-[-0.045em] text-foreground sm:mb-6 sm:text-4xl md:text-5xl">
              {restaurant.name}
            </h2>

            {/* Stats Row */}
            <div className="mb-4 flex flex-wrap gap-1.5 text-[10px] font-medium text-muted sm:mb-8 sm:gap-3 sm:text-sm">
              <div className="flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 md:gap-1.5 md:rounded-lg md:px-3 md:py-1.5">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 md:h-4 md:w-4" />
                <span>{restaurant.rating} Rating</span>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 md:gap-1.5 md:rounded-lg md:px-3 md:py-1.5">
                <Clock className="h-3 w-3 text-primary md:h-4 md:w-4" />
                <span>30 min Delivery</span>
              </div>
              <div className="hidden items-center gap-1 rounded-md border border-border bg-white px-2 py-1 sm:flex md:gap-1.5 md:rounded-lg md:px-3 md:py-1.5">
                <Utensils className="h-3 w-3 text-gray-text md:h-4 md:w-4" />
                <span className="line-clamp-1 max-w-[120px]">{restaurant.description || "Multi Cuisine"}</span>
              </div>
              <div className="flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 md:gap-1.5 md:rounded-lg md:px-3 md:py-1.5">
                <IndianRupee className="h-3 w-3 text-green-400 md:h-4 md:w-4" />
                <span>{getPriceForTwo(restaurant.price_range).replace("₹", "")}</span>
              </div>
            </div>

            {/* Description */}
            <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-muted md:mb-10 md:text-lg md:line-clamp-none">
              {restaurant.description || "Experience authentic Dum Biryani prepared with premium ingredients, rich spices, and traditional cooking methods. Loved by thousands of food enthusiasts across the city."}
            </p>

            {/* Buttons */}
            <div className="mb-5 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link href={`/restaurant/${restaurant.id}`} className="w-full rounded-xl bg-primary px-6 py-2 text-center text-xs font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 sm:w-auto sm:px-8 sm:py-2.5 sm:text-sm md:hover:-translate-y-0.5 md:hover:bg-[var(--color-primary-hover)] md:hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)]">
                Explore Menu
              </Link>
              <Link href={`/restaurant/${restaurant.id}`} className="w-full rounded-xl border border-border bg-white px-6 py-2 text-center text-xs font-semibold text-foreground transition-all duration-300 sm:w-auto sm:px-8 sm:py-2.5 sm:text-sm md:hover:-translate-y-0.5 md:hover:border-border md:hover:bg-section">
                View Restaurant
              </Link>
            </div>

            {/* Extra Info */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px] text-gray-text sm:gap-y-4 sm:text-sm">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2ECC71] sm:h-5 sm:w-5" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2ECC71] sm:h-5 sm:w-5" />
                <span>Pure Hygiene</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2ECC71] sm:h-5 sm:w-5" />
                <span>1000+ Reviews</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#2ECC71] sm:h-5 sm:w-5" />
                <span>Open Now</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
