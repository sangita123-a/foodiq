"use client";

import { useState } from "react";
import { Users, Copy, CheckCircle2 } from "lucide-react";
import useSWR from "swr";
import { fetchReferral } from "@/services/featuresApi";
import { getAccessToken } from "@/lib/accessToken";

export default function ReferBanner() {
  const [copied, setCopied] = useState(false);
  const authenticated = typeof window !== "undefined" && !!getAccessToken();
  const { data } = useSWR(authenticated ? "referral-stats" : null, fetchReferral);
  const referralCode = data?.code || "FOODIQ";
  const points = data?.reward_points || 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-primary to-primary-hover rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-card mt-12">
      <div className="absolute top-0 right-0 w-64 h-64 bg-section rounded-full blur-[60px] pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-10 relative z-10">
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-section rounded-2xl backdrop-blur-sm mb-6">
            <Users className="w-8 h-8 text-foreground" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Refer & Earn {points} Points!
          </h2>
          <p className="text-foreground/80 text-lg max-w-md mx-auto md:mx-0">
            Invite your friends to Foodiq. You both earn rewards when they join
            with your code.
          </p>
        </div>

        <div className="w-full md:w-auto bg-black/30 backdrop-blur-md border border-border p-6 rounded-3xl flex flex-col items-center">
          <p className="text-foreground/70 text-sm font-bold uppercase tracking-widest mb-3">
            Your Referral Code
          </p>

          <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl mb-6 border border-border">
            <span className="font-mono text-2xl font-black text-white px-4 tracking-widest">
              {referralCode}
            </span>
            <button
              onClick={handleCopy}
              className="p-3 bg-primary hover:bg-primary-hover rounded-xl text-white transition-colors"
              type="button"
              aria-label="Copy referral code"
            >
              {copied ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          {!authenticated ? (
            <p className="text-xs text-white/80">Sign in to get your personal code</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
