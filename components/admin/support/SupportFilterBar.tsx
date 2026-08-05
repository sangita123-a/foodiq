"use client";

import { Search } from "lucide-react";
import type { UnifiedTicketFilters } from "@/services/supportCenterApi";

export default function SupportFilterBar({
  filters,
  onChange,
}: {
  filters: UnifiedTicketFilters;
  onChange: (next: UnifiedTicketFilters) => void;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-3 mb-4 flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-text" />
        <input
          type="text"
          placeholder="Search ticket #, subject, customer, partner, restaurant..."
          value={filters.search || ""}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-section border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-gray-text focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <select
        value={filters.requesterType || ""}
        onChange={(e) => onChange({ ...filters, requesterType: e.target.value as UnifiedTicketFilters["requesterType"] })}
        className="bg-section border border-border rounded-xl px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">All Requesters</option>
        <option value="customer">Customer</option>
        <option value="restaurant">Restaurant</option>
        <option value="partner">Delivery Partner</option>
      </select>

      <select
        value={filters.status || ""}
        onChange={(e) => onChange({ ...filters, status: e.target.value as UnifiedTicketFilters["status"] })}
        className="bg-section border border-border rounded-xl px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      <select
        value={filters.priority || ""}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as UnifiedTicketFilters["priority"] })}
        className="bg-section border border-border rounded-xl px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">All Priorities</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
