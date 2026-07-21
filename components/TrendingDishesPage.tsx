"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, Minus, Plus, Star } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getUniqueTrendingImage } from "@/lib/images";
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
          image: getUniqueTrendingImage(
            item.name || fallbackObj.name,
            item.category_name || fallbackObj.category,
            item.image_url || item.image,
            fallbackObj.image,
            String(item.id || fallbackObj.id)
          ),
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
      <div className="border-b border-border pb-6 mb-8">
        <h1 className="text-3xl md:text-5xl font-black text-foreground mb-2">Trending Dishes</h1>
        <p className="text-gray-text text-base md:text-lg">
          Top ordered dishes right now across Foodiq · {dishes.length} items available
        </p>
      </div>

      {isLoading && dishes.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[320px] bg-footer rounded-[18px] animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
          {dishes.map((dish, index) => {
            const qty = quantities.get(dish.id) || 0;
            const isUpdating = updatingId === dish.id;
            const isFavorite = itemIds.has(dish.id);

            return (
              <div
                key={dish.id}
                className="group relative bg-white rounded-[18px] border border-border overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 flex flex-col h-[320px] sm:h-[340px]"
              >
                <Link href={`/food/${dish.id}`} className="relative block h-[165px] sm:h-[175px] w-full overflow-hidden bg-footer shrink-0">
                  <SafeImage
                    src={dish.image}
                    fallback={FOOD_FALLBACK}
                    alt={dish.name}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute top-2.5 left-2.5 border border-primary/20 bg-primary-soft text-primary text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                    #{index + 1}
                  </div>

                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md p-1 rounded-md border border-white/20">
                    <div
                      className={`w-3 h-3 border-2 flex items-center justify-center ${
                        dish.isVeg ? "border-green-500" : "border-red-500"
                      }`}
                    >
                      <div className={`w-1 h-1 rounded-full ${dish.isVeg ? "bg-green-500" : "bg-red-500"}`} />
                    </div>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>{dish.rating}</span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => toggleItem(dish.id)}
                  className="absolute top-10 right-2.5 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:text-primary transition-colors"
                  aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                </button>

                <div className="p-3.5 flex flex-col flex-1 min-w-0 justify-between">
                  <div>
                    <Link href={`/food/${dish.id}`} className="font-extrabold text-foreground text-sm sm:text-base line-clamp-1 hover:text-primary transition-colors mb-0.5">
                      {dish.name}
                    </Link>
                    <p className="text-gray-text text-xs font-medium line-clamp-1 mb-2">by {dish.restaurantName}</p>
                  </div>

                  <div className="pt-2 border-t border-[#F1F1F1] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-black text-primary">₹{dish.price}</span>
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
                        className="inline-flex items-center gap-1 bg-primary text-white hover:bg-primary-hover px-3 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-section border border-border rounded-xl px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish.id, -1)}
                          disabled={isUpdating}
                          className="w-5 h-5 rounded-md bg-white text-primary flex items-center justify-center font-bold shadow-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-primary min-w-[14px] text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish.id, 1)}
                          disabled={isUpdating}
                          className="w-5 h-5 rounded-md bg-white text-primary flex items-center justify-center font-bold shadow-sm hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    <Link
                      href={`/food/${dish.id}`}
                      className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-footer text-gray-text hover:bg-[#ECECEC] text-[11px] font-bold border border-border transition-colors"
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
                      className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-primary text-white hover:bg-primary-hover text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      <span>Order</span>
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
