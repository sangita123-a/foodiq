"use client";

import { ChevronLeft, ChevronRight, ArrowUpDown, AlertTriangle, Store, Star } from "lucide-react";
import { formatCurrency, formatDate, type AdminRestaurantRow, type AdminRestaurantsPagination } from "@/services/adminApi";
import RestaurantActionsMenu from "./RestaurantActionsMenu";

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status?.toLowerCase()] || "bg-section text-gray-text";
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${cls}`}>{status}</span>;
}

function ActiveBadge({ isActive, isOpen }: { isActive?: boolean; isOpen?: boolean }) {
  if (isActive === false) {
    return <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700">Suspended</span>;
  }
  if (isOpen === false) {
    return <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">Temporarily Closed</span>;
  }
  return <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">Open</span>;
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
      <div className="bg-white rounded-3xl border border-border p-16 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground mb-1">Couldn&apos;t load restaurants</p>
        <p className="text-sm text-gray-text mb-4">A network or server error occurred.</p>
        <button type="button" onClick={onRetry} className="bg-primary text-white font-bold px-5 py-2.5 rounded-xl text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-sm">
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
            {loading &&
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(15)].map((__, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 bg-section rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

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
                      <div className="w-8 h-8 rounded-lg bg-section flex items-center justify-center overflow-hidden shrink-0">
                        {r.logo_url || r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.logo_url || r.image_url} alt="" className="w-full h-full object-cover" />
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
                  <td className="p-4"><StatusBadge status={r.approval_status || "approved"} /></td>
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
          <div className="text-center py-20">
            <Store className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No restaurants found</p>
            <p className="text-sm text-gray-text">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border">
          <p className="text-xs text-gray-text">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-border disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
