"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import { ChevronUp, ChevronDown, Eye, Bike, XCircle, RotateCcw, Search } from "lucide-react";
import { useAdminList } from "@/hooks/useAdminData";
import { adminGet, adminPost, adminPut, formatCurrency, formatDate } from "@/services/adminApi";
import { PanelSkeleton } from "./Skeleton";

type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  customer_name?: string;
  restaurant_name?: string;
  payment_status?: string;
  payment_method?: string;
  delivery_partner_name?: string;
  delivery_partner_id?: string;
  created_at?: string;
};

type Partner = { id: string; full_name?: string; is_available?: boolean };

type SortKey = "created_at" | "total_amount" | "status" | "customer_name" | "restaurant_name";

const STATUS_OPTIONS = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
  "On The Way",
  "Delivered",
  "Cancelled",
];

const PAGE_SIZES = [10, 25, 50];

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "delivered") return "bg-emerald-50 text-emerald-700";
  if (s === "cancelled" || s === "rejected") return "bg-red-50 text-red-600";
  if (s === "on the way" || s === "picked up") return "bg-primary/10 text-primary";
  if (s === "preparing" || s === "ready for pickup") return "bg-amber-50 text-amber-700";
  return "bg-section text-gray-text";
}

function SortHeader({
  label,
  sortKeyName,
  activeSortKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKeyName: SortKey;
  activeSortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className="p-3 text-xs font-bold text-[#9CA3AF] uppercase cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSort(sortKeyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {activeSortKey === sortKeyName &&
          (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );
}

export default function RecentOrdersTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [assignId, setAssignId] = useState("");

  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (status) q.set("status", status);
    const qs = q.toString();
    return `/api/admin/orders${qs ? `?${qs}` : ""}`;
  }, [search, status]);

  const { data, isLoading } = useAdminList<OrderRow[]>(path);
  const { data: partners } = useAdminList<Partner[]>("/api/admin/delivery-partners?status=approved");
  const orders = useMemo(() => data || [], [data]);

  const sorted = useMemo(() => {
    const copy = [...orders];
    copy.sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (sortKey === "total_amount") {
        av = Number(av) || 0;
        bv = Number(bv) || 0;
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [orders, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const refresh = () => mutate(path);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const openDetails = async (id: string) => {
    const details = await adminGet<Record<string, unknown>>(`/api/admin/orders/${id}`);
    setSelected(details);
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Cancel this order?")) return;
    await adminPut(`/api/admin/orders/${id}`, { status: "Cancelled" });
    refresh();
  };

  const refund = async (id: string) => {
    if (!confirm("Refund payment and cancel order?")) return;
    await adminPost(`/api/admin/orders/${id}/refund`, {});
    refresh();
  };

  const assignPartner = async (orderId: string) => {
    if (!assignId) return;
    await adminPut(`/api/admin/orders/${orderId}`, { delivery_partner_id: assignId });
    setAssignId("");
    refresh();
    const details = await adminGet<Record<string, unknown>>(`/api/admin/orders/${orderId}`);
    setSelected(details);
  };

  return (
    <section className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)]">
      <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border">
        <h2 className="text-lg font-black text-foreground tracking-tight">Recent Orders</h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search orders…"
              className="bg-section border border-transparent rounded-xl pl-8 pr-3 py-2 text-xs w-44 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="bg-section border border-transparent rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {isLoading ? (
          <PanelSkeleton rows={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-section border-b border-border">
                <tr>
                  <th className="p-3 text-xs font-bold text-[#9CA3AF] uppercase">Order ID</th>
                  <SortHeader label="Customer" sortKeyName="customer_name" activeSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Restaurant" sortKeyName="restaurant_name" activeSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="p-3 text-xs font-bold text-[#9CA3AF] uppercase">Rider</th>
                  <SortHeader label="Amount" sortKeyName="total_amount" activeSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="p-3 text-xs font-bold text-[#9CA3AF] uppercase">Payment</th>
                  <SortHeader label="Status" sortKeyName="status" activeSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <SortHeader label="Time" sortKeyName="created_at" activeSortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                  <th className="p-3 text-xs font-bold text-[#9CA3AF] uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((o) => (
                  <tr key={o.id} className="border-b border-border hover:bg-section/60 transition-colors">
                    <td className="p-3 font-mono text-xs font-bold text-primary">#{String(o.id).slice(0, 8)}</td>
                    <td className="p-3 text-sm font-bold text-foreground">{o.customer_name || "—"}</td>
                    <td className="p-3 text-sm text-foreground">{o.restaurant_name || "—"}</td>
                    <td className="p-3 text-xs text-gray-text">{o.delivery_partner_name || "Unassigned"}</td>
                    <td className="p-3 text-sm font-black text-foreground">{formatCurrency(o.total_amount)}</td>
                    <td className="p-3 text-xs font-bold text-gray-text capitalize">{o.payment_status || "—"}</td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${statusBadgeClass(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-gray-text whitespace-nowrap">{formatDate(o.created_at)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDetails(o.id)}
                          title="View"
                          className="p-1.5 rounded-lg text-foreground hover:bg-section"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetails(o.id)}
                          title="Assign Rider"
                          className="p-1.5 rounded-lg text-violet-600 hover:bg-violet-50"
                        >
                          <Bike className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelOrder(o.id)}
                          title="Cancel"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => refund(o.id)}
                          title="Refund"
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!pageRows.length && <p className="text-center py-12 text-[#9CA3AF] text-sm">No orders found.</p>}
          </div>
        )}

        {!isLoading && sorted.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-gray-text">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-section border border-border rounded-lg px-2 py-1"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-bold text-foreground">
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-black mb-2">Order #{String(selected.id).slice(0, 8)}</h3>
            <p className="text-sm text-gray-text mb-1">
              {String(selected.customer_name)} · {String(selected.restaurant_name)}
            </p>
            <p className="text-sm mb-4">
              Status: <strong>{String(selected.status)}</strong> · {formatCurrency(Number(selected.total_amount))}
            </p>
            <div className="space-y-2 mb-4">
              {((selected.items as Array<{ name: string; quantity: number; price_at_time: number }>) || []).map(
                (item, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-border py-2">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-bold">{formatCurrency(item.price_at_time * item.quantity)}</span>
                  </div>
                )
              )}
            </div>
            <div className="flex gap-2 mb-4">
              <select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm"
              >
                <option value="">Assign delivery partner…</option>
                {(partners || [])
                  .filter((p) => p.is_available !== false)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.id}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => assignPartner(String(selected.id))}
                className="bg-primary text-white font-bold px-4 rounded-xl text-sm"
              >
                Assign
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-full py-3 rounded-xl border border-border font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
