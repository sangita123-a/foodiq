"use client";

import { Star, Plus, Minus, Flame, Heart } from "lucide-react";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useState } from "react";

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
  onUpdateQuantity: (id: string, delta: number) => void;
  onFavoriteToggle?: () => void;
};

export default function MenuItemCard({ item, quantity, onUpdateQuantity, onFavoriteToggle }: MenuItemCardProps) {
  const { showToast } = useToast();
  const [isFav, setIsFav] = useState(item.isFavorite || false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const toggleFavorite = async () => {
    if (isTogglingFav) return;
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
      // Toast is handled by global SWR but for manual API calls we can show it here if not caught
      // Actually global SWR only catches SWR fetch errors. For manual API we should show toast:
      // showToast("Failed to update favorite", "error"); 
      // (The global interceptor doesn't show toast, the SWRConfig does)
      showToast("Failed to update favorites. Please try again.", "error");
    } finally {
      setIsTogglingFav(false);
    }
  };

  return (
    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:border-white/10 transition-colors duration-300 group shadow-lg">
      
      {/* Item Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Veg/Non-Veg Badge & Tags */}
          <div className="flex items-center gap-3 mb-2">
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
                <Star className="w-3 h-3 fill-purple-400" /> Chef's Special
              </span>
            )}
          </div>

          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#FF2D3B] transition-colors">
              {item.name}
            </h3>
            <button 
              onClick={toggleFavorite}
              disabled={isTogglingFav}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-[#FF2D3B] text-[#FF2D3B]' : 'text-gray-400 hover:text-white'}`} />
            </button>
          </div>

          <div className="flex items-center gap-3 text-sm mb-3">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-white">₹{item.price}</span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-gray-500 line-through text-xs">₹{item.originalPrice}</span>
              )}
            </div>
            <span className="flex items-center gap-1 text-gray-400">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> 
              {item.rating}
            </span>
            <span className="text-gray-500">• {item.prepTime}</span>
            {item.calories && <span className="text-gray-500">• {item.calories}</span>}
          </div>
          <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed mb-4">
            {item.description}
          </p>
        </div>
      </div>

      {/* Item Image & Controls */}
      <div className="relative flex-shrink-0 flex flex-col items-center">
        <div className="w-full sm:w-[130px] h-[130px] rounded-xl overflow-hidden shadow-lg bg-[#1A1A1A]">
          <img 
            src={item.image} 
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        </div>
        
        {/* Add/Quantity Button */}
        <div className="absolute -bottom-4 w-28 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl overflow-hidden flex items-center justify-between text-white font-bold h-9">
          {quantity > 0 ? (
            <>
              <button 
                onClick={() => onUpdateQuantity(item.id, -1)}
                className="w-1/3 h-full flex items-center justify-center hover:bg-white/10 transition-colors text-[#FF2D3B]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-1/3 text-center text-sm">{quantity}</span>
              <button 
                onClick={() => onUpdateQuantity(item.id, 1)}
                className="w-1/3 h-full flex items-center justify-center hover:bg-white/10 transition-colors text-green-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button 
              onClick={() => onUpdateQuantity(item.id, 1)}
              className="w-full h-full text-center text-sm font-bold hover:bg-white/10 transition-colors text-[#FF2D3B] tracking-wider"
            >
              ADD
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
