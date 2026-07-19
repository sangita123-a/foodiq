"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Heart, MapPin, Sparkles, Star, Tag } from "lucide-react";
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
    <section className="py-10 bg-white border-y border-[#ECECEC]" id="popular-restaurants-section">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-3 border-b border-[#ECECEC] gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5F6] text-[#E23744] text-xs font-black uppercase tracking-wider mb-2 border border-[#E23744]/20">
              <Sparkles className="w-3.5 h-3.5 fill-[#E23744]" />
              <span>Top Rated Spots</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1A1A1A] tracking-tight">
              Popular Restaurants Near You
            </h2>
            <p className="text-[#666666] text-xs md:text-sm font-medium mt-1">
              Explore top-rated spots categorized by your favorite cravings.
            </p>
          </div>

          <Link
            href="/restaurants"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#ECECEC] bg-[#F8F8F8] hover:bg-[#ECECEC] text-[#1A1A1A] text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
          >
            <span>Explore All 30 Spots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? "bg-[#E23744] text-white border-[#E23744] shadow-sm shadow-[#E23744]/20 scale-105"
                    : "bg-[#F8F8F8] text-[#1A1A1A] border-[#ECECEC] hover:bg-gray-100"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid of Compact Restaurants: 2 col (mobile), 3 col (tablet), 5 col (desktop), 18px gap */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[18px]">
          {isLoading && filteredRestaurants.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[315px] rounded-[18px] bg-[#F8F8F8] animate-pulse border border-[#ECECEC]" />
              ))
            : filteredRestaurants.map((restaurant) => {
                const isFav = restaurantIds.has(restaurant.id) || localFavs.has(restaurant.id);
                return (
                  <div
                    key={restaurant.id}
                    className="group relative bg-white rounded-[18px] border border-[#ECECEC] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(226,55,68,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-[315px] cursor-pointer"
                  >
                    {/* Top: Image (~145px height) */}
                    <Link
                      href={`/restaurant/${restaurant.id}`}
                      className="relative block h-[145px] w-full overflow-hidden bg-[#F8F8F8] shrink-0"
                    >
                      <SafeImage
                        src={restaurant.image}
                        fallback={RESTAURANT_FALLBACK}
                        alt={restaurant.name}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Offer Badge */}
                      {restaurant.offer && (
                        <div className="absolute bottom-2 left-2 bg-[#E23744] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wide flex items-center gap-1 z-10">
                          <Tag className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[120px]">{restaurant.offer}</span>
                        </div>
                      )}

                      {/* Veg / Non-Veg Badge */}
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-md p-1 rounded-md shadow-sm border border-gray-200 z-10">
                        <div
                          className={`w-3 h-3 border-2 flex items-center justify-center ${
                            restaurant.isVeg ? "border-green-600" : "border-red-600"
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${restaurant.isVeg ? "bg-green-600" : "bg-red-600"}`} />
                        </div>
                      </div>

                      {/* Favorite Heart Icon */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleFav(restaurant.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-white text-gray-700 shadow-md transition-all z-20 backdrop-blur-sm active:scale-90"
                        aria-label="Save Favorite"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-colors ${
                            isFav ? "fill-[#E23744] text-[#E23744]" : "text-gray-600 hover:text-[#E23744]"
                          }`}
                        />
                      </button>

                      {/* Open Status */}
                      {restaurant.isOpen ? (
                        <div className="absolute top-2 right-10 bg-emerald-600/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm z-10">
                          OPEN
                        </div>
                      ) : (
                        <div className="absolute top-2 right-10 bg-gray-800/90 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-sm z-10">
                          CLOSED
                        </div>
                      )}
                    </Link>

                    {/* Bottom: Card Content */}
                    <div className="p-3 flex flex-col flex-1 justify-between bg-white min-w-0">
                      <div>
                        {/* Restaurant Name */}
                        <Link
                          href={`/restaurant/${restaurant.id}`}
                          className="font-black text-[#1A1A1A] text-sm line-clamp-1 group-hover:text-[#E23744] transition-colors mb-0.5 block"
                        >
                          {restaurant.name}
                        </Link>

                        {/* Cuisine */}
                        <p className="text-[#666666] text-[11px] font-medium line-clamp-1 mb-2">
                          {restaurant.cuisine}
                        </p>

                        {/* Swiggy/Zomato Metrics Bar */}
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#1A1A1A] mb-1.5 flex-wrap">
                          <div className="inline-flex items-center gap-0.5 bg-[#16A34A] text-white px-1.5 py-0.5 rounded text-[10px] font-black">
                            <span>{restaurant.rating}</span>
                            <Star className="w-2.5 h-2.5 fill-white" />
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-1 text-[#666666]">
                            <Clock className="w-3 h-3 text-[#E23744]" />
                            <span>{restaurant.time}</span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <div className="flex items-center gap-0.5 text-[#666666]">
                            <MapPin className="w-3 h-3 text-[#E23744]" />
                            <span>{restaurant.location || "2.5 km"}</span>
                          </div>
                        </div>

                        {/* Price & Free Delivery */}
                        <div className="flex items-center justify-between text-[11px] text-[#666666] font-medium">
                          <span className="truncate">{restaurant.priceForTwo}</span>
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            Free Delivery
                          </span>
                        </div>
                      </div>

                      {/* View Menu Button */}
                      <Link
                        href={`/restaurant/${restaurant.id}`}
                        className="w-full mt-2 inline-flex items-center justify-center gap-1 py-1.5 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-[11px] font-black transition-all shadow-sm active:scale-95"
                      >
                        <span>View Menu</span>
                        <ArrowRight className="w-3 h-3" />
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
