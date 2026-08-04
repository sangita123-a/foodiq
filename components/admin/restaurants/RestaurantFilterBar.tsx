"use client";

import type { AdminRestaurantFilters } from "@/services/adminApi";

const STATUSES = [
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "latest", label: "Latest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "revenue_high", label: "Highest revenue" },
  { value: "rating_high", label: "Highest rating" },
  { value: "orders_high", label: "Most orders" },
];

const RATING_OPTIONS = [1, 2, 3, 4, 4.5];

const selectClass =
  "bg-white border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

export default function RestaurantFilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: AdminRestaurantFilters;
  onChange: (patch: Partial<AdminRestaurantFilters>) => void;
  onClear: () => void;
}) {
  const hasActiveFilters =
    !!filters.status ||
    !!filters.verification ||
    !!filters.city ||
    !!filters.zone ||
    !!filters.cuisine ||
    !!filters.rating_min ||
    !!filters.date_from ||
    !!filters.date_to;

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
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      <select
        value={filters.verification || ""}
        onChange={(e) => onChange({ verification: e.target.value })}
        className={selectClass}
        aria-label="Filter by verification"
      >
        <option value="">All verification states</option>
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
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
        value={filters.zone || ""}
        onChange={(e) => onChange({ zone: e.target.value })}
        placeholder="Zone"
        className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Filter by zone"
      />

      <input
        value={filters.cuisine || ""}
        onChange={(e) => onChange({ cuisine: e.target.value })}
        placeholder="Cuisine"
        className="bg-white border border-border rounded-xl px-3 py-2.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-label="Filter by cuisine"
      />

      <select
        value={filters.rating_min ? String(filters.rating_min) : ""}
        onChange={(e) => onChange({ rating_min: e.target.value ? Number(e.target.value) : undefined })}
        className={selectClass}
        aria-label="Minimum rating"
      >
        <option value="">Any rating</option>
        {RATING_OPTIONS.map((r) => (
          <option key={r} value={r}>{r}+ stars</option>
        ))}
      </select>

      <input
        type="date"
        value={filters.date_from || ""}
        onChange={(e) => onChange({ date_from: e.target.value })}
        className={selectClass}
        aria-label="From date"
      />
      <input
        type="date"
        value={filters.date_to || ""}
        onChange={(e) => onChange({ date_to: e.target.value })}
        className={selectClass}
        aria-label="To date"
      />

      <select
        value={filters.sort || "latest"}
        onChange={(e) => onChange({ sort: e.target.value })}
        className={selectClass}
        aria-label="Sort restaurants"
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
