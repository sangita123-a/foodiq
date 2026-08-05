import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "error" | "info" | "violet" | "cyan";

const TONE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-section text-gray-text",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  error: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  violet: "bg-violet-50 text-violet-700",
  cyan: "bg-cyan-50 text-cyan-700",
};

/**
 * Single status→tone registry shared by every admin table (orders,
 * restaurants, support tickets, delivery partners, customers, payments...).
 * Keys are matched case-insensitively; unknown statuses fall back to
 * "neutral" so new backend status values never crash the UI.
 */
const STATUS_TONE: Record<string, BadgeTone> = {
  // orders
  pending: "warning",
  accepted: "info",
  preparing: "warning",
  "ready for pickup": "violet",
  "picked up": "cyan",
  "on the way": "info",
  "out for delivery": "info",
  delivered: "success",
  completed: "success",
  cancelled: "error",
  failed: "error",
  refunded: "neutral",
  // restaurants / partners / accounts
  active: "success",
  inactive: "neutral",
  online: "success",
  offline: "neutral",
  suspended: "error",
  blocked: "error",
  banned: "error",
  verified: "success",
  unverified: "warning",
  approved: "success",
  rejected: "error",
  // support tickets
  open: "warning",
  in_progress: "info",
  "in progress": "info",
  resolved: "success",
  closed: "neutral",
  escalated: "error",
  // payments
  paid: "success",
  unpaid: "warning",
  processing: "info",
};

export function toneForStatus(status?: string | null): BadgeTone {
  if (!status) return "neutral";
  return STATUS_TONE[status.toLowerCase()] ?? "neutral";
}

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  status?: string | null;
  className?: string;
  dot?: boolean;
};

/**
 * Pass either `status` (auto-resolves tone via the shared registry, label
 * defaults to children/status text) or an explicit `tone` for custom labels.
 */
export default function Badge({ children, tone, status, className = "", dot = false }: BadgeProps) {
  const resolvedTone = tone ?? toneForStatus(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize whitespace-nowrap ${TONE_CLASS[resolvedTone]} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
