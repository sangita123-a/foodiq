"use client";

import { useMemo } from "react";
import { Bell, ShoppingBag, UserPlus, RotateCcw, MessageCircleWarning } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminData";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import { adminGet, fetchFeedbackInbox, formatDate } from "@/services/adminApi";
import { PanelSkeleton } from "./Skeleton";

type Activity = {
  id: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  text: string;
  at?: string;
};

export default function NotificationsActivityPanel() {
  const hasToken = useAuthToken();
  const { data: orders } = useAdminList<Array<Record<string, unknown>>>("/api/admin/orders");
  const { data: users } = useAdminList<Array<Record<string, unknown>>>("/api/admin/users");
  const { data: refunds } = useSWR(
    hasToken ? "/api/admin/payments/refunds" : null,
    () => adminGet<Array<Record<string, unknown>>>("/api/admin/payments/refunds"),
    { revalidateOnFocus: false, refreshInterval: 60000 }
  );
  const { data: feedback } = useSWR(
    hasToken ? "/api/admin/feedback?type=support" : null,
    () => fetchFeedbackInbox("support"),
    { revalidateOnFocus: false, refreshInterval: 60000 }
  );

  const activities = useMemo(() => {
    const items: Activity[] = [];

    for (const o of (orders || []).slice(0, 5)) {
      items.push({
        id: `order-${o.id}`,
        icon: ShoppingBag,
        color: "text-primary",
        bg: "bg-primary/10",
        text: `New order #${String(o.id).slice(0, 8)} from ${o.customer_name || "a customer"}`,
        at: o.created_at as string | undefined,
      });
    }
    for (const u of (users || []).slice(0, 5)) {
      items.push({
        id: `user-${u.id}`,
        icon: UserPlus,
        color: "text-sky-600",
        bg: "bg-sky-50",
        text: `${u.full_name || u.email || "New customer"} registered`,
        at: u.created_at as string | undefined,
      });
    }
    for (const r of (refunds || []).slice(0, 5)) {
      items.push({
        id: `refund-${r.id}`,
        icon: RotateCcw,
        color: "text-amber-600",
        bg: "bg-amber-50",
        text: `Refund request for order #${String(r.order_id || r.id).slice(0, 8)}`,
        at: r.created_at as string | undefined,
      });
    }
    for (const f of (feedback?.support || []).slice(0, 5)) {
      items.push({
        id: `complaint-${f.id}`,
        icon: MessageCircleWarning,
        color: "text-red-500",
        bg: "bg-red-50",
        text: `Support complaint: ${String(f.subject || f.message || "New ticket").slice(0, 60)}`,
        at: f.created_at as string | undefined,
      });
    }

    return items
      .filter((a) => a.at)
      .sort((a, b) => new Date(b.at as string).getTime() - new Date(a.at as string).getTime())
      .slice(0, 8);
  }, [orders, users, refunds, feedback]);

  const loading = !orders && !users;

  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
        <Bell className="w-4 h-4 text-primary" /> Recent Activity
      </h2>
      {loading ? (
        <PanelSkeleton rows={5} />
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-text">No recent activity.</p>
      ) : (
        <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar">
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border bg-section px-3 py-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.bg}`}>
                <a.icon className={`w-4 h-4 ${a.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-foreground leading-snug">{a.text}</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">{formatDate(a.at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
