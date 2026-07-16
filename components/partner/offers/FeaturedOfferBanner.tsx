"use client";

import { motion } from "framer-motion";
import { Offer } from "./types";
import { Sparkles, ArrowRight } from "lucide-react";

interface FeaturedOfferBannerProps {
  offer: Offer | undefined;
}

export default function FeaturedOfferBanner({ offer }: FeaturedOfferBannerProps) {
  
  if (!offer) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden mb-8 group"
    >
      {/* Background Image */}
      <div className="absolute inset-0 bg-[#111]">
        {offer.bannerImage ? (
          <img 
            src={offer.bannerImage} 
            alt={offer.name} 
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#171717] to-primary/20"></div>
        )}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent"></div>

      {/* Content */}
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-primary text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Featured Campaign
          </span>
          <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-white/20">
            {offer.type}
          </span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-white mb-2 max-w-2xl leading-tight">
          {offer.name}
        </h2>
        <p className="text-gray-300 max-w-xl mb-6 line-clamp-2">
          {offer.description}
        </p>

        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-5 py-3 flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Coupon Code</span>
            <span className="text-xl font-black text-white uppercase tracking-widest">{offer.code}</span>
          </div>
          
          <button className="bg-primary hover:bg-[#e02633] text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-primary/20 h-full">
            View Analytics <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
