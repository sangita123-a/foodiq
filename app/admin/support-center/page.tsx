"use client";

import { useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Headphones, Radio, WifiOff } from "lucide-react";
import { useSupportTicketList, useSupportCenterAnalytics } from "@/hooks/useSupportTickets";
import { useSupportSocket } from "@/hooks/useSupportSocket";
import { useSocket } from "@/hooks/useSocket";
import SupportStatsStrip from "@/components/admin/support/SupportStatsStrip";
import SupportFilterBar from "@/components/admin/support/SupportFilterBar";
import SupportTable from "@/components/admin/support/SupportTable";
import SupportTicketDrawer from "@/components/admin/support/SupportTicketDrawer";
import type { UnifiedTicket, UnifiedTicketFilters } from "@/services/supportCenterApi";

export default function SupportCenterPage() {
  const [filters, setFilters] = useState<UnifiedTicketFilters>({});
  const [selected, setSelected] = useState<UnifiedTicket | null>(null);

  const { data: tickets, isLoading } = useSupportTicketList(filters);
  const { data: analytics, isLoading: analyticsLoading } = useSupportCenterAnalytics();
  const { connected } = useSocket();
  useSupportSocket(selected?.id || null);

  return (
    <AdminShell title="Support Center">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Headphones className="w-6 h-6 text-primary" /> Support Center
          </h1>
          <p className="text-sm text-gray-text">
            Unified tickets, live chat, and escalations across customers, restaurants, and delivery partners.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full ${
            connected ? "bg-emerald-50 text-emerald-700" : "bg-section text-gray-text"
          }`}
        >
          {connected ? <Radio className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {connected ? "Live" : "Offline"}
        </span>
      </div>

      <SupportStatsStrip analytics={analytics} loading={analyticsLoading} />
      <SupportFilterBar filters={filters} onChange={setFilters} />
      <SupportTable
        tickets={tickets || []}
        loading={isLoading}
        selectedId={selected?.id || null}
        onSelect={setSelected}
      />

      {selected ? (
        <SupportTicketDrawer
          ticketId={selected.id}
          source={selected.source}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </AdminShell>
  );
}
