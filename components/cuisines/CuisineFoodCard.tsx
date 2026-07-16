"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Plus, Minus, Clock, Heart } from "lucide-react";
import { getFoodImage } from "@/lib/images";

export type CuisineFoodItem = {
  menu_item_id: string;
  name: string;
  description?: string;
  restaurant_id: string;
  restaurant_name: string;
  original_price: number;
  discounted_price: number;
  image_url?: string;
  is_vegetarian?: boolean;
  rating?: string | number;
  delivery_time?: string;
};

type Props = {
  item: CuisineFoodItem;
  quantity: number;
  isUpdating: boolean;
  isFavorite?: boolean;
  onUpdateQuantity: (menuItemId: string, delta: number) => void;
  onToggleFavorite?: (menuItemId: string) => void;
};

export default function CuisineFoodCard({
  item,
  quantity,
  isUpdating,
  isFavorite = false,
  onUpdateQuantity,
  onToggleFavorite,
}: Props) {
  const rating = typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating || "4.5";
  const hasDiscount = item.discounted_price < item.original_price;

  return (
    <div className="bg-[#111] rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors group flex flex-col">
      <div className="relative h-52 w-full overflow-hidden">
        <Image
          src={getFoodImage(item.image_url)}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 320px"
        />
        <div
          className={`absolute top-3 left-3 w-5 h-5 flex items-center justify-center border-2 rounded-sm bg-black/50 ${
            item.is_vegetarian ? "border-green-600" : "border-red-600"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${item.is_vegetarian ? "bg-green-600" : "bg-red-600"}`}
          />
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => onToggleFavorite(item.menu_item_id)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? "fill-primary text-primary" : "text-white"}`}
            />
          </button>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{item.name}</h3>
        <Link
          href={`/restaurant/${item.restaurant_id}`}
          className="text-gray-400 text-sm mb-2 line-clamp-1 hover:text-[#FF2D3B] transition-colors"
        >
          {item.restaurant_name}
        </Link>
        {item.description && (
          <p className="text-gray-500 text-xs mb-3 line-clamp-2">{item.description}</p>
        )}

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

        <div className="flex items-center justify-between gap-3 mt-auto">
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
