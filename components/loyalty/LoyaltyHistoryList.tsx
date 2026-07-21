"use client";

import { SOURCE_LABELS } from "@/services/loyaltyApi";

type HistoryItem = {
  id: string;
  points: number;
  transaction_type: string;
  source?: string;
  created_at?: string;
};

export default function LoyaltyHistoryList({ items }: { items: HistoryItem[] }) {
  if (!items.length) {
    return <p className="text-sm text-gray-text text-center py-8">No reward activity yet. Place an order to start earning!</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((h) => {
        const earned = h.transaction_type === "earned";
        const label = SOURCE_LABELS[h.source || ""] || h.source || (earned ? "Points Earned" : "Points Redeemed");
        return (
          <div key={h.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-3 bg-white">
            <div>
              <p className="text-sm font-bold text-foreground">{label}</p>
              <p className="text-xs text-[#9CA3AF]">
                {h.created_at ? new Date(h.created_at).toLocaleString("en-IN") : "—"}
              </p>
            </div>
            <span className={`text-sm font-black ${earned ? "text-emerald-600" : "text-primary"}`}>
              {earned ? "+" : "-"}{h.points} pts
            </span>
          </div>
        );
      })}
    </div>
  );
}
