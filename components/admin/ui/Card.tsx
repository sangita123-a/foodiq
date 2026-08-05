import type { ReactNode, HTMLAttributes } from "react";

type CardVariant = "default" | "glass" | "elevated" | "flat";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
};

const VARIANT_CLASS: Record<CardVariant, string> = {
  default: "bg-white border border-border shadow-[var(--shadow-admin-soft)]",
  elevated: "bg-white border border-border shadow-[var(--shadow-admin-lifted)]",
  glass: "bg-[var(--glass-surface)] backdrop-blur-xl border border-[var(--glass-border)] shadow-[var(--shadow-admin-soft)]",
  flat: "bg-white border border-border",
};

const PADDING_CLASS: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export default function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl ${VARIANT_CLASS[variant]} ${PADDING_CLASS[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-black text-foreground tracking-tight truncate">{title}</h3>
          {subtitle && <p className="text-xs text-gray-text mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
