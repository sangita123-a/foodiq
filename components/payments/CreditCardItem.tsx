"use client";

import { motion } from "framer-motion";
import { Edit2, Trash2, Star, CheckCircle2 } from "lucide-react";

export type CardType = {
  id: string;
  name: string;
  maskedNumber: string;
  expiry: string;
  network: "Visa" | "Mastercard";
  isDefault: boolean;
};

type Props = {
  card: CardType;
  onEdit: (card: CardType) => void;
  onRemove: (id: string) => void;
  onSetDefault: (id: string) => void;
};

export default function CreditCardItem({ card, onEdit, onRemove, onSetDefault }: Props) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-[#F8FAFC] rounded-[24px] p-6 md:p-8 border hover:border-[#E5E7EB] transition-all duration-300 relative flex flex-col h-full group shadow-lg ${
        card.isDefault ? "border-primary/50 shadow-[0_0_15px_rgba(252,128,25,0.1)]" : "border-[#E5E7EB]"
      }`}
    >
      
      {/* Physical Card Representation */}
      <div className="bg-gradient-to-br from-[#222] to-[#111] border border-[#E5E7EB] rounded-2xl p-6 mb-8 relative overflow-hidden shadow-2xl">
        {/* Glow effect inside card */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F8FAFC] rounded-full blur-[40px] pointer-events-none"></div>

        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="w-12 h-8 bg-yellow-600/30 border border-yellow-500/20 rounded-md"></div>
          <span className="text-white font-bold italic text-lg tracking-wider opacity-80">
            {card.network}
          </span>
        </div>

        <div className="text-white text-xl md:text-2xl font-mono tracking-[0.2em] mb-6 relative z-10">
          {card.maskedNumber}
        </div>

        <div className="flex justify-between items-end relative z-10">
          <div>
            <div className="text-[10px] text-[#6B7280] uppercase tracking-widest mb-1">Card Holder</div>
            <div className="text-white font-bold uppercase tracking-widest text-sm">{card.name}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#6B7280] uppercase tracking-widest mb-1">Expires</div>
            <div className="text-white font-bold tracking-widest text-sm">{card.expiry}</div>
          </div>
        </div>
      </div>

      {card.isDefault && (
        <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Default
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-auto">
        <button 
          onClick={() => onEdit(card)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#ECECEC] bg-[#F8F9FA] px-4 py-3 text-sm font-bold text-[#1C1C1C] transition-all hover:border-[#FC8019]/30 hover:bg-white"
        >
          <Edit2 className="w-4 h-4" /> Edit
        </button>
        
        <button 
          onClick={() => onRemove(card.id)}
          className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-red-500/10"
        >
          <Trash2 className="w-4 h-4" /> Remove
        </button>

        {!card.isDefault && (
          <button 
            onClick={() => onSetDefault(card.id)}
            className="w-full mt-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-yellow-500/20"
          >
            <Star className="w-4 h-4" /> Set as Default
          </button>
        )}
      </div>

    </motion.div>
  );
}
