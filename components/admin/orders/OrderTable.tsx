"use client";

import { ArrowUpDown, AlertTriangle, PackageX } from "lucide-react";
import { formatCurrency, formatDate, type AdminOrderRow, type AdminOrdersPagination } from "@/services/adminApi";
import { Badge, Button, EmptyState, Pagination, SkeletonRows } from "@/components/admin/ui";
import OrderActionsMenu from "./OrderActionsMenu";

const ORDER_TABLE_COLUMNS = 13;

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
      <div className="bg-white rounded-2xl border border-border shadow-[var(--shadow-admin-soft)] p-16 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-foreground mb-1">Couldn&apos;t load orders</p>
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
            {loading && <SkeletonRows rows={8} columns={ORDER_TABLE_COLUMNS} />}

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
                  <td className="p-4"><Badge status={o.status}>{o.status}</Badge></td>
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
          <EmptyState
            icon={PackageX}
            title="No orders found"
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
