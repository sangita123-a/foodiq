"use client";

import { motion } from "framer-motion";
import { Star, Clock, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK } from "@/lib/images";

export type FavRestaurantType = {
  id: string;
  name: string;
  image: string;
  rating: string;
  eta: string;
  cuisine: string;
  priceForTwo: string;
  isOpen: boolean;
};

type Props = {
  restaurant: FavRestaurantType;
  onRemove: (id: string) => void;
};

export default function FavRestaurantCard({ restaurant, onRemove }: Props) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className="food-card group flex flex-col h-full"
    >
      <div className="food-card-image">
        <SafeImage 
          src={restaurant.image} 
          fallback={RESTAURANT_FALLBACK}
          alt={restaurant.name} 
          className="w-full h-full object-cover" 
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-[#F8FAFC]/50"></div>
        
        {/* Top Badges */}
        <div className="absolute top-4 w-full px-4 flex justify-between items-start">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md ${
            restaurant.isOpen 
              ? "bg-green-500/80 text-foreground" 
              : "bg-red-500/80 text-foreground"
          }`}>
            {restaurant.isOpen ? "Open Now" : "Closed"}
          </span>
          
          <button 
            onClick={() => onRemove(restaurant.id)}
            className="w-10 h-10 bg-section hover:bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors group/heart"
          >
            <Heart className="w-5 h-5 text-primary fill-primary group-hover/heart:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="food-card-body flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="food-card-title text-white line-clamp-1">{restaurant.name}</h3>
          <div className="food-rating ml-2 shrink-0">
            {restaurant.rating} <Star className="w-3 h-3 fill-green-400" />
          </div>
        </div>

        <p className="food-card-description mb-3 line-clamp-1">{restaurant.cuisine}</p>

        <div className="flex items-center gap-2 text-xs font-semibold text-gray-text mb-4">
          <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-border">
            <Clock className="w-3.5 h-3.5 text-primary" /> {restaurant.eta}
          </span>
          <span className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-border">
            ₹{restaurant.priceForTwo} for two
          </span>
        </div>

        <Link 
          href={`/restaurant/${restaurant.id}`}
          className="food-button mt-auto w-full bg-section hover:bg-primary text-white px-3 text-sm font-semibold flex items-center justify-center gap-2 border border-border group-hover:border-primary/50"
        >
          View Menu
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
