"use client";

import { User, Store, Bike, Inbox } from "lucide-react";
import { Badge, EmptyState, SkeletonRows } from "@/components/admin/ui";
import type { UnifiedTicket } from "@/services/supportCenterApi";

const PRIORITY_STYLE: Record<string, string> = {
  low: "text-gray-text",
  medium: "text-foreground",
  high: "text-orange-600",
  urgent: "text-red-600",
};

const REQUESTER_ICON: Record<UnifiedTicket["requester_type"], React.ComponentType<{ className?: string }>> = {
  customer: User,
  restaurant: Store,
  partner: Bike,
};

const COLUMN_COUNT = 9;

function requesterLabel(t: UnifiedTicket) {
  if (t.requester_type === "partner") return t.partner_name || "Delivery Partner";
  if (t.requester_type === "restaurant") return t.restaurant_name || "Restaurant";
  return t.customer_name || "Customer";
}

export default function SupportTable({
  tickets,
  loading,
  selectedId,
  onSelect,
}: {
  tickets: UnifiedTicket[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (ticket: UnifiedTicket) => void;
}) {
  return (
    <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-[var(--shadow-admin-soft)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-section border-b border-border">
            <tr>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Ticket</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Requester</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Subject</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Category</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Priority</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Agent</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Created</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows rows={8} columns={COLUMN_COUNT} />}

            {!loading &&
              tickets.map((t) => {
                const Icon = REQUESTER_ICON[t.requester_type];
                const isSelected = selectedId === t.id;
                return (
                  <tr
                    key={`${t.source}:${t.id}`}
                    onClick={() => onSelect(t)}
                    className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                      isSelected ? "bg-primary/5" : "hover:bg-section/50"
                    }`}
                  >
                    <td className="p-4 font-mono text-xs font-bold text-primary whitespace-nowrap">
                      {t.ticket_number}
                      {t.unread_count ? (
                        <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                          {t.unread_count}
                        </span>
                      ) : null}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                        <Icon className="w-3.5 h-3.5 text-gray-text" />
                        {requesterLabel(t)}
                      </span>
                    </td>
                    <td className="p-4 max-w-[220px] truncate text-foreground">{t.subject}</td>
                    <td className="p-4 text-gray-text whitespace-nowrap">{t.category}</td>
                    <td className={`p-4 font-bold capitalize ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</td>
                    <td className="p-4 text-gray-text whitespace-nowrap">{t.agent_name || "Unassigned"}</td>
                    <td className="p-4">
                      <Badge status={t.status}>{t.status.replace("_", " ")}</Badge>
                    </td>
                    <td className="p-4 text-gray-text whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-text whitespace-nowrap">
                      {new Date(t.updated_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {!loading && !tickets.length && (
          <EmptyState icon={Inbox} title="No tickets found" description="Try adjusting your search or filters." />
        )}
      </div>
    </div>
  );
}
