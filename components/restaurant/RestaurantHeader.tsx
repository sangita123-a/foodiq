"use client";

import { Star, Clock, Heart, Share2, MapPin, IndianRupee } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";

type RestaurantHeaderProps = {
  restaurant: {
    name: string;
    coverImage: string;
    logo: string;
    rating: string;
    reviewsCount: string;
    deliveryTime: string;
    priceForTwo: string;
    location: string;
    tags: string[];
    isOpen: boolean;
  };
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onShare?: () => void;
};

export default function RestaurantHeader({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
  onShare,
}: RestaurantHeaderProps) {
  return (
    <div className="relative w-full">
      <div className="w-full h-[300px] md:h-[400px] relative">
        <SafeImage
          src={restaurant.coverImage}
          fallback={RESTAURANT_FALLBACK}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/75 via-[#111827]/30/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative -mt-32 md:-mt-40 z-10">
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[24px] p-6 md:p-8 shadow-2xl backdrop-blur-sm flex flex-col md:flex-row gap-6 md:items-center">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-[#FFFFFF] shadow-xl flex-shrink-0 bg-white">
            <SafeImage
              src={restaurant.logo}
              fallback={RESTAURANT_FALLBACK}
              alt={`${restaurant.name} logo`}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#111827] tracking-tight">{restaurant.name}</h1>
                  {restaurant.isOpen && (
                    <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-1 rounded-md border border-green-500/20">
                      OPEN NOW
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-[#6B7280] text-sm">
                  {restaurant.tags.map((tag, idx) => (
                    <span key={idx} className="bg-[#F8FAFC] px-2.5 py-1 rounded-md border border-[#E5E7EB]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-white hover:bg-[#F8FAFC] hover:text-[#FC8019] transition-all group"
                    aria-label={isFavorite ? "Remove from favorites" : "Save restaurant"}
                  >
                    <Heart
                      className={`w-5 h-5 transition-all ${
                        isFavorite ? "fill-[#FC8019] text-[#FC8019]" : "group-hover:fill-[#FC8019]"
                      }`}
                    />
                  </button>
                )}
                {onShare && (
                  <button
                    type="button"
                    onClick={onShare}
                    className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-white hover:bg-[#F8FAFC] transition-all"
                    aria-label="Share restaurant"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 md:gap-8 mt-6 pt-6 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-green-500 fill-green-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold">{restaurant.rating}</span>
                  <span className="text-[#9CA3AF] text-xs">{restaurant.reviewsCount} Reviews</span>
                </div>
              </div>

              <div className="w-px h-8 bg-[#F8FAFC] hidden md:block" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold">{restaurant.deliveryTime}</span>
                  <span className="text-[#9CA3AF] text-xs">Delivery Time</span>
                </div>
              </div>

              <div className="w-px h-8 bg-[#F8FAFC] hidden md:block" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold">{restaurant.priceForTwo}</span>
                  <span className="text-[#9CA3AF] text-xs">Cost for two</span>
                </div>
              </div>

              <div className="w-px h-8 bg-[#F8FAFC] hidden md:block" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold">{restaurant.location}</span>
                  <span className="text-[#9CA3AF] text-xs">Location</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
