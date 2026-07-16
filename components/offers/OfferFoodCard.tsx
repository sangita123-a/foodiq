"use client";

import Image from "next/image";
import { Star, Plus, Minus, Clock } from "lucide-react";
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

  return (
    <div className="bg-[#111] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors group">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={getFoodImage(item.image_url)}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 320px"
        />
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{item.name}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-1">{item.restaurant_name}</p>

        <div className="flex items-center gap-3 mb-4 text-sm">
          <div className="flex items-center gap-1 text-yellow-400">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span className="text-white font-medium">{rating}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{item.delivery_time || "30 min"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[#FF2D3B]">₹{item.discounted_price}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">₹{item.original_price}</span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
              disabled={isUpdating}
              className="flex items-center gap-1.5 bg-[#FF2D3B] hover:bg-[#e02633] disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/10 rounded-xl px-2 py-1.5">
              <button
                onClick={() => onUpdateQuantity(item.menu_item_id, -1)}
                disabled={isUpdating}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-white font-bold min-w-[20px] text-center">{quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
                disabled={isUpdating}
                className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
