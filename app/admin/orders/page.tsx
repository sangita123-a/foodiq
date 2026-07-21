"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut, adminPost, adminGet, formatCurrency, formatDate } from "@/services/adminApi";

type OrderRow = {
  id: string;
  status: string;
  total_amount: number;
  customer_name?: string;
  restaurant_name?: string;
  payment_status?: string;
  delivery_partner_name?: string;
  delivery_partner_id?: string;
  created_at?: string;
};

type Partner = { id: string; full_name?: string; is_available?: boolean; approval_status?: string };

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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
  const orders = data || [];
  const refresh = () => mutate(path);

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
    if (selected) {
      const details = await adminGet<Record<string, unknown>>(`/api/admin/orders/${orderId}`);
      setSelected(details);
    }
  };

  const openDetails = async (id: string) => {
    const details = await adminGet<Record<string, unknown>>(`/api/admin/orders/${id}`);
    setSelected(details);
  };

  return (
    <AdminShell title="Order Management">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Orders</h1>
          <p className="text-gray-text">Filter, assign riders, cancel, and refund.</p>
        </div>
        <div className="flex gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders…" className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm">
            <option value="">All statuses</option>
            {["Pending", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "On The Way", "Delivered", "Cancelled"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="bg-white rounded-3xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="bg-section border-b border-border">
              <tr>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Order</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Customer</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Restaurant</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Rider</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Total</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border">
                  <td className="p-4">
                    <p className="font-mono text-sm font-bold text-primary">#{String(o.id).slice(0, 8)}</p>
                    <p className="text-[10px] text-[#9CA3AF]">{formatDate(o.created_at)}</p>
                  </td>
                  <td className="p-4 text-sm font-bold">{o.customer_name}</td>
                  <td className="p-4 text-sm">{o.restaurant_name}</td>
                  <td className="p-4 text-xs font-bold">{o.status}</td>
                  <td className="p-4 text-sm text-gray-text">{o.delivery_partner_name || "Unassigned"}</td>
                  <td className="p-4 font-black">{formatCurrency(o.total_amount)}</td>
                  <td className="p-4 text-right space-x-2">
                    <button type="button" onClick={() => openDetails(o.id)} className="text-xs font-bold text-foreground">Details</button>
                    <button type="button" onClick={() => cancelOrder(o.id)} className="text-xs font-bold text-red-500">Cancel</button>
                    <button type="button" onClick={() => refund(o.id)} className="text-xs font-bold text-amber-600">Refund</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && !isLoading && <p className="text-center py-16 text-[#9CA3AF]">No orders found.</p>}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-2">Order #{String(selected.id).slice(0, 8)}</h3>
            <p className="text-sm text-gray-text mb-1">{String(selected.customer_name)} · {String(selected.restaurant_name)}</p>
            <p className="text-sm mb-4">Status: <strong>{String(selected.status)}</strong> · {formatCurrency(Number(selected.total_amount))}</p>
            <div className="space-y-2 mb-4">
              {((selected.items as Array<{ name: string; quantity: number; price_at_time: number }>) || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-border py-2">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-bold">{formatCurrency(item.price_at_time * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mb-4">
              <select value={assignId} onChange={(e) => setAssignId(e.target.value)} className="flex-1 border border-border rounded-xl px-3 py-2 text-sm">
                <option value="">Assign delivery partner…</option>
                {(partners || []).filter((p) => p.is_available !== false).map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name || p.id}</option>
                ))}
              </select>
              <button type="button" onClick={() => assignPartner(String(selected.id))} className="bg-primary text-white font-bold px-4 rounded-xl text-sm">
                Assign
              </button>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="w-full py-3 rounded-xl border border-border font-bold">Close</button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
