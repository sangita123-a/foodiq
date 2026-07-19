"use client";

import Link from "next/link";
import { Eye, Heart, Minus, Plus, Star } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";

export type DishCardProps = {
  id: string;
  name: string;
  restaurantName?: string;
  rating?: string | number;
  price: number;
  image?: string | null;
  description?: string;
  isVeg?: boolean;
  quantity?: number;
  isUpdating?: boolean;
  isFavorite?: boolean;
  onUpdateQuantity?: (id: string, delta: number) => void;
  onToggleFavorite?: (id: string) => void;
  onViewDetails?: (id: string) => void;
};

export default function DishCard({
  id,
  name,
  restaurantName = "Foodiq Partner",
  rating = "4.5",
  price,
  image,
  description,
  isVeg = true,
  quantity = 0,
  isUpdating = false,
  isFavorite = false,
  onUpdateQuantity,
  onToggleFavorite,
}: DishCardProps) {
  const imageUrl = getFoodImage(image);
  const formattedRating = typeof rating === "number" ? rating.toFixed(1) : rating;

  return (
    <div className="food-card relative group flex flex-col h-full rounded-[18px] border border-[#E5E7EB] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/food/${id}`} className="food-card-image relative block h-44 w-full overflow-hidden bg-[#F8FAFC]">
        <SafeImage
          src={imageUrl}
          fallback={FOOD_FALLBACK}
          alt={name}
          sizes="(max-width: 768px) 100vw, 300px"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Veg/Non-Veg Badge */}
        <div className="absolute top-3 left-3 z-10 rounded-md border border-white/20 bg-black/60 p-1.5 backdrop-blur-md">
          <div
            className={`w-3.5 h-3.5 border-2 flex items-center justify-center ${isVeg ? "border-green-500" : "border-red-500"}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isVeg ? "bg-green-500" : "bg-red-500"}`} />
          </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-semibold text-white">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
          <span>{formattedRating}</span>
        </div>
      </Link>

      {/* Favorite Button */}
      {onToggleFavorite && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(id);
          }}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white backdrop-blur-md transition-colors hover:text-primary"
          aria-label={isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
        </button>
      )}

      {/* Card Content */}
      <div className="food-card-body flex-1 flex flex-col p-4">
        <Link href={`/food/${id}`} className="food-card-title text-[#111827] font-bold text-base mb-1 line-clamp-1 hover:text-primary transition-colors">
          {name}
        </Link>
        <p className="text-[#6B7280] text-xs mb-2 line-clamp-1">by {restaurantName}</p>
        {description && <p className="food-card-description text-xs text-[#9CA3AF] mb-3 line-clamp-2">{description}</p>}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#F3F4F6]">
          <span className="food-price text-[#111827] font-bold text-base">₹{price}</span>

          {/* Add to Cart / Quantity Controls */}
          {onUpdateQuantity && (
            quantity === 0 ? (
              <button
                type="button"
                onClick={() => onUpdateQuantity(id, 1)}
                disabled={isUpdating}
                className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                aria-label={`Add ${name} to cart`}
              >
                <Plus className="w-4 h-4" />
                ADD
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-primary/10 rounded-full px-2 py-1">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(id, -1)}
                  disabled={isUpdating}
                  className="p-1 text-primary hover:bg-primary hover:text-white rounded-full transition-colors disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[#111827] font-bold text-xs min-w-[18px] text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(id, 1)}
                  disabled={isUpdating}
                  className="p-1 text-primary hover:bg-primary hover:text-white rounded-full transition-colors disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
