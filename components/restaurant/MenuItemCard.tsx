"use client";

import Link from "next/link";
import { Star, Plus, Minus, Flame, Heart } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useState } from "react";
import { isClientAuthenticated } from "@/lib/authSession";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: string;
  isVeg: boolean;
  calories?: string;
  prepTime: string;
  tags?: string[];
  isFavorite?: boolean;
};

type MenuItemCardProps = {
  item: MenuItem;
  quantity: number;
  isUpdating?: boolean;
  onUpdateQuantity: (id: string, delta: number) => void;
  onOrderNow?: (id: string) => void;
  onFavoriteToggle?: () => void;
};

export default function MenuItemCard({
  item,
  quantity,
  isUpdating = false,
  onUpdateQuantity,
  onOrderNow,
  onFavoriteToggle,
}: MenuItemCardProps) {
  const { showToast } = useToast();
  const [isFav, setIsFav] = useState(item.isFavorite || false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const toggleFavorite = async () => {
    if (isTogglingFav) return;
    if (!isClientAuthenticated()) {
      showToast("Please login to save favorites", "error");
      return;
    }
    setIsTogglingFav(true);
    try {
      if (isFav) {
        await api.delete(`/api/favorites/${item.id}`);
        setIsFav(false);
        showToast("Removed from favorites", "success");
      } else {
        await api.post(`/api/favorites/${item.id}`);
        setIsFav(true);
        showToast("Added to favorites", "success");
      }
      onFavoriteToggle?.();
    } catch (error) {
      console.error(error);
      showToast("Failed to update favorites. Please try again.", "error");
    } finally {
      setIsTogglingFav(false);
    }
  };

  return (
    <article className="food-card group flex h-full flex-col rounded-[14px]">
      
      {/* Item Info */}
      <div className="order-2 flex flex-1 flex-col justify-between p-3">
        <div>
          {/* Veg/Non-Veg Badge & Tags */}
          <div className="mb-2 flex min-h-5 items-center gap-2">
            <div className={`w-4 h-4 flex items-center justify-center border-2 rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
            </div>
            
            {item.tags?.includes("Bestseller") && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 tracking-wider">
                <Flame className="w-3 h-3" /> Bestseller
              </span>
            )}
            
            {item.tags?.includes("Chef's Special") && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 tracking-wider">
                <Star className="w-3 h-3 fill-purple-400" /> Chef&apos;s Special
              </span>
            )}
          </div>

          <div className="flex justify-between items-start gap-2">
            <Link href={`/food/${item.id}`} className="mb-1 line-clamp-1 text-[15px] font-semibold leading-5 text-[#1C1C1C] transition-colors group-hover:text-[#FC8019]">
              {item.name}
            </Link>
            <button 
              onClick={toggleFavorite}
              disabled={isTogglingFav}
              className="rounded-full border border-transparent bg-[#F8F9FA] p-1.5 transition-all hover:border-[#FC8019]/25 hover:bg-white"
              aria-label={isFav ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-[#EF4F5F] text-[#EF4F5F]' : 'text-[#686B78] hover:text-[#1C1C1C]'}`} />
            </button>
          </div>

          <div className="mb-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[#1C1C1C]">₹{item.price}</span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-xs text-[#686B78] line-through">₹{item.originalPrice}</span>
              )}
            </div>
            <span className="food-rating">
              <Star className="h-3 w-3 fill-current" /> 
              {item.rating}
            </span>
            <span className="text-[#686B78]">• {item.prepTime}</span>
            {item.calories && <span className="text-[#686B78]">• {item.calories}</span>}
          </div>
          <p className="mb-2.5 line-clamp-2 min-h-9 text-xs leading-[18px] text-[#686B78]">
            {item.description}
          </p>
        </div>

        {onOrderNow && (
          <button
            type="button"
            onClick={() => onOrderNow(item.id)}
            disabled={isUpdating}
            className="food-button inline-flex min-h-9 w-full items-center justify-center rounded-[9px] bg-primary px-3 text-xs font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Order Now
          </button>
        )}
      </div>

      {/* Item Image & Controls */}
      <div className="relative order-1 h-[132px] w-full flex-shrink-0 overflow-hidden bg-[#F8F9FA]">
        <div className="h-full w-full overflow-hidden bg-[#F8F9FA]">
          <Link href={`/food/${item.id}`} className="block h-full w-full">
            <SafeImage 
              src={item.image} 
              fallback={FOOD_FALLBACK}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.055]"
            />
          </Link>
        </div>
        
        {/* Add/Quantity Button */}
        <div className="absolute bottom-3 right-3 flex h-9 w-28 items-center justify-between overflow-hidden rounded-lg border border-[#ECECEC] bg-white/95 font-bold text-[#1C1C1C] shadow-[0_8px_22px_rgba(28,28,28,0.12)] backdrop-blur-sm">
          {quantity > 0 ? (
            <>
              <button 
                onClick={() => onUpdateQuantity(item.id, -1)}
                disabled={isUpdating}
                className="flex h-full w-1/3 items-center justify-center text-[#FC8019] transition-colors hover:bg-[#F8F9FA] disabled:opacity-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-1/3 text-center text-sm">{quantity}</span>
              <button 
                onClick={() => onUpdateQuantity(item.id, 1)}
                disabled={isUpdating}
                className="flex h-full w-1/3 items-center justify-center text-[#FC8019] transition-colors hover:bg-[#F8F9FA] disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)}
              disabled={isUpdating}
              className="h-full w-full text-center text-sm font-bold tracking-wider text-[#FC8019] transition-colors hover:bg-[#F8F9FA] disabled:opacity-50"
            >
              ADD
            </button>
          )}
        </div>
      </div>

    </article>
  );
}
