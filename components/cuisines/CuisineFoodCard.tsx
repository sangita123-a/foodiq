"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Plus, Minus, Clock, Heart, Share2, Eye } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import { CARD_IMAGE_SIZES } from "@/lib/performance/assets";
import { shareContent } from "@/lib/share";
import { useToast } from "@/contexts/ToastContext";

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
  onBuyNow?: (menuItemId: string) => void;
};

export default function CuisineFoodCard({
  item,
  quantity,
  isUpdating,
  isFavorite = false,
  onUpdateQuantity,
  onToggleFavorite,
  onBuyNow,
}: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const rating = typeof item.rating === "number" ? item.rating.toFixed(1) : item.rating || "4.5";
  const hasDiscount = item.discounted_price < item.original_price;
  const foodHref = `/food/${item.menu_item_id}`;

  const handleShare = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    await shareContent({
      title: item.name,
      text: item.description,
      url: `${window.location.origin}${foodHref}`,
      onCopied: () => showToast("Dish link copied", "success"),
    });
  };

  return (
    <div className="food-card group flex flex-col">
      <Link href={foodHref} className="food-card-image block">
        <SafeImage
          src={getFoodImage(item.image_url)}
          fallback={FOOD_FALLBACK}
          alt={item.name}
          fill
          sizes={CARD_IMAGE_SIZES}
          className="object-cover"
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
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite(item.menu_item_id);
            }}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`w-4 h-4 ${isFavorite ? "fill-primary text-primary" : "text-white"}`}
            />
          </button>
        )}
      </Link>

      <div className="food-card-body flex-1 flex flex-col">
        <Link href={foodHref} className="food-card-title text-[#111827] mb-1 line-clamp-1 hover:text-[#E23744] transition-colors">
          {item.name}
        </Link>
        <Link
          href={`/restaurant/${item.restaurant_id}`}
          className="text-[#6B7280] text-sm mb-2 line-clamp-1 hover:text-[#E23744] transition-colors"
        >
          {item.restaurant_name}
        </Link>
        {item.description && (
          <p className="food-card-description text-xs mb-3 line-clamp-2">{item.description}</p>
        )}

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

        <div className="flex items-center justify-between gap-3 mt-auto mb-4">
          <div className="flex items-baseline gap-2">
            <span className="food-price text-[#E23744]">₹{item.discounted_price}</span>
            {hasDiscount && (
              <span className="text-sm text-[#9CA3AF] line-through">₹{item.original_price}</span>
            )}
          </div>

          {quantity === 0 ? (
            <button
              onClick={() => onUpdateQuantity(item.menu_item_id, 1)}
              disabled={isUpdating}
              className="food-button min-h-0 flex items-center gap-1.5 bg-[#E23744] hover:bg-[#C81E34] disabled:opacity-50 text-white px-3 py-2 rounded-xl text-sm font-bold"
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

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E5E7EB]">
          <Link
            href={foodHref}
            className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#6B7280] hover:text-[#111827] px-2 py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </Link>
          <button
            type="button"
            onClick={() => (onBuyNow ? onBuyNow(item.menu_item_id) : router.push(foodHref))}
            disabled={isUpdating}
            className="inline-flex items-center justify-center gap-1 text-[11px] font-bold text-primary px-2 py-2 rounded-lg bg-primary/10 hover:bg-primary hover:text-[#111827] transition-colors disabled:opacity-50"
          >
            Order Now
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="col-span-2 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#6B7280] hover:text-[#111827] px-2 py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
