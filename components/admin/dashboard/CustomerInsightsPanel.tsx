"use client";

import { Users, UserPlus, Repeat, UserCheck, UserX } from "lucide-react";
import type { AdminDashboard } from "@/services/adminApi";
import AnimatedNumber from "./AnimatedNumber";
import { PanelSkeleton } from "./Skeleton";

export default function CustomerInsightsPanel({
  insights,
  loading,
}: {
  insights?: AdminDashboard["customerInsights"];
  loading?: boolean;
}) {
  const cards = [
    { label: "New Users", value: insights?.new_today ?? 0, icon: UserPlus, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Returning", value: insights?.returning ?? 0, icon: Repeat, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Active (30d)", value: insights?.active_30d ?? 0, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Blocked", value: insights?.blocked ?? 0, icon: UserX, color: "text-red-500", bg: "bg-red-50" },
  ];

  return (
    <section className="bg-white border border-border rounded-2xl p-5 shadow-sm">
      <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" /> Customer Insights
      </h2>
      {loading ? (
        <PanelSkeleton rows={2} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-xl border border-border bg-section p-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${c.bg}`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xl font-black text-foreground tabular-nums">
                <AnimatedNumber value={c.value} />
              </p>
              <p className="text-[11px] font-bold text-gray-text">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
