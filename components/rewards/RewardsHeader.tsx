"use client";

import { Gift } from "lucide-react";

export default function RewardsHeader() {
  return (
    <div className="mb-10 text-center md:text-left">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3 flex items-center justify-center md:justify-start gap-4">
        <Gift className="w-10 h-10 md:w-12 md:h-12 text-[#FC8019]" />
        Coupons & Rewards
      </h1>
      <p className="text-[#A1A1A1] text-lg">
        Save more on every order and earn exciting rewards.
      </p>
    </div>
  );
}
