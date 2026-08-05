"use client";

import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/services/adminApi";
import type { AdminDashboard } from "@/services/adminApi";
import { PanelSkeleton } from "./Skeleton";

type SalesAnalyticsPanelProps = {
  stats?: AdminDashboard;
  loading?: boolean;
};

export default function SalesAnalyticsPanel({ stats, loading }: SalesAnalyticsPanelProps) {
  const weekly = stats?.weekly || [];
  const peakHours = useMemo(() => {
    const byHour = new Map<number, number>();
    for (const p of stats?.peakHours || []) byHour.set(p.hour, p.orders);
    return Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: byHour.get(h) || 0 }));
  }, [stats?.peakHours]);

  const weeklyMax = Math.max(...weekly.map((d) => d.revenue), 1);
  const hourMax = Math.max(...peakHours.map((h) => h.orders), 1);
  const busiestHour = peakHours.reduce((best, h) => (h.orders > best.orders ? h : best), peakHours[0]);

  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" /> Sales Analytics
      </h2>

      {loading ? (
        <PanelSkeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Today", value: stats?.todaysRevenue ?? 0 },
              { label: "This Week", value: stats?.weeklyRevenue ?? 0 },
              { label: "This Month", value: stats?.monthlyRevenue ?? 0 },
              { label: "This Year", value: stats?.yearlyRevenue ?? 0 },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-section p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{c.label}</p>
                <p className="text-lg font-black text-foreground">{formatCurrency(c.value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Weekly Revenue Trend</p>
              <div className="h-40 flex items-end gap-2">
                {weekly.length === 0 && <p className="text-sm text-gray-text">No weekly data yet.</p>}
                {weekly.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full max-w-[32px] bg-primary/20 border border-primary/30 rounded-t-lg transition-all duration-500"
                      style={{ height: `${Math.max(6, Math.round((d.revenue / weeklyMax) * 100))}%` }}
                      title={formatCurrency(d.revenue)}
                    />
                    <span className="text-[10px] font-bold text-gray-text">
                      {new Date(d.day).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">
                Peak Hours (today){busiestHour?.orders ? ` · busiest ${busiestHour.hour}:00` : ""}
              </p>
              <div className="h-40 flex items-end gap-[3px]">
                {peakHours.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-[#EAEAEA] border border-[#D4D4D4] rounded-t transition-all duration-500"
                      style={{ height: `${h.orders ? Math.max(6, Math.round((h.orders / hourMax) * 100)) : 2}%` }}
                      title={`${h.hour}:00 — ${h.orders} orders`}
                    />
                    {h.hour % 6 === 0 && (
                      <span className="text-[9px] font-bold text-gray-text">{h.hour}h</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
