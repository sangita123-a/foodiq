"use client";

import { Minus, Plus, Trash2 } from "lucide-react";

export type CartItemType = {
  id: string;
  name: string;
  restaurant: string;
  image: string;
  price: number;
  quantity: number;
  isVeg: boolean;
};

type CartItemCardProps = {
  item: CartItemType;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
};

export default function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const itemTotal = item.price * item.quantity;

  return (
    <div className="bg-[#171717] rounded-[22px] p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 shadow-md border border-white/5 hover:border-white/10 transition-colors">
      
      {/* Item Image */}
      <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
        {/* Veg/Non-Veg Badge overlapping image on mobile, or could be in text block */}
      </div>

      {/* Item Details */}
      <div className="flex-1 w-full">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-3 h-3 flex items-center justify-center border rounded-sm ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></div>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white line-clamp-1">{item.name}</h3>
        </div>
        <p className="text-[#A1A1A1] text-sm mb-3">From {item.restaurant}</p>
        <div className="text-white font-bold text-lg">
          ₹{item.price}
        </div>
      </div>

      {/* Controls & Total */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0">
        
        {/* Quantity Selector */}
        <div className="flex items-center bg-[#0B0B0B] border border-white/10 rounded-lg overflow-hidden h-10 w-28">
          <button 
            onClick={() => onUpdateQuantity(item.id, -1)}
            disabled={item.quantity <= 1}
            className="w-1/3 h-full flex items-center justify-center text-[#FF2D3B] hover:bg-white/5 transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-1/3 text-center text-white font-bold text-sm">
            {item.quantity}
          </span>
          <button 
            onClick={() => onUpdateQuantity(item.id, 1)}
            className="w-1/3 h-full flex items-center justify-center text-green-500 hover:bg-white/5 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Total & Remove */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[#A1A1A1] text-xs mb-1">Item Total</div>
            <div className="text-white font-bold text-lg">₹{itemTotal}</div>
          </div>
          
          <button 
            onClick={() => onRemove(item.id)}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#FF2D3B] hover:bg-[#FF2D3B]/10 transition-colors"
            title="Remove Item"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
