"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut, adminDelete, formatCurrency, formatDate } from "@/services/adminApi";

type Restaurant = {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active?: boolean;
  approval_status?: string;
  owner_name?: string;
  owner_email?: string;
  order_count?: number;
  revenue?: number;
  rating?: number;
  created_at?: string;
};

export default function AdminRestaurantsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (status) q.set("status", status);
    const qs = q.toString();
    return `/api/admin/restaurants${qs ? `?${qs}` : ""}`;
  }, [search, status]);

  const { data, isLoading, error } = useAdminList<Restaurant[]>(path);
  const restaurants = data || [];

  const refresh = () => mutate(path);

  const setApproval = async (id: string, approval_status: string) => {
    await adminPut(`/api/admin/restaurants/${id}`, { approval_status, is_active: approval_status === "approved" });
    refresh();
  };

  const toggleActive = async (r: Restaurant) => {
    await adminPut(`/api/admin/restaurants/${r.id}`, { is_active: !r.is_active });
    refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this restaurant and related menu data?")) return;
    await adminDelete(`/api/admin/restaurants/${id}`);
    refresh();
  };

  return (
    <AdminShell title="Restaurant Management">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#111827]">Restaurants</h1>
          <p className="text-[#6B7280]">Approve, suspend, and manage restaurant partners.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants…"
            className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#FC8019]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">Failed to load restaurants.</p>}
      {isLoading && <p className="text-[#6B7280] text-sm mb-4">Loading…</p>}

      <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E5E7EB]">
              <tr>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Restaurant</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Owner</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Status</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Orders</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase">Revenue</th>
                <th className="p-4 text-xs font-bold text-[#9CA3AF] uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((r) => (
                <tr key={r.id} className="border-b border-[#E5E7EB] hover:bg-[#F8FAFC]">
                  <td className="p-4">
                    <p className="font-bold text-[#111827]">{r.name}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{r.address || "—"}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">{formatDate(r.created_at)}</p>
                  </td>
                  <td className="p-4 text-sm">
                    <p className="font-bold text-[#111827]">{r.owner_name || "—"}</p>
                    <p className="text-xs text-[#6B7280]">{r.owner_email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                      (r.approval_status || "approved") === "approved"
                        ? "bg-green-50 text-green-600 border-green-200"
                        : (r.approval_status || "") === "pending"
                          ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-red-50 text-red-600 border-red-200"
                    }`}>
                      {r.approval_status || "approved"}
                    </span>
                    <p className="text-[10px] mt-1 text-[#6B7280]">
                      {r.is_active ? "Active" : "Suspended"}
                    </p>
                  </td>
                  <td className="p-4 font-bold text-sm">{r.order_count || 0}</td>
                  <td className="p-4 font-bold text-sm text-green-600">{formatCurrency(r.revenue || 0)}</td>
                  <td className="p-4 text-right space-x-2">
                    {(r.approval_status || "approved") === "pending" && (
                      <>
                        <button type="button" onClick={() => setApproval(r.id, "approved")} className="text-xs font-bold text-green-600">Approve</button>
                        <button type="button" onClick={() => setApproval(r.id, "rejected")} className="text-xs font-bold text-red-500">Reject</button>
                      </>
                    )}
                    <button type="button" onClick={() => toggleActive(r)} className="text-xs font-bold text-[#FC8019]">
                      {r.is_active ? "Suspend" : "Activate"}
                    </button>
                    <button type="button" onClick={() => remove(r.id)} className="text-xs font-bold text-red-500">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!restaurants.length && !isLoading && (
            <p className="text-center text-[#9CA3AF] py-16">No restaurants found.</p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
