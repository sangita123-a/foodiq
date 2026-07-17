"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Plus, Minus, Clock, Eye } from "lucide-react";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";

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
    <div className="food-card group flex flex-col">
      <Link href={foodHref} className="food-card-image block">
        <Image
          src={getFoodImage(item.image_url)}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 320px"
        />
      </Link>

      <div className="food-card-body flex-1 flex flex-col">
        <Link href={foodHref} className="food-card-title text-white mb-1 line-clamp-1 hover:text-primary transition-colors block">
          {item.name}
        </Link>
        <p className="text-[#6B7280] text-sm mb-3 line-clamp-1">{item.restaurant_name}</p>

        <div className="flex items-center gap-3 mb-4 text-sm">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span className="text-white font-medium">{rating}</span>
          </div>
          <div className="flex items-center gap-1 text-[#6B7280]">
            <Clock className="w-3.5 h-3.5" />
            <span>{item.delivery_time || "30 min"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-2">
            <span className="food-price text-[#FC8019]">₹{item.discounted_price}</span>
            {hasDiscount && (
              <span className="text-sm text-[#9CA3AF] line-through">₹{item.original_price}</span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
              disabled={isUpdating}
              className="food-button min-h-0 flex items-center gap-1.5 bg-[#FC8019] hover:bg-[#E76F0B] disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-[#F8FAFC] rounded-xl px-2 py-1.5">
              <button
                onClick={() => onUpdateQuantity(item.menu_item_id, -1)}
                disabled={isUpdating}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#F8FAFC] rounded-lg transition-colors disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white font-bold min-w-[20px] text-center">{quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
                disabled={isUpdating}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#F8FAFC] rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <Link
          href={foodHref}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6B7280] hover:text-[#111827]"
        >
          <Eye className="w-3.5 h-3.5" />
          View Details
        </Link>
      </div>
    </div>
  );
}
