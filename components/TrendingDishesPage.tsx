"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, Minus, Plus, Star } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import { TRENDING_DISHES_60, Dish60 } from "@/lib/data/30restaurantsData";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

export default function TrendingDishesPage() {
  const router = useRouter();
  const { data: menuItems, isLoading } = useSWR("/api/menu-items?trending=true&limit=80");
  const { quantities, updatingId, updateQuantity, addAndCheckout } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  const dishes: Dish60[] = useMemo(() => {
    const rawArray = Array.isArray(menuItems)
      ? menuItems
      : Array.isArray((menuItems as any)?.data)
        ? (menuItems as any).data
        : Array.isArray((menuItems as any)?.items)
          ? (menuItems as any).items
          : [];

    if (rawArray.length >= 60) {
      return rawArray.slice(0, 60).map((item: any, idx: number) => {
        const fallbackObj = TRENDING_DISHES_60[idx % TRENDING_DISHES_60.length];
        return {
          id: String(item.id || fallbackObj.id),
          name: item.name || fallbackObj.name,
          restaurantId: String(item.restaurant_id || fallbackObj.restaurantId),
          restaurantName: item.restaurant_name || fallbackObj.restaurantName,
          rating: String(item.rating || item.restaurant_rating || fallbackObj.rating),
          price: item.discount_price ? Number(item.discount_price) : Number(item.price || fallbackObj.price),
          originalPrice: item.price ? Number(item.price) : fallbackObj.originalPrice,
          image: getFoodImage(item.image_url || item.image) || fallbackObj.image,
          description: item.description || fallbackObj.description,
          isVeg: Boolean(item.is_vegetarian ?? item.is_veg ?? fallbackObj.isVeg),
          isBestseller: Boolean(item.is_bestseller ?? fallbackObj.isBestseller),
          category: item.category_name || fallbackObj.category,
        };
      });
    }

    return TRENDING_DISHES_60;
  }, [menuItems]);

  return (
    <div className="container mx-auto px-4 md:px-8 py-12 max-w-7xl">
      <div className="border-b border-[#E5E7EB] pb-6 mb-8">
        <h1 className="text-3xl md:text-5xl font-black text-[#111827] mb-2">Trending Dishes</h1>
        <p className="text-[#6B7280] text-base md:text-lg">
          Top ordered dishes right now across Foodiq · {dishes.length} items available
        </p>
      </div>

      {isLoading && dishes.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-[340px] bg-[#F8FAFC] rounded-2xl animate-pulse border border-[#E5E7EB]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {dishes.map((dish, index) => {
            const qty = quantities.get(dish.id) || 0;
            const isUpdating = updatingId === dish.id;
            const isFavorite = itemIds.has(dish.id);

            return (
              <div
                key={dish.id}
                className="group relative bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full"
              >
                <Link href={`/food/${dish.id}`} className="relative block h-48 w-full overflow-hidden bg-[#F1F5F9]">
                  <SafeImage
                    src={dish.image}
                    fallback={FOOD_FALLBACK}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3 bg-[#0F172A] text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
                    #{index + 1}
                  </div>

                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-lg border border-white/20">
                    <div
                      className={`w-3.5 h-3.5 border-2 flex items-center justify-center ${
                        dish.isVeg ? "border-green-500" : "border-red-500"
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span>{dish.rating}</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleItem(dish.id)}
                  className="absolute top-12 right-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-primary transition-colors"
                  aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                </button>

                <div className="p-4 flex flex-col flex-1">
                  <Link href={`/food/${dish.id}`} className="font-extrabold text-[#0F172A] text-base line-clamp-1 hover:text-primary transition-colors mb-0.5">
                    {dish.name}
                  </Link>
                  <p className="text-[#64748B] text-xs font-semibold mb-2 line-clamp-1">by {dish.restaurantName}</p>

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
                        className="inline-flex items-center gap-1 bg-primary text-white hover:bg-primary-hover px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
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
      )}
    </div>
  );
}
