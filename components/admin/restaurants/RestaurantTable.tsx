"use client";

import { ArrowUpDown, AlertTriangle, Store, Star } from "lucide-react";
import { formatCurrency, formatDate, type AdminRestaurantRow, type AdminRestaurantsPagination } from "@/services/adminApi";
import { Badge, Button, EmptyState, Pagination, SkeletonRows } from "@/components/admin/ui";
import { DEFAULT_RESTAURANT_IMAGE } from "@/lib/images";
import SafeImage from "@/components/ui/SafeImage";
import RestaurantActionsMenu from "./RestaurantActionsMenu";

const RESTAURANT_TABLE_COLUMNS = 15;

function ActiveBadge({ isActive, isOpen }: { isActive?: boolean; isOpen?: boolean }) {
  if (isActive === false) {
    return <Badge tone="error">Suspended</Badge>;
  }
  if (isOpen === false) {
    return <Badge tone="neutral">Temporarily Closed</Badge>;
  }
  return <Badge tone="info">Open</Badge>;
}

export default function RestaurantTable({
  rows,
  loading,
  error,
  onRetry,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onOpenDetails,
  onChanged,
  sort,
  onSortChange,
  pagination,
  onPageChange,
}: {
  rows: AdminRestaurantRow[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  onOpenDetails: (id: string) => void;
  onChanged: () => void;
  sort: string;
  onSortChange: (sort: string) => void;
  pagination?: AdminRestaurantsPagination;
  onPageChange: (page: number) => void;
}) {
  const toggleRevenueSort = () => onSortChange(sort === "revenue_high" ? "latest" : "revenue_high");
  const toggleRatingSort = () => onSortChange(sort === "rating_high" ? "latest" : "rating_high");
  const toggleDateSort = () => onSortChange(sort === "latest" ? "oldest" : "latest");

  if (error && !loading) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-16 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground mb-1">Couldn&apos;t load restaurants</p>
        <p className="text-sm text-gray-text mb-4">A network or server error occurred.</p>
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-admin-soft)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1500px] text-left">
          <thead className="bg-section border-b border-border">
            <tr>
              <th className="p-4 w-10">
                <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Select all restaurants" />
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Restaurant</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Owner</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Restaurant ID</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Email</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Phone</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">City</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Zone</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Cuisine</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">
                <button type="button" onClick={toggleRatingSort} className="flex items-center gap-1">
                  Rating <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Status</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Verification</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-center">Orders Today</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">
                <button type="button" onClick={toggleRevenueSort} className="flex items-center gap-1">
                  Revenue Today <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">
                <button type="button" onClick={toggleDateSort} className="flex items-center gap-1">
                  Created <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows rows={8} columns={RESTAURANT_TABLE_COLUMNS} />}

            {!loading &&
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border hover:bg-section/50 cursor-pointer"
                  onClick={() => onOpenDetails(r.id)}
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => onToggleSelect(r.id)}
                      aria-label={`Select ${r.name}`}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-lg bg-section flex items-center justify-center overflow-hidden shrink-0">
                        {r.logo_url || r.image_url ? (
                          <SafeImage
                            src={r.logo_url || r.image_url}
                            fallback={DEFAULT_RESTAURANT_IMAGE}
                            alt={r.name}
                            fill
                            className="rounded-lg"
                          />
                        ) : (
                          <Store className="w-4 h-4 text-[#9CA3AF]" />
                        )}
                      </div>
                      <p className="font-bold text-sm text-foreground max-w-[160px] truncate">{r.name}</p>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{r.owner_name || "—"}</td>
                  <td className="p-4 font-mono text-xs text-gray-text">{r.id.slice(0, 8)}</td>
                  <td className="p-4 text-xs text-gray-text max-w-[160px] truncate">{r.owner_email || "—"}</td>
                  <td className="p-4 text-xs text-gray-text">{r.owner_phone || r.phone || "—"}</td>
                  <td className="p-4 text-sm">{r.city || "—"}</td>
                  <td className="p-4 text-sm">{r.zone || "—"}</td>
                  <td className="p-4 text-sm max-w-[120px] truncate">{r.category_name || "—"}</td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {Number(r.rating || 0).toFixed(1)}
                    </span>
                  </td>
                  <td className="p-4"><ActiveBadge isActive={r.is_active} isOpen={r.is_open} /></td>
                  <td className="p-4"><Badge status={r.approval_status || "approved"}>{r.approval_status || "approved"}</Badge></td>
                  <td className="p-4 text-sm text-center">{r.orders_today ?? 0}</td>
                  <td className="p-4 font-black text-sm">{formatCurrency(r.revenue_today || 0)}</td>
                  <td className="p-4 text-xs text-gray-text">{formatDate(r.created_at)}</td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <RestaurantActionsMenu restaurant={r} onViewDetails={() => onOpenDetails(r.id)} onChanged={onChanged} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {!loading && !rows.length && (
          <EmptyState
            icon={Store}
            title="No restaurants found"
            description="Try adjusting your search or filters."
          />
        )}
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
