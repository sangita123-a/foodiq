"use client";

import { Trophy, TrendingUp, TrendingDown, Star } from "lucide-react";
import { formatCurrency } from "@/services/adminApi";
import type { AdminDashboard } from "@/services/adminApi";
import { PanelSkeleton } from "./Skeleton";

type TopRestaurantsPanelProps = {
  restaurants?: AdminDashboard["topRestaurants"];
  loading?: boolean;
};

export default function TopRestaurantsPanel({ restaurants, loading }: TopRestaurantsPanelProps) {
  const rows = restaurants || [];

  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-primary" /> Top Restaurants
      </h2>
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-text">No revenue in the last 30 days yet.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-section px-3 py-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{r.name}</p>
                  <p className="text-[11px] text-gray-text">
                    {r.orders} orders · <Star className="w-3 h-3 inline text-yellow-500 -mt-0.5" /> {Number(r.rating || 0).toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-foreground">{formatCurrency(r.revenue)}</p>
                <p className={`text-[11px] font-bold inline-flex items-center gap-0.5 ${r.growth_pct >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {r.growth_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(r.growth_pct)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
