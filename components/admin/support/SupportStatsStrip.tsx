"use client";

import { Inbox, Clock, CheckCircle2, AlertTriangle, CalendarClock, Timer, MessageCircle, Radio, ShieldAlert, Wallet } from "lucide-react";
import StatCard from "@/components/admin/dashboard/StatCard";
import type { SupportCenterAnalytics } from "@/services/supportCenterApi";

export default function SupportStatsStrip({
  analytics,
  loading,
}: {
  analytics: SupportCenterAnalytics | undefined;
  loading?: boolean;
}) {
  const tiles: Array<{
    key: keyof SupportCenterAnalytics;
    label: string;
    icon: typeof Inbox;
    color?: string;
    bg?: string;
    format?: (n: number) => string;
  }> = [
    { key: "open_tickets", label: "Open", icon: Inbox, color: "text-amber-600", bg: "bg-amber-50" },
    { key: "in_progress_tickets", label: "In Progress", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "resolved_tickets", label: "Resolved", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "critical_tickets", label: "Critical", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { key: "today_tickets", label: "Today", icon: CalendarClock, color: "text-primary", bg: "bg-primary/10" },
    {
      key: "avg_resolution_hours",
      label: "Avg Resolution",
      icon: Timer,
      color: "text-slate-600",
      bg: "bg-slate-100",
      format: (n) => `${n.toFixed(1)}h`,
    },
    { key: "live_chats", label: "Live Chats", icon: MessageCircle, color: "text-blue-600", bg: "bg-blue-50" },
    { key: "agents_online", label: "Agents Online", icon: Radio, color: "text-emerald-600", bg: "bg-emerald-50" },
    { key: "sos_active", label: "SOS Active", icon: ShieldAlert, color: "text-red-700", bg: "bg-red-50" },
    { key: "refunds_pending", label: "Refunds Pending", icon: Wallet, color: "text-amber-700", bg: "bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {tiles.map((tile) => (
        <StatCard
          key={tile.key}
          label={tile.label}
          value={analytics ? Number(analytics[tile.key] || 0) : 0}
          icon={tile.icon}
          color={tile.color}
          bg={tile.bg}
          format={tile.format}
          loading={loading}
        />
      ))}
    </div>
  );
}
