"use client";

import { useState } from "react";
import { Copy, Share2, Users } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  code: string;
  rewardPoints: number;
  history?: Array<{ referee_name?: string; created_at?: string; points_awarded?: number }>;
};

export default function ReferralPanel({ code, rewardPoints, history = [] }: Props) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast("Referral code copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy code", "error");
    }
  };

  const share = async () => {
    const text = `Join Foodiq with my code ${code} and we both earn reward points!`;
    if (navigator.share) {
      await navigator.share({ title: "Foodiq Referral", text });
    } else {
      copy();
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-[#E23744]" />
        <h2 className="text-lg font-black text-[#111827]">Refer & Earn</h2>
      </div>
      <p className="text-sm text-[#6B7280] mb-4">
        Share your code. You earn <strong>{rewardPoints} points</strong> and your friend gets a welcome bonus.
      </p>

      <div className="flex gap-2 mb-6">
        <div className="flex-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 font-mono font-black text-[#111827] tracking-widest">
          {code}
        </div>
        <button type="button" onClick={copy} className="px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC]">
          <Copy className="w-4 h-4" />
        </button>
        <button type="button" onClick={share} className="px-4 py-3 rounded-xl bg-[#E23744] text-white">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Referral History</p>
          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between text-sm border border-[#E5E7EB] rounded-xl px-3 py-2">
                <span className="font-bold text-[#111827]">{h.referee_name || "New user"}</span>
                <span className="text-[#E23744] font-bold">+{h.points_awarded || rewardPoints} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
