"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Sparkles, Star, Tag, Utensils } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { getRestaurantImage, RESTAURANT_FALLBACK } from "@/lib/images";
import { POPULAR_RESTAURANTS_30, Restaurant30 } from "@/lib/data/30restaurantsData";

export default function PopularRestaurants() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Fetch API data if available, fallback to 30 category-themed restaurants
  const { data: apiData, isLoading } = useSWR("/api/restaurants?limit=30");

  const restaurants: Restaurant30[] = useMemo(() => {
    const rawList = Array.isArray(apiData)
      ? apiData
      : Array.isArray((apiData as any)?.data)
        ? (apiData as any).data
        : Array.isArray((apiData as any)?.items)
          ? (apiData as any).items
          : [];

    if (rawList.length >= 30) {
      return rawList.slice(0, 30).map((r: any, idx: number) => {
        const fallbackObj = POPULAR_RESTAURANTS_30[idx % POPULAR_RESTAURANTS_30.length];
        return {
          id: String(r.id || fallbackObj.id),
          name: r.name || fallbackObj.name,
          category: r.category_name || fallbackObj.category,
          image: getRestaurantImage(r.image_url || r.image) || fallbackObj.image,
          logo: getRestaurantImage(r.logo || r.image_url) || fallbackObj.logo,
          rating: String(r.rating || fallbackObj.rating),
          reviewsCount: Number(r.reviews_count || fallbackObj.reviewsCount),
          time: r.estimated_delivery_time ? `${r.estimated_delivery_time} min` : fallbackObj.time,
          deliveryFee: r.delivery_fee ? `₹${r.delivery_fee} Delivery` : fallbackObj.deliveryFee,
          priceForTwo: r.price_range ? `₹${r.price_range * 200} for two` : fallbackObj.priceForTwo,
          cuisine: r.description || r.category_name || fallbackObj.cuisine,
          isVeg: Boolean(r.is_veg ?? fallbackObj.isVeg),
          isOpen: r.is_active !== false,
          offer: r.offer_text || fallbackObj.offer,
          location: r.address || fallbackObj.location,
        };
      });
    }

    return POPULAR_RESTAURANTS_30;
  }, [apiData]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    POPULAR_RESTAURANTS_30.forEach((r) => set.add(r.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredRestaurants = useMemo(() => {
    if (activeCategory === "All") return restaurants;
    return restaurants.filter((r) => r.category.toLowerCase() === activeCategory.toLowerCase());
  }, [restaurants, activeCategory]);

  return (
    <section className="py-12 bg-[#F8FAFC] border-y border-[#E2E8F0]" id="popular-restaurants-section">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>30 Handcrafted Categories</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Popular Restaurants Near You
            </h2>
            <p className="text-[#64748B] text-base md:text-lg">
              Explore top-rated spots categorized by your favorite cravings.
            </p>
          </div>

          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] text-sm font-semibold hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            <span>Explore All 30 Spots</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-4 mb-8 hide-scrollbar scroll-smooth">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                    : "bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid of 30 Restaurants: 2 col (mobile), 3 col (tablet), 4-5 col (desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {isLoading && filteredRestaurants.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[320px] rounded-[18px] bg-white animate-pulse border border-[#ECECEC]" />
              ))
            : filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="group relative bg-white rounded-[18px] border border-[#ECECEC] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(226,55,68,0.12)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 flex flex-col h-[320px] sm:h-[340px]"
                >
                  {/* Cover Image (~60% height) */}
                  <Link href={`/restaurant/${restaurant.id}`} className="relative block h-[175px] sm:h-[185px] w-full overflow-hidden bg-[#F8F8F8] shrink-0">
                    <SafeImage
                      src={restaurant.image}
                      fallback={RESTAURANT_FALLBACK}
                      alt={restaurant.name}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                    {/* Offer Tag */}
                    {restaurant.offer && (
                      <div className="absolute top-2.5 left-2.5 bg-[#E23744] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wide flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{restaurant.offer}</span>
                      </div>
                    )}

                    {/* Veg / Non-Veg Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md p-1 rounded-md border border-white/20">
                      <div
                        className={`w-3 h-3 border-2 flex items-center justify-center ${
                          restaurant.isVeg ? "border-green-500" : "border-red-500"
                        }`}
                      >
                        <div className={`w-1 h-1 rounded-full ${restaurant.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute bottom-2.5 left-2.5 bg-[#16A34A] text-white text-[11px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                      <span>{restaurant.rating}</span>
                      <Star className="w-3 h-3 fill-white" />
                    </div>

                    {/* Open Status */}
                    <div className="absolute bottom-2.5 right-2.5 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      OPEN
                    </div>
                  </Link>

                  {/* Essential Card Content */}
                  <div className="p-3.5 flex flex-col flex-1 min-w-0 justify-between">
                    <div>
                      <Link href={`/restaurant/${restaurant.id}`} className="font-extrabold text-[#1A1A1A] text-sm sm:text-base line-clamp-1 hover:text-[#E23744] transition-colors mb-0.5">
                        {restaurant.name}
                      </Link>

                      <p className="text-[#666666] text-xs line-clamp-1 font-medium mb-2">{restaurant.cuisine}</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[#666666] text-xs font-semibold mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#E23744]" />
                          <span>{restaurant.time}</span>
                        </div>
                        <span>•</span>
                        <span className="truncate">{restaurant.priceForTwo}</span>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/restaurant/${restaurant.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-xs font-bold transition-all shadow-sm active:scale-98"
                      >
                        <span>View Menu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
