"use client";

import { motion } from "framer-motion";
import { Star, Flame, Award, Leaf, Clock, Plus } from "lucide-react";
import { DishState } from "./types";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

interface DishPreviewCardProps {
  dish: DishState;
}

export default function DishPreviewCard({ dish }: DishPreviewCardProps) {
  
  // Helpers
  const hasDiscount = dish.discountPrice > 0 && dish.discountPrice < dish.regularPrice;
  const displayPrice = hasDiscount ? dish.discountPrice : dish.regularPrice;

  return (
    <div className="sticky top-24">
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-2xl relative">
        
        {/* Availability Overlay */}
        {dish.availability !== "Available" && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-[#F8FAFC] px-6 py-3 rounded-full border border-[#E5E7EB]">
              <span className="text-[#111827] font-black tracking-widest uppercase text-sm">
                {dish.availability === "Out of Stock" ? "Out of Stock" : "Hidden from Menu"}
              </span>
            </div>
          </div>
        )}

        {/* Image Area */}
        <div className="h-56 relative bg-[#F8FAFC] overflow-hidden">
          {dish.image ? (
            <SafeImage src={dish.image} fallback={FOOD_FALLBACK} alt={dish.name || "Preview"} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
              <span className="text-sm font-bold uppercase tracking-wider">No Image Uploaded</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-transparent to-[#F8FAFC]/40"></div>

          {/* Top Left Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {dish.badges.bestseller && (
              <span className="bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Award className="w-3 h-3" /> Bestseller
              </span>
            )}
            {dish.badges.trending && (
              <span className="bg-[#FC8019] text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                Trending
              </span>
            )}
            {dish.badges.chefsSpecial && (
              <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Flame className="w-3 h-3" /> Chef's Special
              </span>
            )}
            {dish.badges.newArrival && (
              <span className="bg-blue-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
                New Arrival
              </span>
            )}
            {dish.badges.healthyChoice && (
              <span className="bg-green-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Leaf className="w-3 h-3" /> Healthy
              </span>
            )}
          </div>

          {/* Top Right: Food Type Icon */}
          <div className="absolute top-4 right-4 z-10 bg-[#F8FAFC] backdrop-blur-md p-1.5 rounded shadow-lg">
            {dish.foodType === "Veg" && (
              <div className="w-4 h-4 border-2 border-green-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}
            {dish.foodType === "Non-Veg" && (
              <div className="w-4 h-4 border-2 border-red-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            )}
            {dish.foodType === "Egg" && (
              <div className="w-4 h-4 border-2 border-yellow-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              </div>
            )}
            {!dish.foodType && (
              <div className="w-4 h-4 border-2 border-[#E5E7EB] border-dashed rounded-sm"></div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 relative z-10 -mt-6">
          <div className="flex justify-between items-start gap-4 mb-2">
            <h2 className="text-xl font-black text-[#111827] leading-tight break-words flex-1">
              {dish.name || "Dish Name"}
            </h2>
            <div className="flex items-center gap-1 bg-[#F8FAFC] backdrop-blur-md px-2 py-1 rounded shadow-sm border border-[#E5E7EB] shrink-0">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span className="text-[#111827] font-bold text-xs">4.5</span>
            </div>
          </div>

          <div className="flex items-end gap-2 mb-4">
            <span className="text-2xl font-black text-[#111827]">₹{displayPrice}</span>
            {hasDiscount && (
              <span className="text-sm font-bold text-[#9CA3AF] line-through mb-1">₹{dish.regularPrice}</span>
            )}
          </div>

          <p className="text-[#6B7280] text-sm leading-relaxed mb-6 line-clamp-2">
            {dish.shortDesc || "A short description of the dish will appear here to tempt your customers."}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-2 mb-6">
            {dish.prepTime && (
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E5E7EB] px-2.5 py-1 rounded-md">
                <Clock className="w-3 h-3 text-[#6B7280]" />
                <span className="text-xs font-bold text-[#6B7280]">{dish.prepTime}</span>
              </div>
            )}
            {dish.calories && (
              <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E5E7EB] px-2.5 py-1 rounded-md">
                <Flame className="w-3 h-3 text-orange-400" />
                <span className="text-xs font-bold text-[#6B7280]">{dish.calories} kcal</span>
              </div>
            )}
            {/* Spice Level Indicator */}
            {dish.spiceLevel > 1 && (
              <div className="flex items-center gap-0.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-md">
                {[...Array(dish.spiceLevel)].map((_, i) => (
                  <span key={i} className="text-xs">🌶️</span>
                ))}
              </div>
            )}
          </div>

          <button className="w-full bg-[#F8FAFC] hover:bg-[#FC8019]/20 hover:text-[#FC8019] border border-[#E5E7EB] hover:border-[#FC8019]/50 text-[#111827] py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Add to Cart
          </button>

          {dish.customizations.length > 0 && (
            <p className="text-center text-xs text-[#9CA3AF] font-bold mt-4 uppercase tracking-wider">
              + {dish.customizations.length} Customization Options
            </p>
          )}

        </div>
      </div>
      
      <p className="text-center text-xs text-[#9CA3AF] font-bold uppercase tracking-widest mt-6">
        Live Customer Preview
      </p>
    </div>
  );
}
