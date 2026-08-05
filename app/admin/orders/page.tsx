"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminOrders, useAdminOrderStats } from "@/hooks/useAdminData";
import { useAdminOrdersLive } from "@/hooks/useAdminOrdersLive";
import type { AdminOrderFilters } from "@/services/adminApi";
import { Button, SearchInput } from "@/components/admin/ui";
import OrderStatsStrip from "@/components/admin/orders/OrderStatsStrip";
import OrderFilterBar from "@/components/admin/orders/OrderFilterBar";
import ExportMenu from "@/components/admin/orders/ExportMenu";
import OrderTable from "@/components/admin/orders/OrderTable";
import OrderDetailsDrawer from "@/components/admin/orders/OrderDetailsDrawer";
import BulkActionBar from "@/components/admin/orders/BulkActionBar";

const DEFAULT_FILTERS: AdminOrderFilters = { sort: "latest", page: 1, limit: 25 };

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState<AdminOrderFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useAdminOrders(filters);
  const { data: stats, isLoading: statsLoading, mutate: mutateStats } = useAdminOrderStats();
  const { connected } = useAdminOrdersLive();

  const rows = useMemo(() => data?.rows || [], [data]);
  const selectedRows = useMemo(() => rows.filter((r) => selectedIds.has(r.id)), [rows, selectedIds]);

  const updateFilters = (patch: Partial<AdminOrderFilters>) => {
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
    <AdminShell title="Order Management">
      <div className="mb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            Orders
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
            {data?.pagination?.total ?? 0} orders · manage status, delivery, payments, and refunds.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <SearchInput
            value={filters.search || ""}
            onChange={(v) => updateFilters({ search: v })}
            placeholder="Search by order ID, customer, restaurant, phone, or partner…"
          />
          <Button
            variant="secondary"
            onClick={refreshAll}
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
          <ExportMenu filters={filters} />
        </div>
      </div>

      <OrderStatsStrip stats={stats} loading={statsLoading} />

      <div className="mb-4">
        <OrderFilterBar filters={filters} onChange={updateFilters} onClear={() => setFilters(DEFAULT_FILTERS)} />
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

      <OrderTable
        rows={rows}
        loading={isLoading}
        error={error}
        onRetry={refreshAll}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        allSelected={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
        onOpenDetails={setDetailsOrderId}
        onChanged={refreshAll}
        sort={filters.sort || "latest"}
        onSortChange={(sort) => updateFilters({ sort })}
        pagination={data?.pagination}
        onPageChange={(page) => updateFilters({ page })}
      />

      {detailsOrderId && (
        <OrderDetailsDrawer
          orderId={detailsOrderId}
          onClose={() => setDetailsOrderId(null)}
          onChanged={refreshAll}
        />
      )}
    </AdminShell>
  );
}
