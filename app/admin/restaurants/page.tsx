"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminRestaurants, useAdminRestaurantStats } from "@/hooks/useAdminData";
import { useAdminRestaurantsLive } from "@/hooks/useAdminRestaurantsLive";
import type { AdminRestaurantFilters } from "@/services/adminApi";
import RestaurantStatsStrip from "@/components/admin/restaurants/RestaurantStatsStrip";
import RestaurantSearchBar from "@/components/admin/restaurants/RestaurantSearchBar";
import RestaurantFilterBar from "@/components/admin/restaurants/RestaurantFilterBar";
import ExportMenu from "@/components/admin/restaurants/ExportMenu";
import RestaurantTable from "@/components/admin/restaurants/RestaurantTable";
import RestaurantDetailsDrawer from "@/components/admin/restaurants/RestaurantDetailsDrawer";
import BulkActionBar from "@/components/admin/restaurants/BulkActionBar";

const DEFAULT_FILTERS: AdminRestaurantFilters = { sort: "latest", page: 1, limit: 25 };

export default function AdminRestaurantsPage() {
  const [filters, setFilters] = useState<AdminRestaurantFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsRestaurantId, setDetailsRestaurantId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useAdminRestaurants(filters);
  const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useAdminRestaurantStats();
  const { connected } = useAdminRestaurantsLive();

  const rows = useMemo(() => data?.rows || [], [data]);
  const selectedRows = useMemo(() => rows.filter((r) => selectedIds.has(r.id)), [rows, selectedIds]);

  const updateFilters = (patch: Partial<AdminRestaurantFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: "page" in patch ? patch.page : 1 }));
  };

  const refreshAll = () => {
    mutate();
    mutateStats();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (rows.every((r) => prev.has(r.id)) && rows.length > 0) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  };

  return (
    <AdminShell title="Restaurant Management">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            Restaurants
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                connected ? "bg-emerald-50 text-emerald-700" : "bg-section text-gray-text"
              }`}
            >
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? "Live" : "Offline"}
            </span>
          </h1>
          <p className="text-gray-text">
            {data?.pagination?.total ?? 0} restaurants · approve, verify, and manage restaurant partners.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <RestaurantSearchBar value={filters.search || ""} onChange={(v) => updateFilters({ search: v })} />
          <button
            type="button"
            onClick={refreshAll}
            className="flex items-center gap-2 bg-white border border-border rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-section"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <ExportMenu filters={filters} />
        </div>
      </div>

      <RestaurantStatsStrip stats={stats} loading={statsLoading} />

      <div className="mb-4">
        <RestaurantFilterBar filters={filters} onChange={updateFilters} onClear={() => setFilters(DEFAULT_FILTERS)} />
      </div>

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedIds={Array.from(selectedIds)}
          selectedRows={selectedRows}
          onClear={() => setSelectedIds(new Set())}
          onChanged={() => {
            setSelectedIds(new Set());
            refreshAll();
          }}
        />
      )}

      <RestaurantTable
        rows={rows}
        loading={isLoading}
        error={error}
        onRetry={refreshAll}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        allSelected={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
        onOpenDetails={setDetailsRestaurantId}
        onChanged={refreshAll}
        sort={filters.sort || "latest"}
        onSortChange={(sort) => updateFilters({ sort })}
        pagination={data?.pagination}
        onPageChange={(page) => updateFilters({ page })}
      />

      {detailsRestaurantId && (
        <RestaurantDetailsDrawer
          restaurantId={detailsRestaurantId}
          onClose={() => setDetailsRestaurantId(null)}
          onChanged={refreshAll}
        />
      )}
    </AdminShell>
  );
}
