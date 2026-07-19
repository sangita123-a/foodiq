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

        {/* Grid of Exactly 30 Restaurants */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading && filteredRestaurants.length === 0
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-[340px] rounded-[20px] bg-white animate-pulse border border-[#E2E8F0]" />
              ))
            : filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="group relative bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
                >
                  {/* Cover Image */}
                  <Link href={`/restaurant/${restaurant.id}`} className="relative block h-48 w-full overflow-hidden bg-[#F1F5F9]">
                    <SafeImage
                      src={restaurant.image}
                      fallback={RESTAURANT_FALLBACK}
                      alt={restaurant.name}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Offer Tag */}
                    {restaurant.offer && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-[#FC8019] to-[#E26700] text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wide flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{restaurant.offer}</span>
                      </div>
                    )}

                    {/* Veg / Non-Veg Badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/20">
                      <div
                        className={`w-3.5 h-3.5 border-2 flex items-center justify-center ${
                          restaurant.isVeg ? "border-green-500" : "border-red-500"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${restaurant.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                      </div>
                    </div>

                    {/* Category Pill Overlay */}
                    <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md text-[#0F172A] text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-primary" />
                      <span>{restaurant.category}</span>
                    </div>

                    {/* Open Status */}
                    <div className="absolute bottom-3 right-3 bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                      OPEN NOW
                    </div>
                  </Link>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={`/restaurant/${restaurant.id}`} className="font-extrabold text-[#0F172A] text-base line-clamp-1 hover:text-primary transition-colors">
                        {restaurant.name}
                      </Link>
                      <div className="inline-flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shrink-0">
                        <span>{restaurant.rating}</span>
                        <Star className="w-3 h-3 fill-white" />
                      </div>
                    </div>

                    <p className="text-[#64748B] text-xs mb-3 line-clamp-1 font-medium">{restaurant.cuisine}</p>

                    <div className="flex items-center gap-3 text-[#475569] text-xs font-semibold mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{restaurant.time}</span>
                      </div>
                      <span>•</span>
                      <span>{restaurant.deliveryFee}</span>
                      <span>•</span>
                      <span className="text-[#64748B]">{restaurant.priceForTwo}</span>
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-[#64748B] line-clamp-1">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span>{restaurant.location}</span>
                      </div>

                      <Link
                        href={`/restaurant/${restaurant.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold transition-all shrink-0"
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
