"use client";

import {
  CheckCircle2,
  ChefHat,
  PackageCheck,
  Bike,
  Truck,
  Home,
  XCircle,
  RotateCcw,
  Circle,
  ShoppingBag,
  User,
} from "lucide-react";
import { formatDate } from "@/services/adminApi";
import type { AdminOrderTimelineEvent } from "@/services/adminApi";

const iconFor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("placed")) return ShoppingBag;
  if (s.includes("accept")) return CheckCircle2;
  if (s.includes("prepar")) return ChefHat;
  if (s === "ready" || s.includes("ready")) return PackageCheck;
  if (s.includes("partner")) return User;
  if (s.includes("picked")) return Bike;
  if (s.includes("way") || s.includes("delivery") && !s.includes("delivered")) return Truck;
  if (s.includes("delivered")) return Home;
  if (s.includes("cancel") || s.includes("reject")) return XCircle;
  if (s.includes("refund")) return RotateCcw;
  return Circle;
};

const colorFor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("cancel") || s.includes("reject")) return "text-red-600 bg-red-50";
  if (s.includes("refund")) return "text-rose-600 bg-rose-50";
  if (s.includes("delivered")) return "text-emerald-600 bg-emerald-50";
  return "text-primary bg-primary/10";
};

export default function OrderTimeline({ events }: { events: AdminOrderTimelineEvent[] }) {
  if (!events?.length) {
    return <p className="text-sm text-gray-text">No timeline events yet.</p>;
  }

  return (
    <ol className="relative border-l-2 border-border ml-3 space-y-5">
      {events.map((event, i) => {
        const Icon = iconFor(event.label);
        return (
          <li key={i} className="ml-5">
            <span
              className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${colorFor(event.label)}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>
            <p className="text-sm font-bold text-foreground">{event.label}</p>
            <p className="text-xs text-gray-text">
              {event.created_at ? formatDate(event.created_at) : "Time not recorded"}
              {event.derived && " · estimated from current status"}
            </p>
            {(event.changed_by_name || event.reason) && (
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {event.changed_by_name ? `By ${event.changed_by_name}` : event.source === "admin" ? "By admin" : ""}
                {event.reason ? ` — ${event.reason}` : ""}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
