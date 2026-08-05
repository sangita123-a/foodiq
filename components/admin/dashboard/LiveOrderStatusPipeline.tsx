"use client";

import { ChefHat, PackageCheck, Bike, Navigation, CheckCircle2, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PanelSkeleton } from "./Skeleton";
import AnimatedNumber from "./AnimatedNumber";

type Stage = {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

const STAGES: Stage[] = [
  { key: "preparing", label: "Preparing", icon: ChefHat, color: "text-amber-600", bg: "bg-amber-50" },
  { key: "ready for pickup", label: "Ready", icon: PackageCheck, color: "text-sky-600", bg: "bg-sky-50" },
  { key: "picked up", label: "Picked Up", icon: Bike, color: "text-violet-600", bg: "bg-violet-50" },
  { key: "on the way", label: "On The Way", icon: Navigation, color: "text-primary", bg: "bg-primary/10" },
  { key: "delivered", label: "Delivered", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
  { key: "cancelled", label: "Cancelled", icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
];

type LiveOrderStatusPipelineProps = {
  statusCounts?: Record<string, number>;
  loading?: boolean;
};

export default function LiveOrderStatusPipeline({ statusCounts, loading }: LiveOrderStatusPipelineProps) {
  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-foreground">Live Order Status</h2>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
        </span>
      </div>
      {loading ? (
        <PanelSkeleton rows={2} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map((stage) => {
            const count = statusCounts?.[stage.key] ?? 0;
            return (
              <div key={stage.key} className="rounded-xl border border-border bg-section p-3 text-center">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${stage.bg}`}>
                  <stage.icon className={`w-4 h-4 ${stage.color}`} />
                </div>
                <p className="text-xl font-black text-foreground tabular-nums">
                  <AnimatedNumber value={count} />
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-text mt-0.5">
                  {stage.label}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
