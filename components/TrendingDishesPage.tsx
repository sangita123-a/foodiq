"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, Minus, Plus, Star } from "lucide-react";
import useSWR from "swr";
import { useMemo } from "react";
import SafeImage from "@/components/ui/SafeImage";
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
  description?: string;
  trendingScore?: number;
};

export default function TrendingDishesPage() {
  const router = useRouter();
  const { data: menuItems, isLoading } = useSWR("/api/menu-items?trending=true&limit=80");
  const { quantities, updatingId, updateQuantity, addAndCheckout } = useCartActions();
  const { itemIds, updatingId: favoriteUpdatingId, toggleItem } = useFavoriteActions();

  const dishes: TrendingDish[] = useMemo(() => {
    const rawArray = Array.isArray(menuItems)
      ? menuItems
      : Array.isArray(menuItems?.data)
        ? menuItems.data
        : Array.isArray(menuItems?.items)
          ? menuItems.items
          : [];
    return rawArray.map((item: any) => ({
      id: item.id,
      name: item.name,
      restaurant: item.restaurant_name || "Foodiq Partner",
      rating: Number(item.rating || item.restaurant_rating || 4.5).toFixed(1),
      price: item.discount_price ? parseFloat(item.discount_price) : parseFloat(item.price),
      image: getFoodImage(item.image_url),
      description: item.description,
      trendingScore: item.trending_score || 0,
    }));
  }, [menuItems]);

  return (
    <div className="food-section">
      <div className="food-section-heading border-b border-[#E5E7EB] pb-6">
        <h1 className="text-3xl md:text-4xl font-black text-[#111827] mb-2">Trending Dishes</h1>
        <p>
          Top ordered dishes right now across Foodiq · {dishes.length} dishes
        </p>
      </div>

      {isLoading ? (
        <div className="food-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-[318px] bg-[#F8FAFC] rounded-2xl animate-pulse border border-[#E5E7EB]" />
          ))}
        </div>
      ) : dishes.length === 0 ? (
        <div className="text-center py-20 text-[#6B7280]">No trending dishes available yet.</div>
      ) : (
        <div className="food-grid">
          {dishes.map((dish, index) => {
            const qty = quantities.get(dish.id) || 0;
            const isUpdating = updatingId === dish.id;

            return (
              <div
                key={dish.id}
                className="food-card relative group"
              >
                <Link href={`/food/${dish.id}`} className="food-card-image block">
                  <SafeImage
                    src={dish.image || FOOD_FALLBACK}
                    fallback={FOOD_FALLBACK}
                    alt={dish.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75/60 to-transparent" />
                  <div className="absolute top-3 left-3 bg-primary/90 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                    #{index + 1}
                  </div>
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
                  <p className="text-[#6B7280] text-sm mb-2 line-clamp-1">by {dish.restaurant}</p>
                  {dish.description && (
                    <p className="food-card-description text-xs mb-3 line-clamp-2">{dish.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto">
                    <span className="food-price text-[#111827]">₹{dish.price}</span>

                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => updateQuantity(dish.id, 1)}
                        disabled={isUpdating}
                        className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-full transition-colors disabled:opacity-50"
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
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-[#111827] font-bold text-sm min-w-[20px] text-center">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(dish.id, 1)}
                          disabled={isUpdating}
                          className="p-1.5 text-primary hover:text-[#111827] hover:bg-primary rounded-full transition-colors disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E5E7EB] pt-3">
                    <Link
                      href={`/food/${dish.id}`}
                      className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#F8FAFC] px-2 py-2 text-[11px] font-bold text-[#111827] transition-colors hover:bg-[#F1F5F9]"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => addAndCheckout(dish.id, router)}
                      disabled={isUpdating}
                      className="rounded-lg bg-primary px-2 py-2 text-[11px] font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                    >
                      Order Now
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
