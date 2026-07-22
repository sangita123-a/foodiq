"use client";

import { motion } from "framer-motion";
import { Star, Clock, Utensils, IndianRupee, CheckCircle2 } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { getPriceForTwo, getRestaurantCoverImage, RESTAURANT_FALLBACK } from "@/lib/images";

export default function FeaturedRestaurant() {
  const { data, isLoading } = useSWR("/api/restaurants?sort=popular&limit=1");
  const restaurants = Array.isArray(data) ? data : [];
  const restaurant = restaurants[0];

  if (isLoading) {
    return (
      <section className="w-full overflow-hidden bg-section py-[100px] max-md:py-4">
        <div className="mx-auto w-[90%] max-w-7xl max-md:w-[calc(100%-24px)]">
          <div className="hidden flex-col items-center gap-12 lg:flex-row xl:gap-16 md:flex">
            <div className="aspect-[4/3] w-full animate-pulse rounded-[20px] bg-[#ECECEC] lg:w-[55%]" />
            <div className="flex w-full flex-col gap-4 lg:w-[45%]">
              <div className="h-6 w-32 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="h-12 w-3/4 animate-pulse rounded bg-[#E5E7EB]" />
              <div className="mt-4 h-24 w-full animate-pulse rounded bg-[#E5E7EB]" />
            </div>
          </div>
          <div className="md:hidden">
            <div className="h-[220px] animate-pulse rounded-xl bg-[#ECECEC]" />
          </div>
        </div>
      </section>
    );
  }

  if (!restaurant) return null;

  return (
    <section className="w-full overflow-hidden border-y border-border bg-section py-6 md:py-20 lg:py-[100px] max-md:py-4">
      <div className="mx-auto w-[calc(100%-24px)] max-w-7xl md:w-[90%]">
        {/* Mobile: compact single featured spotlight */}
        <div className="md:hidden">
          <div className="mb-2.5">
            <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[9px] font-bold tracking-wider text-yellow-500">
              <Star className="h-2.5 w-2.5 fill-yellow-500" />
              FEATURED
            </div>
            <h2 className="text-sm font-bold leading-tight text-foreground">{restaurant.name}</h2>
            <p className="mt-0.5 line-clamp-1 text-[10px] text-muted">
              {restaurant.description || "Top pick loved by foodies near you"}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-card">
            <div className="relative h-[120px] w-full">
              <SafeImage
                src={getRestaurantCoverImage(String(restaurant.id), restaurant.image_url)}
                fallback={RESTAURANT_FALLBACK}
                alt={restaurant.name}
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <div className="p-2.5">
              <div className="mb-2 flex flex-wrap gap-1.5 text-[9px] font-medium text-muted">
                <div className="flex items-center gap-0.5 rounded-md border border-border bg-section px-1.5 py-0.5">
                  <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
                  <span>{restaurant.rating}</span>
                </div>
                <div className="flex items-center gap-0.5 rounded-md border border-border bg-section px-1.5 py-0.5">
                  <Clock className="h-2.5 w-2.5 text-primary" />
                  <span>30 min</span>
                </div>
                <div className="flex items-center gap-0.5 rounded-md border border-border bg-section px-1.5 py-0.5">
                  <IndianRupee className="h-2.5 w-2.5 text-green-400" />
                  <span>{getPriceForTwo(restaurant.price_range).replace("₹", "")}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/restaurant/${restaurant.id}`}
                  className="flex-1 rounded-lg bg-primary py-2 text-center text-[11px] font-semibold text-white"
                >
                  Explore Menu
                </Link>
                <Link
                  href={`/restaurant/${restaurant.id}`}
                  className="flex-1 rounded-lg border border-border bg-white py-2 text-center text-[11px] font-semibold text-foreground"
                >
                  View Restaurant
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tablet/Desktop: original featured spotlight — unchanged */}
        <div className="hidden flex-col items-center gap-5 md:flex sm:gap-12 lg:flex-row xl:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group relative w-full overflow-hidden rounded-2xl border border-border shadow-[0_20px_50px_rgba(28,28,28,0.12)] lg:w-[55%]"
          >
            <div className="relative aspect-[4/3] w-full">
              <SafeImage
                src={getRestaurantCoverImage(String(restaurant.id), restaurant.image_url)}
                fallback={RESTAURANT_FALLBACK}
                alt={restaurant.name}
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111827]/75/80 via-[#111827]/30/20 to-transparent" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="flex w-full flex-col lg:w-[45%]"
          >
            <div className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold tracking-wider text-yellow-500">
              <Star className="h-3.5 w-3.5 fill-yellow-500" />
              FEATURED THIS WEEK
            </div>

            <h2 className="mb-4 text-2xl font-bold leading-tight tracking-[-0.045em] text-foreground sm:mb-6 sm:text-4xl md:text-5xl">
              {restaurant.name}
            </h2>

            <div className="mb-6 flex flex-wrap gap-2 text-xs font-medium text-muted sm:mb-8 sm:gap-3 sm:text-sm">
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                <span>{restaurant.rating} Rating</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>30 min Delivery</span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 sm:flex">
                <Utensils className="h-4 w-4 text-gray-text" />
                <span className="line-clamp-1 max-w-[120px]">{restaurant.description || "Multi Cuisine"}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5">
                <IndianRupee className="h-4 w-4 text-green-400" />
                <span>{getPriceForTwo(restaurant.price_range).replace("₹", "")}</span>
              </div>
            </div>

            <p className="mb-10 text-base leading-relaxed text-muted md:text-lg">
              {restaurant.description ||
                "Experience authentic Dum Biryani prepared with premium ingredients, rich spices, and traditional cooking methods. Loved by thousands of food enthusiasts across the city."}
            </p>

            <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href={`/restaurant/${restaurant.id}`}
                className="w-full rounded-xl bg-primary px-8 py-2.5 text-center text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-hover)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.1)] sm:w-auto"
              >
                Explore Menu
              </Link>
              <Link
                href={`/restaurant/${restaurant.id}`}
                className="w-full rounded-xl border border-border bg-white px-8 py-2.5 text-center text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-section sm:w-auto"
              >
                View Restaurant
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-4 text-sm text-gray-text">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#2ECC71]" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#2ECC71]" />
                <span>Pure Hygiene</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#2ECC71]" />
                <span>1000+ Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#2ECC71]" />
                <span>Open Now</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
