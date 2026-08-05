"use client";

import useSWR from "swr";
import { Activity, Database, Radio, CreditCard, Mail, MessageSquare, HardDrive, Map as MapIcon, Server } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { fetchMonitoringDashboard } from "@/services/monitoringApi";
import { PanelSkeleton } from "./Skeleton";

type ServiceState = { status?: string; [key: string]: unknown };

function statusColor(status?: string) {
  const s = (status || "").toLowerCase();
  if (["up", "healthy", "configured"].includes(s)) return { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
  if (["mock", "starting", "degraded"].includes(s)) return { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
  if (["down", "error"].includes(s)) return { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" };
  return { dot: "bg-gray-400", text: "text-gray-text", bg: "bg-section" };
}

export default function SystemHealthPanel() {
  const hasToken = useAuthToken();
  const { data, isLoading } = useSWR(
    hasToken ? "/api/monitoring/dashboard" : null,
    fetchMonitoringDashboard,
    { revalidateOnFocus: false, refreshInterval: 30000 }
  );

  const services = (data?.services || {}) as Record<string, ServiceState>;
  const mapsConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());

  const rows: Array<{ label: string; icon: LucideIcon; status?: string }> = [
    { label: "Backend", icon: Server, status: data?.status === "healthy" ? "up" : data?.status },
    { label: "Database", icon: Database, status: services.database?.status },
    { label: "Redis / Cache", icon: HardDrive, status: services.cache?.status },
    { label: "Socket", icon: Radio, status: services.socket?.status },
    { label: "Payment Gateway", icon: CreditCard, status: services.payment?.status },
    { label: "Email", icon: Mail, status: services.email?.status },
    { label: "SMS", icon: MessageSquare, status: services.sms?.status },
    { label: "Storage", icon: HardDrive, status: services.storage?.status },
    { label: "Google Maps", icon: MapIcon, status: mapsConfigured ? "configured" : "not configured" },
  ];

  return (
    <section className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-[var(--shadow-admin-soft)] hover:shadow-[var(--shadow-admin-lifted)] transition-shadow duration-200">
      <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" /> System Health
      </h2>
      {isLoading ? (
        <PanelSkeleton rows={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {rows.map((r) => {
            const c = statusColor(r.status);
            return (
              <div key={r.label} className="rounded-xl border border-border bg-section p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <r.icon className="w-3.5 h-3.5 text-gray-text shrink-0" />
                  <p className="text-[11px] font-bold text-foreground truncate">{r.label}</p>
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${c.bg} ${c.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} /> {r.status || "unknown"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
