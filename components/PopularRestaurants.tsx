"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Heart, Sparkles, Star } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { getRestaurantImage, RESTAURANT_FALLBACK } from "@/lib/images";
import { POPULAR_RESTAURANTS_30, Restaurant30 } from "@/lib/data/30restaurantsData";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

export default function PopularRestaurants() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const { restaurantIds, toggleRestaurant } = useFavoriteActions();
  const [localFavs, setLocalFavs] = useState<Set<string>>(new Set());

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

  const handleToggleFav = async (id: string) => {
    setLocalFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    await toggleRestaurant(id);
  };

  return (
    <section className="py-8 bg-white border-y border-[#ECECEC]" id="popular-restaurants-section">
      <div className="container mx-auto px-4 md:px-6 max-w-[1440px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#ECECEC]">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF5F6] text-[#E23744] text-[11px] font-black uppercase tracking-wider border border-[#E23744]/20">
              <Sparkles className="w-3 h-3 fill-[#E23744]" />
              <span>Top Spots</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] tracking-tight">
              Popular Restaurants Near You
            </h2>
          </div>

          <Link
            href="/restaurants"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-[#ECECEC] bg-[#F8F8F8] hover:bg-[#ECECEC] text-[#1A1A1A] text-xs font-bold transition-all shadow-xs active:scale-95 shrink-0"
          >
            <span>Explore All 30</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? "bg-[#E23744] text-white border-[#E23744] shadow-xs scale-102"
                    : "bg-[#F8F8F8] text-[#1A1A1A] border-[#ECECEC] hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Ultra-compact Grid: Mobile: 2 cols, Tablet: 4 cols, Desktop: 7-8 cols, Gap: 10-12px */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 xl:grid-cols-8 gap-2.5 md:gap-3">
          {isLoading && filteredRestaurants.length === 0
            ? Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="h-[195px] rounded-[12px] bg-[#F8F8F8] animate-pulse border border-[#ECECEC]" />
              ))
            : filteredRestaurants.map((restaurant) => {
                const isFav = restaurantIds.has(restaurant.id) || localFavs.has(restaurant.id);
                return (
                  <div
                    key={restaurant.id}
                    className="group relative bg-white rounded-[12px] border border-[#ECECEC] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(226,55,68,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-[195px] cursor-pointer"
                  >
                    {/* Top Image (85px height) */}
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="relative block h-[85px] w-full overflow-hidden bg-[#F8F8F8] shrink-0"
                    >
                      <SafeImage
                        src={restaurant.image}
                        fallback={RESTAURANT_FALLBACK}
                        alt={restaurant.name}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Favorite Heart Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFav(restaurant.id);
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/80 hover:bg-white text-gray-700 shadow-xs transition-all z-20 backdrop-blur-xs active:scale-90"
                        aria-label="Save Favorite"
                      >
                        <Heart
                          className={`w-3 h-3 transition-colors ${
                            isFav ? "fill-[#E23744] text-[#E23744]" : "text-gray-600 hover:text-[#E23744]"
                          }`}
                        />
                      </button>

                      {/* Veg / Non-Veg Indicator */}
                      <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-xs p-0.5 rounded border border-gray-200 z-10">
                        <div
                          className={`w-2.5 h-2.5 border flex items-center justify-center ${
                            restaurant.isVeg ? "border-green-600" : "border-red-600"
                          }`}
                        >
                          <div className={`w-0.5 h-0.5 rounded-full ${restaurant.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                        </div>
                      </div>
                    </Link>

                    {/* Bottom Ultra-compact Content (Padding 8px) */}
                    <div className="p-2 flex flex-col flex-1 justify-between bg-white min-w-0">
                      <div>
                        {/* Restaurant Name (1 line only) */}
                        <Link
                          href={`/restaurant/${restaurant.id}`}
                          className="font-black text-[#1A1A1A] text-xs line-clamp-1 group-hover:text-[#E23744] transition-colors block"
                        >
                          {restaurant.name}
                        </Link>

                        {/* ⭐ Rating + Delivery Time (same line) */}
                        <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#1A1A1A] my-0.5">
                          <span className="inline-flex items-center gap-0.5 bg-[#16A34A] text-white px-1 py-0.2 rounded text-[9px] font-black shrink-0">
                            {restaurant.rating} <Star className="w-2 h-2 fill-white" />
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[#666666] truncate">{restaurant.time}</span>
                        </div>

                        {/* Cuisine (1 line only) */}
                        <p className="text-[#666666] text-[10px] font-medium truncate">
                          {restaurant.cuisine}
                        </p>

                        {/* ₹ Price for Two */}
                        <p className="text-[#888888] text-[9px] font-medium truncate">
                          {restaurant.priceForTwo}
                        </p>
                      </div>

                      {/* Small View Menu Button */}
                      <Link
                        href={`/restaurant/${restaurant.id}`}
                        className="w-full mt-1 py-1 rounded-lg bg-[#E23744] hover:bg-[#C81E34] text-white text-[10px] font-bold transition-all text-center block shadow-xs active:scale-95 leading-tight"
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
