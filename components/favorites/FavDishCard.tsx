"use client";

import { motion } from "framer-motion";
import { Star, Heart, Plus } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";

export type FavDishType = {
  id: string;
  name: string;
  restaurant: string;
  image: string;
  price: number;
  rating: string;
  isVeg: boolean;
};

type Props = {
  dish: FavDishType;
  onRemove: (id: string) => void;
};

export default function FavDishCard({ dish, onRemove }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="food-card group flex flex-col"
    >
      <div className="food-card-image">
        <SafeImage
          src={dish.image}
          fallback={FOOD_FALLBACK}
          alt={dish.name}
          className="w-full h-full object-cover"
        />

        <button
          onClick={() => onRemove(dish.id)}
          className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors group/heart"
        >
          <Heart className="w-4 h-4 text-[#FC8019] fill-[#FC8019] group-hover/heart:scale-110 transition-transform" />
        </button>

        <div
          className={`absolute top-3 left-3 w-4 h-4 border-2 flex items-center justify-center rounded-sm bg-black/50 ${
            dish.isVeg ? "border-green-500" : "border-red-500"
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? "bg-green-500" : "bg-red-500"}`} />
        </div>
      </div>

      <div className="food-card-body flex flex-col flex-1">
        <h4 className="food-card-title text-white mb-1 line-clamp-1">{dish.name}</h4>
        <p className="food-card-description text-xs mb-2 line-clamp-1">From {dish.restaurant}</p>

        <div className="food-rating w-fit mb-3">
          {dish.rating}
          <Star className="w-3 h-3 fill-current" />
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="food-price text-[#111827]">₹{dish.price}</span>
          <button className="food-button min-h-0 bg-primary hover:bg-[#E76F0B] text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
