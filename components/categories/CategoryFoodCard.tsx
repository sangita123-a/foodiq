"use client";

import Link from "next/link";
import { Star, ShoppingCart, Eye, Plus, Minus, Heart, Clock } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import type { CategoryDishItem } from "@/lib/data/categoryData";

type Props = {
  dish: CategoryDishItem;
  quantity: number;
  isFavorite: boolean;
  onAddToCart: (dish: CategoryDishItem) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onToggleFavorite: (id: string) => void;
};

export default function CategoryFoodCard({
  dish,
  quantity,
  isFavorite,
  onAddToCart,
  onUpdateQuantity,
  onToggleFavorite,
}: Props) {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-[#ECECEC] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]">
      <div className="relative h-[160px] w-full overflow-hidden bg-[#F8F8F8]">
        <SafeImage
          src={dish.image}
          fallback={FOOD_FALLBACK}
          alt={dish.name}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute left-3 top-3 z-10 rounded-md border border-gray-200 bg-white/95 p-1 shadow-sm backdrop-blur-md">
          <div
            className={`flex h-3 w-3 items-center justify-center border-2 ${
              dish.isVeg ? "border-green-600" : "border-red-600"
            }`}
          >
            <div className={`h-1 w-1 rounded-full ${dish.isVeg ? "bg-green-600" : "bg-red-600"}`} />
          </div>
        </div>

        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-md bg-[#16A34A] px-2 py-0.5 text-[11px] font-black text-white shadow-sm">
          <span>{dish.rating}</span>
          <Star className="h-3 w-3 fill-white" />
        </div>

        <button
          type="button"
          onClick={() => onToggleFavorite(dish.id)}
          className="absolute right-3 top-3 z-20 rounded-full bg-white/90 p-1.5 text-gray-700 shadow-md backdrop-blur-sm transition-all hover:bg-white active:scale-90"
          aria-label="Save favourite"
        >
          <Heart
            className={`h-3.5 w-3.5 transition-colors ${
              isFavorite ? "fill-[#E23744] text-[#E23744]" : "text-gray-600 hover:text-[#E23744]"
            }`}
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between bg-white p-4">
        <div>
          <span className="mb-0.5 block text-[11px] font-bold uppercase tracking-wider text-[#666666]">
            {dish.restaurantName}
          </span>
          <h4 className="line-clamp-1 text-base font-black text-[#1C1C1C] transition-colors group-hover:text-[#696969]">
            {dish.name}
          </h4>
          <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#666666]">
            <Clock className="h-3 w-3" />
            <span>{dish.deliveryTime}</span>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-lg font-black text-[#1A1A1A]">₹{dish.price}</span>
            <span className="text-xs font-medium text-[#8E8E8E] line-through">₹{dish.originalPrice}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {quantity > 0 ? (
              <div className="flex items-center justify-between rounded-xl bg-[#E23744] p-1 text-white shadow-sm">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(dish.id, -1)}
                  className="touch-target flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/20 active:scale-90"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-1 text-xs font-black">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(dish.id, 1)}
                  className="touch-target flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-white/20 active:scale-90"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(dish)}
                className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[#E23744] py-2 text-xs font-black text-white shadow-sm transition-all hover:bg-[#C81E34] active:scale-95"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </button>
            )}

            <Link
              href={`/food/${dish.id}`}
              className="inline-flex w-full items-center justify-center gap-1 rounded-xl border border-[#ECECEC] bg-[#F8F8F8] py-2 text-xs font-bold text-[#1A1A1A] transition-all hover:bg-[#ECECEC] active:scale-95"
            >
              <Eye className="h-3.5 w-3.5 text-[#666666]" />
              <span>View Details</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
