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

        {/* Responsive Grid of 60 Dishes: 2 col (mobile), 3 col (tablet), 4-5 col (desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {isLoading && filteredDishes.length === 0
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-[320px] rounded-[18px] bg-[#F8F8F8] animate-pulse border border-[#ECECEC]" />
              ))
            : filteredDishes.map((dish) => {
                const qty = quantities.get(dish.id) || 0;
                const isUpdating = updatingId === dish.id;
                const isFavorite = itemIds.has(dish.id);

                return (
                  <div
                    key={dish.id}
                    className="group relative bg-white rounded-[18px] border border-[#ECECEC] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(226,55,68,0.12)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 flex flex-col h-[320px] sm:h-[340px]"
                  >
                    {/* Dish Image (160-175px high) */}
                    <Link href={`/food/${dish.id}`} className="relative block h-[165px] sm:h-[175px] w-full overflow-hidden bg-[#F8F8F8] shrink-0">
                      <SafeImage
                        src={dish.image}
                        fallback={FOOD_FALLBACK}
                        alt={dish.name}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      {/* Bestseller Badge */}
                      {dish.isBestseller && (
                        <div className="absolute top-2.5 left-2.5 bg-[#E23744] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                          BESTSELLER
                        </div>
                      )}

                      {/* Veg / Non-Veg Badge */}
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md p-1 rounded-md border border-white/20">
                        <div
                          className={`w-3 h-3 border-2 flex items-center justify-center ${
                            dish.isVeg ? "border-green-500" : "border-red-500"
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${dish.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                        </div>
                      </div>

                      {/* Rating Overlay */}
                      <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>{dish.rating}</span>
                      </div>
                    </Link>

                    {/* Favorite Button */}
                    <button
                      type="button"
                      onClick={() => toggleItem(dish.id)}
                      className="absolute top-10 right-2.5 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:text-[#E23744] transition-colors"
                      aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-[#E23744] text-[#E23744]" : ""}`} />
                    </button>

                    {/* Content Body */}
                    <div className="p-3.5 flex flex-col flex-1 min-w-0 justify-between">
                      <div>
                        <Link href={`/food/${dish.id}`} className="font-extrabold text-[#1A1A1A] text-sm sm:text-base line-clamp-1 hover:text-[#E23744] transition-colors mb-0.5">
                          {dish.name}
                        </Link>

                        <Link href={`/restaurant/${dish.restaurantId}`} className="text-[#666666] text-xs font-medium hover:text-[#E23744] transition-colors mb-2 block line-clamp-1">
                          by {dish.restaurantName}
                        </Link>
                      </div>

                      {/* Price & Add to Cart Controls */}
                      <div className="pt-2 border-t border-[#F1F1F1] flex items-center justify-between gap-2">
                        <div>
                          <span className="text-base font-black text-[#E23744]">₹{dish.price}</span>
                          {dish.originalPrice && dish.originalPrice > dish.price && (
                            <span className="text-xs text-[#8E8E8E] line-through ml-1">₹{dish.originalPrice}</span>
                          )}
                        </div>

                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(dish.id, 1, {
                                restaurant_id: dish.restaurantId,
                                name: dish.name,
                                price: dish.price,
                                image: dish.image,
                                isVeg: dish.isVeg,
                              })
                            }
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 bg-[#E23744] text-white hover:bg-[#C81E34] px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all disabled:opacity-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>ADD</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 bg-[#FFF5F6] border border-[#E23744] rounded-xl px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(dish.id, -1)}
                              disabled={isUpdating}
                              className="w-5 h-5 rounded-md bg-white text-[#E23744] flex items-center justify-center font-bold shadow-sm hover:bg-[#E23744] hover:text-white transition-colors disabled:opacity-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-black text-[#E23744] min-w-[14px] text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(dish.id, 1)}
                              disabled={isUpdating}
                              className="w-5 h-5 rounded-md bg-white text-[#E23744] flex items-center justify-center font-bold shadow-sm hover:bg-[#E23744] hover:text-white transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Quick Details & Buy Now */}
                      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                        <Link
                          href={`/food/${dish.id}`}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-[#F8F8F8] text-[#666666] hover:bg-[#ECECEC] text-[11px] font-bold border border-[#ECECEC] transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            addAndCheckout(dish.id, router, {
                              restaurant_id: dish.restaurantId,
                              name: dish.name,
                              price: dish.price,
                              image: dish.image,
                              isVeg: dish.isVeg,
                            })
                          }
                          disabled={isUpdating}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-[#1A1A1A] text-white hover:bg-[#E23744] text-[11px] font-bold transition-colors disabled:opacity-50"
                        >
                          <span>Order</span>
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
