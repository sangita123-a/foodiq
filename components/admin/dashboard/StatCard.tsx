import type { LucideIcon } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";
import { StatCardSkeleton } from "./Skeleton";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  format?: (n: number) => string;
  hint?: string;
  loading?: boolean;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-primary",
  bg = "bg-primary/10",
  format,
  hint,
  loading,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-border shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 ${bg}`} />
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] leading-tight max-w-[70%]">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
      </div>
      <p className="text-[1.7rem] leading-none font-black text-foreground tabular-nums tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="text-xs text-gray-text mt-2">{hint}</p>}
    </div>
  );
}
