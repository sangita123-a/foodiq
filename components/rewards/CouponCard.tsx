"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle2, Tag } from "lucide-react";

export type CouponType = {
  id: string;
  code: string;
  title: string;
  discountValue: string;
  minOrder: string;
  expiry: string;
  terms: string;
  isExpired: boolean;
};

type Props = {
  coupon: CouponType;
};

export default function CouponCard({ coupon }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (coupon.isExpired) return;
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-3xl p-6 border-2 transition-all duration-300 flex flex-col h-full ${
        coupon.isExpired 
          ? "bg-white border-[#E5E7EB] opacity-60 grayscale" 
          : "bg-[#F8FAFC] border-dashed border-primary/40 hover:border-primary shadow-[0_0_15px_rgba(252,128,25,0.05)] hover:shadow-[0_0_20px_rgba(252,128,25,0.15)]"
      }`}
    >
      {coupon.isExpired && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] z-10 border-4 border-red-500/50 text-red-500/80 font-black text-4xl px-4 py-2 uppercase tracking-widest rounded-lg">
          Expired
        </div>
      )}

      {/* Top Badges */}
      <div className="flex justify-between items-start mb-4">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-sm ${
          coupon.isExpired ? "bg-[#F8FAFC] border-[#E5E7EB] text-[#6B7280]" : "bg-primary/10 border-primary/20 text-primary"
        }`}>
          <Tag className="w-4 h-4" />
          {coupon.code}
        </div>
        
        <button 
          onClick={handleCopy}
          disabled={coupon.isExpired}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            copied ? "bg-green-500/20 text-green-400" : "bg-[#F8FAFC] hover:bg-[#F8FAFC] text-[#6B7280]"
          } ${coupon.isExpired ? "opacity-50 cursor-not-allowed" : ""}`}
          title="Copy Code"
        >
          {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Details */}
      <div className="mb-6 flex-1">
        <h3 className="text-xl font-bold text-white mb-2">{coupon.title}</h3>
        <div className="text-2xl font-black text-green-400 mb-4">{coupon.discountValue}</div>
        
        <ul className="space-y-2 text-xs font-bold text-[#6B7280]">
          <li>• Min. Order: {coupon.minOrder}</li>
          <li>• Valid till: {coupon.expiry}</li>
        </ul>
      </div>

      <div className="border-t border-[#E5E7EB] pt-4 mt-auto">
        <p className="text-[10px] text-[#9CA3AF] leading-tight mb-4">{coupon.terms}</p>
        <button 
          disabled={coupon.isExpired}
          className={`w-full py-3 rounded-xl font-bold transition-colors ${
            coupon.isExpired 
              ? "bg-[#F8FAFC] text-[#9CA3AF] cursor-not-allowed" 
              : "bg-[#F8FAFC] hover:bg-primary text-[#111827] border border-[#E5E7EB] hover:border-primary"
          }`}
        >
          Apply Coupon
        </button>
      </div>

    </motion.div>
  );
}
