"use client";

import { motion } from "framer-motion";
import { Offer } from "./types";
import { Sparkles, ArrowRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { OFFER_FALLBACK } from "@/lib/images";

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
      <div className="absolute inset-0 bg-[#F8FAFC]">
        {offer.bannerImage ? (
          <SafeImage
            src={offer.bannerImage}
            fallback={OFFER_FALLBACK}
            alt={offer.name}
            className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#FFFFFF] to-[#E23744]/20"></div>
        )}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] via-[#FFFFFF]/70 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#FFFFFF] via-[#FFFFFF]/40 to-transparent"></div>

      {/* Content */}
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-[#E23744] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Featured Campaign
          </span>
          <span className="bg-[#F8FAFC] backdrop-blur-md text-[#111827] text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#E5E7EB]">
            {offer.type}
          </span>
        </div>

        <h2 className="text-3xl md:text-5xl font-black text-[#111827] mb-2 max-w-2xl leading-tight">
          {offer.name}
        </h2>
        <p className="text-[#6B7280] max-w-xl mb-6 line-clamp-2">
          {offer.description}
        </p>

        <div className="flex items-center gap-4">
          <div className="bg-[#F8FAFC] backdrop-blur-md border border-[#E5E7EB] rounded-xl px-5 py-3 flex flex-col">
            <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-wider">Coupon Code</span>
            <span className="text-xl font-black text-[#111827] uppercase tracking-widest">{offer.code}</span>
          </div>

          <button className="bg-[#E23744] hover:bg-[#C81E34] text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-[#E23744]/20 h-full">
            View Analytics <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
