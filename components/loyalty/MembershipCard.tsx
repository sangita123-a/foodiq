"use client";

import { Crown, Gift, Star, Truck, Headphones, Ticket } from "lucide-react";
import type { MembershipTier } from "@/services/loyaltyApi";
import { TIER_COLORS } from "@/services/loyaltyApi";

type Props = {
  tier: MembershipTier;
  pointsBalance: number;
  lifetimePoints: number;
  progressPercent: number;
  pointsToNext: number | null;
  nextTierName?: string;
  expiryDate?: string | null;
};

export default function MembershipCard({
  tier,
  pointsBalance,
  lifetimePoints,
  progressPercent,
  pointsToNext,
  nextTierName,
  expiryDate,
}: Props) {
  const slug = tier.slug || "silver";
  const gradient = TIER_COLORS[slug] || TIER_COLORS.silver;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-gradient-to-br from-[#111827] to-[#1F2937] p-6 md:p-8 text-white shadow-2xl">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#E23744]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Membership</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r border ${gradient}`}>
              <Crown className="w-4 h-4" />
              <span className="font-black text-sm">{tier.name}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60 font-bold uppercase">Balance</p>
            <p className="text-3xl font-black">{pointsBalance.toLocaleString("en-IN")}</p>
            <p className="text-xs text-white/50">pts</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
            <p className="text-xs text-white/60 font-bold uppercase mb-1">Lifetime</p>
            <p className="text-xl font-black">{lifetimePoints.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur">
            <p className="text-xs text-white/60 font-bold uppercase mb-1">Expires</p>
            <p className="text-sm font-bold">{expiryDate ? new Date(expiryDate).toLocaleDateString("en-IN") : "1 year rolling"}</p>
          </div>
        </div>

        {nextTierName && pointsToNext != null && pointsToNext > 0 && (
          <div>
            <div className="flex justify-between text-xs font-bold text-white/70 mb-2">
              <span>Progress to {nextTierName}</span>
              <span>{pointsToNext.toLocaleString("en-IN")} pts left</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E23744] to-orange-400 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TierBenefitsList({ benefits }: { benefits: MembershipTier["benefits"] }) {
  const items = [
    { icon: Truck, label: "Free Delivery", active: benefits.free_delivery },
    { icon: Gift, label: `${benefits.extra_discount_percent || 0}% Extra Discount`, active: (benefits.extra_discount_percent || 0) > 0 },
    { icon: Headphones, label: "Priority Support", active: benefits.priority_support },
    { icon: Ticket, label: "Exclusive Coupons", active: benefits.exclusive_coupons },
    { icon: Star, label: `${benefits.birthday_reward_points || 0} Birthday Points`, active: (benefits.birthday_reward_points || 0) > 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-3 rounded-2xl border p-4 ${
            item.active
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-[#E5E7EB] bg-[#F8FAFC] text-[#9CA3AF]"
          }`}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
