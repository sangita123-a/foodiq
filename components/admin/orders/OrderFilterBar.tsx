"use client";

import { useAdminList } from "@/hooks/useAdminData";
import type { AdminOrderFilters } from "@/services/adminApi";

const STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
  "On The Way",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const PAYMENT_METHODS = ["credit_card", "debit_card", "upi", "wallet", "cod", "net_banking", "razorpay"];
const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded", "partially_refunded"];
const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "latest", label: "Latest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount_high", label: "Highest amount" },
  { value: "amount_low", label: "Lowest amount" },
  { value: "delivery_time", label: "Delivery time" },
];

type Restaurant = { id: string; name: string };
type Partner = { id: string; full_name?: string };

const selectClass =
  "bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function OrderFilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: AdminOrderFilters;
  onChange: (patch: Partial<AdminOrderFilters>) => void;
  onClear: () => void;
}) {
  const { data: restaurants } = useAdminList<Restaurant[]>("/api/admin/restaurants");
  const { data: partners } = useAdminList<Partner[]>("/api/admin/delivery-partners?status=approved");

  const hasActiveFilters =
    !!filters.status ||
    !!filters.restaurant_id ||
    !!filters.delivery_partner_id ||
    !!filters.payment_method ||
    !!filters.payment_status ||
    !!filters.city ||
    !!filters.from ||
    !!filters.to;

  return (
    <div className="flex flex-wrap gap-2.5">
      <select
        value={filters.status || ""}
        onChange={(e) => onChange({ status: e.target.value })}
        className={selectClass}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.restaurant_id || ""}
        onChange={(e) => onChange({ restaurant_id: e.target.value })}
        className={selectClass}
        aria-label="Filter by restaurant"
      >
        <option value="">All restaurants</option>
        {(restaurants || []).map((r) => (
          <option key={r.id} value={r.id}>{r.name}</option>
        ))}
      </select>

      <select
        value={filters.delivery_partner_id || ""}
        onChange={(e) => onChange({ delivery_partner_id: e.target.value })}
        className={selectClass}
        aria-label="Filter by delivery partner"
      >
        <option value="">All partners</option>
        {(partners || []).map((p) => (
          <option key={p.id} value={p.id}>{p.full_name || p.id}</option>
        ))}
      </select>

      <select
        value={filters.payment_method || ""}
        onChange={(e) => onChange({ payment_method: e.target.value })}
        className={selectClass}
        aria-label="Filter by payment method"
      >
        <option value="">All payment methods</option>
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
        ))}
      </select>

      <select
        value={filters.payment_status || ""}
        onChange={(e) => onChange({ payment_status: e.target.value })}
        className={selectClass}
        aria-label="Filter by payment status"
      >
        <option value="">All payment statuses</option>
        {PAYMENT_STATUSES.map((s) => (
          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
        ))}
      </select>

      <input
        value={filters.city || ""}
        onChange={(e) => onChange({ city: e.target.value })}
        placeholder="City"
        className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Filter by city"
      />

      <input
        type="date"
        value={filters.from || ""}
        onChange={(e) => onChange({ from: e.target.value })}
        className={selectClass}
        aria-label="From date"
      />
      <input
        type="date"
        value={filters.to || ""}
        onChange={(e) => onChange({ to: e.target.value })}
        className={selectClass}
        aria-label="To date"
      />

      <select
        value={filters.sort || "latest"}
        onChange={(e) => onChange({ sort: e.target.value })}
        className={selectClass}
        aria-label="Sort orders"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-bold text-primary px-3 py-2.5 rounded-xl hover:bg-primary/5"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
