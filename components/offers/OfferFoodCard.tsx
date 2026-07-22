"use client";

import Link from "next/link";
import { Star, Plus, Minus, Clock, Eye } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import { CARD_IMAGE_SIZES } from "@/lib/performance/assets";

export type OfferFoodItem = {
  menu_item_id: string;
  name: string;
  restaurant_name: string;
  original_price: number;
  discounted_price: number;
  image_url?: string;
  rating?: string | number;
  delivery_time?: string;
};

type Props = {
  item: OfferFoodItem;
  quantity: number;
  isUpdating: boolean;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
};

export default function OfferFoodCard({ item, quantity, isUpdating, onUpdateQuantity }: Props) {
  const rating = typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating || "4.5";
  const hasDiscount = item.discounted_price < item.original_price;
  const foodHref = `/food/${item.menu_item_id}`;

  return (
    <div className="food-card group flex flex-col max-md:rounded-[10px]">
      <Link href={foodHref} className="food-card-image block">
        <SafeImage
          src={getFoodImage(item.image_url)}
          fallback={FOOD_FALLBACK}
          alt={item.name}
          fill
          sizes={CARD_IMAGE_SIZES}
          className="object-cover"
        />
      </Link>

      <div className="food-card-body flex-1 flex flex-col max-md:p-2 md:p-3">
        <Link href={foodHref} className="food-card-title text-white mb-0.5 line-clamp-1 hover:text-primary transition-colors block max-md:text-xs max-md:mb-0.5 md:mb-1 md:text-sm">
          {item.name}
        </Link>
        <p className="text-gray-text text-[10px] mb-2 line-clamp-1 max-md:mb-1.5 md:text-sm md:mb-3">{item.restaurant_name}</p>

        <div className="flex items-center gap-2 mb-2 text-[10px] max-md:mb-2 md:mb-4 md:gap-3 md:text-sm">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span className="text-white font-medium">{rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-text">
            <Clock className="w-3.5 h-3.5" />
            <span>{item.delivery_time || "30 min"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2 max-md:mb-2 md:mb-4 md:gap-3">
          <div className="flex items-baseline gap-1 max-md:gap-1 md:gap-2">
            <span className="food-price text-primary text-xs max-md:text-xs md:text-base">₹{item.discounted_price}</span>
            {hasDiscount && (
              <span className="text-[10px] text-[#9CA3AF] line-through max-md:text-[10px] md:text-sm">₹{item.original_price}</span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
              disabled={isUpdating}
              className="food-button min-h-0 flex items-center gap-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-2 py-1 rounded-lg text-[10px] font-bold max-md:h-7 max-md:px-2 max-md:py-0 md:px-3 md:py-2 md:rounded-xl md:text-sm"
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-section rounded-lg px-1 py-0.5 max-md:rounded-lg md:gap-3 md:rounded-xl md:px-2 md:py-1.5">
              <button
                onClick={() => onUpdateQuantity(item.menu_item_id, -1)}
                disabled={isUpdating}
                className="w-6 h-6 flex items-center justify-center text-white hover:bg-section rounded-md transition-colors disabled:opacity-50 max-md:h-6 max-md:w-6 md:w-8 md:h-8 md:rounded-lg"
              >
                <Minus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
              <span className="text-white font-bold min-w-[16px] text-center text-[10px] max-md:text-[10px] md:text-sm">{quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
                disabled={isUpdating}
                className="w-6 h-6 flex items-center justify-center text-white hover:bg-section rounded-md transition-colors disabled:opacity-50 max-md:h-6 max-md:w-6 md:w-8 md:h-8 md:rounded-lg"
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          )}
        </div>

        <Link
          href={foodHref}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-text hover:text-foreground max-md:text-[10px] md:gap-1.5 md:text-xs"
        >
          <Eye className="w-3 h-3 md:w-3.5 md:h-3.5" />
          View Details
        </Link>
      </div>
    </div>
  );
}
