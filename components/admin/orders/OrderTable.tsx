"use client";

import { ChevronLeft, ChevronRight, ArrowUpDown, AlertTriangle, PackageX } from "lucide-react";
import { formatCurrency, formatDate, type AdminOrderRow, type AdminOrdersPagination } from "@/services/adminApi";
import OrderActionsMenu from "./OrderActionsMenu";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-blue-50 text-blue-700",
  preparing: "bg-orange-50 text-orange-700",
  "ready for pickup": "bg-indigo-50 text-indigo-700",
  "picked up": "bg-cyan-50 text-cyan-700",
  "on the way": "bg-purple-50 text-purple-700",
  "out for delivery": "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status?.toLowerCase()] || "bg-section text-gray-text";
  return <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${cls}`}>{status}</span>;
}

export default function OrderTable({
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
  rows: AdminOrderRow[];
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
  pagination?: AdminOrdersPagination;
  onPageChange: (page: number) => void;
}) {
  const toggleAmountSort = () => onSortChange(sort === "amount_high" ? "amount_low" : "amount_high");
  const toggleDateSort = () => onSortChange(sort === "latest" ? "oldest" : "latest");

  if (error && !loading) {
    return (
      <div className="bg-white rounded-3xl border border-border p-16 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground mb-1">Couldn&apos;t load orders</p>
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
        <table className="w-full min-w-[1400px] text-left">
          <thead className="bg-section border-b border-border">
            <tr>
              <th className="p-4 w-10">
                <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} aria-label="Select all orders" />
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Order ID</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Customer</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Restaurant</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Delivery Partner</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-center">Items</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">
                <button type="button" onClick={toggleAmountSort} className="flex items-center gap-1">
                  Total Amount <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Payment Method</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Payment Status</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Order Status</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Delivery Address</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">
                <button type="button" onClick={toggleDateSort} className="flex items-center gap-1">
                  Created <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Expected Delivery</th>
              <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              [...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {[...Array(13)].map((__, j) => (
                    <td key={j} className="p-4">
                      <div className="h-4 bg-section rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              rows.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-border hover:bg-section/50 cursor-pointer"
                  onClick={() => onOpenDetails(o.id)}
                >
                  <td className="p-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(o.id)}
                      onChange={() => onToggleSelect(o.id)}
                      aria-label={`Select order ${o.id.slice(0, 8)}`}
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-mono text-sm font-bold text-primary">#{o.id.slice(0, 8)}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold">{o.customer_name}</p>
                    <p className="text-xs text-gray-text">{o.customer_phone}</p>
                  </td>
                  <td className="p-4 text-sm">{o.restaurant_name}</td>
                  <td className="p-4 text-sm text-gray-text">{o.delivery_partner_name || "Unassigned"}</td>
                  <td className="p-4 text-sm text-center">{o.item_count ?? "—"}</td>
                  <td className="p-4 font-black">{formatCurrency(o.total_amount)}</td>
                  <td className="p-4 text-sm capitalize">{(o.payment_method || "—").replace(/_/g, " ")}</td>
                  <td className="p-4 text-sm capitalize">{o.payment_status || "—"}</td>
                  <td className="p-4"><StatusBadge status={o.status} /></td>
                  <td className="p-4 text-xs text-gray-text max-w-[180px] truncate">
                    {[o.house_no, o.street, o.city].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="p-4 text-xs text-gray-text">{formatDate(o.created_at)}</td>
                  <td className="p-4 text-xs text-gray-text">
                    {o.scheduled_for ? formatDate(o.scheduled_for) : o.estimated_delivery_time ? formatDate(o.estimated_delivery_time) : "—"}
                  </td>
                  <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <OrderActionsMenu order={o} onViewDetails={() => onOpenDetails(o.id)} onChanged={onChanged} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {!loading && !rows.length && (
          <div className="text-center py-20">
            <PackageX className="w-10 h-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm font-bold text-foreground">No orders found</p>
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
