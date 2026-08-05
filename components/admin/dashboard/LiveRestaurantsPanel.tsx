"use client";

import { Store, Clock, Star } from "lucide-react";
import { PanelSkeleton } from "./Skeleton";
import type { AdminDashboard } from "@/services/adminApi";

type LiveRestaurant = NonNullable<AdminDashboard["liveRestaurants"]>[number];

const BUSY_THRESHOLD = 5;

function statusOf(r: LiveRestaurant) {
  if (!r.is_active) return { label: "Closed", dot: "bg-gray-400", text: "text-gray-text", bg: "bg-section" };
  if (r.queue >= BUSY_THRESHOLD) return { label: "Busy", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
  return { label: "Open", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
}

export default function LiveRestaurantsPanel({
  restaurants,
  loading,
}: {
  restaurants?: LiveRestaurant[];
  loading?: boolean;
}) {
  const rows = restaurants || [];

  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2">
          <Store className="w-4 h-4 text-primary" /> Live Restaurants
        </h2>
        <span className="text-xs font-bold text-gray-text">Ranked by active order queue</span>
      </div>
      {loading ? (
        <PanelSkeleton rows={4} />
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar">
          {rows.length === 0 && <p className="text-sm text-gray-text">No approved restaurants yet.</p>}
          {rows.map((r) => {
            const s = statusOf(r);
            return (
              <div key={r.id} className="rounded-xl border border-border bg-section px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-foreground truncate">{r.name}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-gray-text">
                  <span>{r.queue} order{r.queue === 1 ? "" : "s"} in queue</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-0.5">
                      <Clock className="w-3 h-3" /> {r.avg_prep_minutes}m
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500" /> {Number(r.rating || 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
