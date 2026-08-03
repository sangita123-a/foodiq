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
    <div className="bg-white rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-black text-foreground tabular-nums">
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="text-xs text-gray-text mt-1">{hint}</p>}
    </div>
  );
}
