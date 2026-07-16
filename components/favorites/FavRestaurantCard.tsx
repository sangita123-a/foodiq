"use client";

import { motion } from "framer-motion";
import { Star, Clock, Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

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
      className="bg-[#171717] rounded-[24px] overflow-hidden border border-white/5 hover:border-white/10 group shadow-lg flex flex-col h-full"
    >
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={restaurant.image} 
          alt={restaurant.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-black/50"></div>
        
        {/* Top Badges */}
        <div className="absolute top-4 w-full px-4 flex justify-between items-start">
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-md ${
            restaurant.isOpen 
              ? "bg-green-500/80 text-white" 
              : "bg-red-500/80 text-white"
          }`}>
            {restaurant.isOpen ? "Open Now" : "Closed"}
          </span>
          
          <button 
            onClick={() => onRemove(restaurant.id)}
            className="w-10 h-10 bg-white/20 hover:bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors group/heart"
          >
            <Heart className="w-5 h-5 text-[#FF2D3B] fill-[#FF2D3B] group-hover/heart:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white line-clamp-1">{restaurant.name}</h3>
          <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-md text-green-400 text-xs font-bold flex-shrink-0">
            {restaurant.rating} <Star className="w-3 h-3 fill-green-400" />
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-1">{restaurant.cuisine}</p>

        <div className="flex items-center gap-4 text-xs font-bold text-gray-300 mb-6">
          <span className="flex items-center gap-1.5 bg-[#111] px-2.5 py-1.5 rounded-lg border border-white/5">
            <Clock className="w-3.5 h-3.5 text-primary" /> {restaurant.eta}
          </span>
          <span className="flex items-center gap-1.5 bg-[#111] px-2.5 py-1.5 rounded-lg border border-white/5">
            ₹{restaurant.priceForTwo} for two
          </span>
        </div>

        <Link 
          href={`/restaurant/${restaurant.id}`}
          className="mt-auto w-full bg-white/5 hover:bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-white/5 group-hover:border-primary/50"
        >
          View Menu
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
