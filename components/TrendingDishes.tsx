"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Flame, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import { Dish60, TRENDING_DISHES_60 } from "@/lib/data/30restaurantsData";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

export default function TrendingDishes() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { quantities, updatingId, updateQuantity, addAndCheckout } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  // Live SWR fetch with fallback to 60 structured trending dishes
  const { data: apiData, isLoading } = useSWR("/api/menu-items?limit=60");

  const dishes: Dish60[] = useMemo(() => {
    const rawList = Array.isArray(apiData)
      ? apiData
      : Array.isArray((apiData as any)?.data)
        ? (apiData as any).data
        : Array.isArray((apiData as any)?.items)
          ? (apiData as any).items
          : [];

    if (rawList.length >= 60) {
      return rawList.slice(0, 60).map((d: any, idx: number) => {
        const fallbackObj = TRENDING_DISHES_60[idx % TRENDING_DISHES_60.length];
        return {
          id: String(d.id || fallbackObj.id),
          name: d.name || fallbackObj.name,
          restaurantId: String(d.restaurant_id || fallbackObj.restaurantId),
          restaurantName: d.restaurant_name || fallbackObj.restaurantName,
          rating: String(d.rating || d.restaurant_rating || fallbackObj.rating),
          price: d.discount_price ? Number(d.discount_price) : Number(d.price || fallbackObj.price),
          originalPrice: d.price ? Number(d.price) : fallbackObj.originalPrice,
          image: getFoodImage(d.image_url || d.image) || fallbackObj.image,
          description: d.description || fallbackObj.description,
          isVeg: Boolean(d.is_vegetarian ?? d.is_veg ?? fallbackObj.isVeg),
          isBestseller: Boolean(d.is_bestseller ?? fallbackObj.isBestseller),
          category: d.category_name || fallbackObj.category,
        };
      });
    }

    return TRENDING_DISHES_60;
  }, [apiData]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    TRENDING_DISHES_60.forEach((d) => set.add(d.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredDishes = useMemo(() => {
    if (selectedCategory === "All") return dishes;
    return dishes.filter((d) => d.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [dishes, selectedCategory]);

  return (
    <section className="py-12 bg-white" id="trending-dishes-section">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-bold mb-3 uppercase tracking-wider">
              <Flame className="w-4 h-4 fill-red-500 text-red-500" />
              <span>60 Trending Delicacies</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] tracking-tight mb-2">
              Trending Dishes Right Now
            </h2>
            <p className="text-[#64748B] text-base md:text-lg">
              Most ordered dishes across Foodiq with instant delivery.
            </p>
          </div>

          <Link
            href="/trending-dishes"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-sm font-semibold hover:bg-primary transition-all shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View All 60 Dishes</span>
          </Link>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 hide-scrollbar scroll-smooth">
          {categories.slice(0, 16).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? "bg-[#0F172A] text-white shadow-md scale-105"
                    : "bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Responsive Grid of 60 Dishes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {isLoading && filteredDishes.length === 0
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-[360px] rounded-[20px] bg-[#F8FAFC] animate-pulse border border-[#E2E8F0]" />
              ))
            : filteredDishes.map((dish) => {
                const qty = quantities.get(dish.id) || 0;
                const isUpdating = updatingId === dish.id;
                const isFavorite = itemIds.has(dish.id);

                return (
                  <div
                    key={dish.id}
                    className="group relative bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
                  >
                    {/* Dish Image */}
                    <Link href={`/food/${dish.id}`} className="relative block h-48 w-full overflow-hidden bg-[#F1F5F9]">
                      <SafeImage
                        src={dish.image}
                        fallback={FOOD_FALLBACK}
                        alt={dish.name}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Bestseller Badge */}
                      {dish.isBestseller && (
                        <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md">
                          BESTSELLER
                        </div>
                      )}

                      {/* Veg / Non-Veg Badge */}
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/20">
                        <div
                          className={`w-3.5 h-3.5 border-2 flex items-center justify-center ${
                            dish.isVeg ? "border-green-500" : "border-red-500"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                        </div>
                      </div>

                      {/* Rating Overlay */}
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span>{dish.rating}</span>
                      </div>
                    </Link>

                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={() => toggleItem(dish.id)}
                      className="absolute top-12 right-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-primary transition-colors"
                      aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                    </button>

                    {/* Content Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <Link href={`/food/${dish.id}`} className="font-extrabold text-[#0F172A] text-base line-clamp-1 hover:text-primary transition-colors mb-0.5">
                        {dish.name}
                      </Link>

                      <Link href={`/restaurant/${dish.restaurantId}`} className="text-[#64748B] text-xs font-semibold hover:text-primary transition-colors mb-2 line-clamp-1">
                        by {dish.restaurantName}
                      </Link>

                      {dish.description && (
                        <p className="text-[#94A3B8] text-xs mb-3 line-clamp-2 leading-relaxed">{dish.description}</p>
                      )}

                      {/* Price & Add to Cart Controls */}
                      <div className="mt-auto pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-2">
                        <div>
                          <span className="text-lg font-black text-[#0F172A]">₹{dish.price}</span>
                          {dish.originalPrice && dish.originalPrice > dish.price && (
                            <span className="text-xs text-[#94A3B8] line-through ml-1.5">₹{dish.originalPrice}</span>
                          )}
                        </div>

                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, 1)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 bg-primary text-white hover:bg-primary-hover px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                            <span>ADD</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-2 py-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(dish.id, -1)}
                              disabled={isUpdating}
                              className="w-6 h-6 rounded-lg bg-white text-primary flex items-center justify-center font-bold shadow-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black text-[#0F172A] min-w-[16px] text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(dish.id, 1)}
                              disabled={isUpdating}
                              className="w-6 h-6 rounded-lg bg-white text-primary flex items-center justify-center font-bold shadow-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quick Details & Buy Now */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <Link
                          href={`/food/${dish.id}`}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] text-xs font-bold border border-[#E2E8F0] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => addAndCheckout(dish.id, router)}
                          disabled={isUpdating}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#0F172A] text-white hover:bg-primary text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          <span>Order Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </section>
  );
}
