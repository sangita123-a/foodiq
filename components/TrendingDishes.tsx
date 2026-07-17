"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, Minus, Plus, Star } from "lucide-react";
import useSWR from "swr";
import { useMemo } from "react";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

type TrendingDish = {
  id: string;
  name: string;
  restaurant: string;
  rating: string;
  price: number;
  image: string;
};

export default function TrendingDishes() {
  const router = useRouter();
  const { data: menuItems, isLoading } = useSWR("/api/menu-items?trending=true&limit=8");
  const { quantities, updatingId, updateQuantity, addAndCheckout } = useCartActions();
  const { itemIds, updatingId: favoriteUpdatingId, toggleItem } = useFavoriteActions();

  const dishes: TrendingDish[] = useMemo(() => {
    return (menuItems || []).map((item: any) => ({
      id: item.id as string,
      name: item.name as string,
      restaurant: (item.restaurant_name || "Foodiq Partner") as string,
      rating: Number(item.rating || item.restaurant_rating || 4.5).toFixed(1),
      price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
      image: getFoodImage(item.image_url),
    }));
  }, [menuItems]);

  return (
    <section className="food-section overflow-hidden">
      <div className="food-section-heading flex items-end justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 tracking-tight">Trending Dishes</h2>
          <p>Top ordered dishes right now.</p>
        </div>
        <Link
          href="/trending-dishes"
          className="food-button hidden sm:inline-flex items-center px-5 rounded-xl border border-[#E5E7EB] text-[#111827] text-sm font-medium hover:bg-[#F8FAFC]"
        >
          View All
        </Link>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar custom-scrollbar-hide">
        {isLoading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="snap-start min-w-[240px] w-[240px] sm:min-w-[250px] sm:w-[250px] h-[316px] bg-[#F8FAFC] rounded-2xl animate-pulse border border-[#E5E7EB] flex-shrink-0"
              />
            ))
          : dishes.map((dish) => {
              const qty = quantities.get(dish.id) || 0;
              const isUpdating = updatingId === dish.id;

              return (
                <div
                  key={dish.id}
                  className="food-card relative snap-start min-w-[240px] w-[240px] sm:min-w-[250px] sm:w-[250px] group flex-shrink-0"
                >
                  <Link href={`/food/${dish.id}`} className="food-card-image block">
                    <Image
                      src={dish.image || FOOD_FALLBACK}
                      alt={dish.name}
                      fill
                      sizes="(max-width: 768px) 280px, 320px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/60 to-transparent" />

                    <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-sm font-semibold text-white">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                      {dish.rating}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleItem(dish.id)}
                    disabled={favoriteUpdatingId === dish.id}
                    className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2.5 text-white backdrop-blur-md transition-colors hover:text-primary disabled:opacity-50"
                    aria-label={itemIds.has(dish.id) ? `Remove ${dish.name} from favorites` : `Favorite ${dish.name}`}
                  >
                    <Heart className={`h-4 w-4 ${itemIds.has(dish.id) ? "fill-primary text-primary" : ""}`} />
                  </button>

                  <div className="food-card-body">
                    <Link href={`/food/${dish.id}`} className="food-card-title text-[#111827] mb-1 line-clamp-1 hover:text-primary transition-colors block">
                      {dish.name}
                    </Link>
                    <p className="text-[#6B7280] text-sm mb-4 line-clamp-1">by {dish.restaurant}</p>

                    <div className="flex items-center justify-between mt-auto">
                      <span className="food-price text-[#111827]">₹{dish.price}</span>

                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish.id, 1)}
                          disabled={isUpdating}
                          className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-full transition-colors duration-300 disabled:opacity-50"
                          aria-label={`Add ${dish.name} to cart`}
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 bg-primary/10 rounded-full px-1 py-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, -1)}
                            disabled={isUpdating}
                            className="p-1.5 text-primary hover:text-[#111827] hover:bg-primary rounded-full transition-colors disabled:opacity-50"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-[#111827] font-bold text-sm min-w-[20px] text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(dish.id, 1)}
                            disabled={isUpdating}
                            className="p-1.5 text-primary hover:text-[#111827] hover:bg-primary rounded-full transition-colors disabled:opacity-50"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E5E7EB] pt-3">
                      <Link
                        href={`/food/${dish.id}`}
                        className="food-button min-h-0 inline-flex items-center justify-center gap-1 rounded-lg bg-[#F8FAFC] px-2 py-2 text-[11px] font-bold text-[#111827] hover:bg-[#F1F5F9]"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => addAndCheckout(dish.id, router)}
                        disabled={isUpdating}
                        className="food-button min-h-0 rounded-lg bg-primary px-2 py-2 text-[11px] font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </section>
  );
}
