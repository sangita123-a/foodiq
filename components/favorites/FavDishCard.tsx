"use client";

import { motion } from "framer-motion";
import { Star, Heart, Plus } from "lucide-react";

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
      className="bg-[#171717] rounded-[24px] p-4 border border-white/5 hover:border-white/10 group shadow-lg flex gap-4"
    >
      <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 relative">
        <img 
          src={dish.image} 
          alt={dish.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        
        {/* Remove Heart */}
        <button 
          onClick={() => onRemove(dish.id)}
          className="absolute top-2 right-2 w-7 h-7 bg-white/20 hover:bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors group/heart"
        >
          <Heart className="w-4 h-4 text-[#FF2D3B] fill-[#FF2D3B] group-hover/heart:scale-110 transition-transform" />
        </button>
      </div>

      <div className="flex flex-col flex-1 justify-between py-1">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-white font-bold text-lg leading-tight line-clamp-1">{dish.name}</h4>
            <div className={`w-4 h-4 border-2 flex items-center justify-center rounded-sm flex-shrink-0 ${dish.isVeg ? 'border-green-500' : 'border-red-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${dish.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
          </div>
          <p className="text-gray-400 text-xs mb-1 line-clamp-1">From {dish.restaurant}</p>
          
          <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold mb-3">
            {dish.rating} <Star className="w-3 h-3 fill-yellow-500" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-white font-black text-lg">₹{dish.price}</span>
          <button className="bg-primary hover:bg-[#e02633] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-lg">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}
