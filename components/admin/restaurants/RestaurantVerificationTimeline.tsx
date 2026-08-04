"use client";

import { CheckCircle2, XCircle, Ban, PlayCircle, Circle } from "lucide-react";
import { formatDate } from "@/services/adminApi";
import type { AdminRestaurantVerificationEvent } from "@/services/adminApi";

const iconFor = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes("approve")) return CheckCircle2;
  if (a.includes("reject")) return XCircle;
  if (a.includes("suspend")) return Ban;
  if (a.includes("activate")) return PlayCircle;
  return Circle;
};

const colorFor = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes("approve") || a.includes("activate")) return "text-emerald-600 bg-emerald-50";
  if (a.includes("reject") || a.includes("suspend")) return "text-red-600 bg-red-50";
  return "text-primary bg-primary/10";
};

export default function RestaurantVerificationTimeline({ events }: { events: AdminRestaurantVerificationEvent[] }) {
  if (!events?.length) {
    return <p className="text-sm text-gray-text">No verification history yet.</p>;
  }

  return (
    <ol className="relative border-l-2 border-border ml-3 space-y-5">
      {events.map((event) => {
        const Icon = iconFor(event.action);
        return (
          <li key={event.id} className="ml-5">
            <span
              className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${colorFor(event.action)}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>
            <p className="text-sm font-bold text-foreground capitalize">{event.action.replace(/[._]/g, " ")}</p>
            <p className="text-xs text-gray-text">{event.created_at ? formatDate(event.created_at) : "Time not recorded"}</p>
            {(event.actor_name || event.message) && (
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                {event.actor_name ? `By ${event.actor_name}` : ""}
                {event.message ? ` — ${event.message}` : ""}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
