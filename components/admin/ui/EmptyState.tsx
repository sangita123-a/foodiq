import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-section flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[#9CA3AF]" />
      </div>
      <p className="text-sm font-black text-foreground">{title}</p>
      {description && <p className="text-sm text-gray-text mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
