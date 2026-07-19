"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Offer } from "./types";
import { MoreVertical, Calendar, Users, Eye, Edit2, Copy, Pause, Play, Trash2, Tag } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { OFFER_FALLBACK } from "@/lib/images";

interface OfferCardProps {
  offer: Offer;
  onUpdateStatus: (id: string, newStatus: Offer["status"]) => void;
  onDelete: (id: string) => void;
}

export default function OfferCard({ offer, onUpdateStatus, onDelete }: OfferCardProps) {
  
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Scheduled": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Expired": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Paused": return "bg-[#E23744]/20 text-[#E23744] border-[#E23744]/30";
      default: return "bg-gray-500/20 text-[#6B7280] border-[#E5E7EB]/30";
    }
  };

  const remaining = offer.usageLimit - offer.usageCount;
  const progress = (offer.usageCount / offer.usageLimit) * 100;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-[#FFFFFF] rounded-3xl border transition-all relative overflow-hidden group ${offer.status === 'Expired' ? 'opacity-60 border-[#E5E7EB]' : 'border-[#E5E7EB] hover:border-[#E5E7EB] hover:shadow-xl'}`}
    >
      {/* Banner */}
      <div className="h-32 w-full relative overflow-hidden bg-[#F8FAFC]">
        {offer.bannerImage ? (
          <SafeImage src={offer.bannerImage} fallback={OFFER_FALLBACK} alt={offer.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E23744]/10 to-[#F8FAFC] flex items-center justify-center">
            <Tag className="w-12 h-12 text-[#E23744]/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#FFFFFF] to-transparent"></div>
        
        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(offer.status)}`}>
            {offer.status}
          </span>
        </div>

        {/* Menu Toggle */}
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md border border-[#E5E7EB] flex items-center justify-center text-white hover:bg-[#E23744] transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-10 w-48 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl shadow-2xl overflow-hidden z-20 flex flex-col"
              >
                <button onClick={() => setShowMenu(false)} className="px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] text-left flex items-center gap-2 border-b border-[#E5E7EB]"><Eye className="w-4 h-4 text-[#6B7280]"/> View Details</button>
                <button onClick={() => setShowMenu(false)} className="px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] text-left flex items-center gap-2 border-b border-[#E5E7EB]"><Edit2 className="w-4 h-4 text-blue-400"/> Edit Offer</button>
                <button onClick={() => setShowMenu(false)} className="px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] text-left flex items-center gap-2 border-b border-[#E5E7EB]"><Copy className="w-4 h-4 text-[#6B7280]"/> Duplicate</button>
                
                {offer.status === 'Active' && (
                  <button onClick={() => { onUpdateStatus(offer.id, "Paused"); setShowMenu(false); }} className="px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] text-left flex items-center gap-2 border-b border-[#E5E7EB]"><Pause className="w-4 h-4 text-[#E23744]"/> Pause Offer</button>
                )}
                {offer.status === 'Paused' && (
                  <button onClick={() => { onUpdateStatus(offer.id, "Active"); setShowMenu(false); }} className="px-4 py-3 text-sm text-[#6B7280] hover:text-[#111827] hover:bg-[#F8FAFC] text-left flex items-center gap-2 border-b border-[#E5E7EB]"><Play className="w-4 h-4 text-green-400"/> Resume Offer</button>
                )}

                <button onClick={() => { onDelete(offer.id); setShowMenu(false); }} className="px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 text-left flex items-center gap-2"><Trash2 className="w-4 h-4"/> Delete</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-2">
        <h3 className="text-xl font-black text-[#111827] mb-1 line-clamp-1">{offer.name}</h3>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-bold text-[#E23744] bg-[#E23744]/10 px-2 py-0.5 rounded uppercase tracking-wider">{offer.code}</span>
          <span className="text-xs text-[#9CA3AF]">• {offer.type}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E5E7EB]">
            <span className="block text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1">Discount</span>
            <span className="text-[#111827] font-bold">{offer.type === 'Percentage Discount' ? `${offer.value}% OFF` : offer.type === 'Flat Discount' ? `₹${offer.value} OFF` : offer.type === 'Free Delivery' ? 'FREE DEL' : 'BOGO'}</span>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E5E7EB]">
            <span className="block text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1">Min Order</span>
            <span className="text-[#111827] font-bold">₹{offer.minOrderValue}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-[#6B7280]">
              <Calendar className="w-4 h-4" />
              <span>Validity</span>
            </div>
            <span className="text-[#111827] font-bold text-xs">{offer.startDate} - {offer.endDate}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#6B7280]">
                <Users className="w-4 h-4" />
                <span>Redemptions</span>
              </div>
              <span className="text-[#111827] font-bold">{offer.usageCount} <span className="text-[#9CA3AF] font-normal">/ {offer.usageLimit}</span></span>
            </div>
            
            <div className="w-full h-1.5 bg-[#F8FAFC] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`h-full rounded-full ${progress >= 90 ? 'bg-red-500' : progress >= 75 ? 'bg-[#E23744]' : 'bg-[#E23744]'}`}
              />
            </div>
            <p className="text-right text-[10px] text-[#9CA3AF] font-bold uppercase">{remaining} uses left</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
