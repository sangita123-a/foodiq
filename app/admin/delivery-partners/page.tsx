"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPut } from "@/services/adminApi";

type Partner = {
  id: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  vehicle_type?: string;
  vehicle_details?: string;
  is_available?: boolean;
  approval_status?: string;
  rating?: number;
  delivery_count?: number;
  total_earnings?: number;
  wallet_balance?: number;
  profile_photo_url?: string;
  license_photo_url?: string;
};

function formatCurrency(amount: number) {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function AdminDeliveryPartnersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    if (status) q.set("status", status);
    const qs = q.toString();
    return `/api/admin/delivery-partners${qs ? `?${qs}` : ""}`;
  }, [search, status]);

  const { data, isLoading } = useAdminList<Partner[]>(path);
  const partners = data || [];
  const refresh = () => mutate(path);

  const setApproval = async (id: string, approval_status: string) => {
    await adminPut(`/api/admin/delivery-partners/${id}`, {
      approval_status,
      is_available: approval_status === "approved",
    });
    refresh();
  };

  const suspendPartner = async (id: string) => {
    await adminPut(`/api/admin/delivery-partners/${id}`, {
      approval_status: "suspended",
      suspended: true,
      is_available: false,
    });
    refresh();
  };

  const toggleAvailable = async (p: Partner) => {
    await adminPut(`/api/admin/delivery-partners/${p.id}`, { is_available: !p.is_available });
    refresh();
  };

  return (
    <AdminShell title="Delivery Partners">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#111827]">Delivery Partners</h1>
          <p className="text-[#6B7280]">Approve, suspend, track live, and view earnings.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/admin/live"
            className="text-sm font-bold bg-[#E23744] text-white px-4 py-2.5 rounded-xl"
          >
            Live Deliveries
          </Link>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners…"
            className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm">
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#6B7280] mb-4">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {partners.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-black text-[#111827]">{p.full_name || "Partner"}</h3>
                <p className="text-xs text-[#6B7280]">{p.email}</p>
                <p className="text-xs text-[#9CA3AF]">{p.phone_number}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                p.is_available ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
              }`}>
                {p.is_available ? "Online" : "Offline"}
              </span>
            </div>
            <p className="text-sm text-[#6B7280] mb-1">
              {p.vehicle_type || "Vehicle"} — {p.vehicle_details || "—"}
            </p>
            <p className="text-xs text-[#9CA3AF] mb-2">
              Status: {p.approval_status || "approved"} · Deliveries: {p.delivery_count || 0} · Rating: {p.rating || 0}
            </p>
            <p className="text-xs font-bold text-[#111827] mb-4">
              Earnings: {formatCurrency(Number(p.total_earnings || 0))} · Wallet: {formatCurrency(Number(p.wallet_balance || 0))}
            </p>
            {(p.profile_photo_url || p.license_photo_url) && (
              <div className="flex gap-2 mb-4">
                {p.profile_photo_url && (
                  <a href={p.profile_photo_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#E23744]">
                    Photo
                  </a>
                )}
                {p.license_photo_url && (
                  <a href={p.license_photo_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#E23744]">
                    License
                  </a>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(p.approval_status || "approved") === "pending" && (
                <>
                  <button type="button" onClick={() => setApproval(p.id, "approved")} className="text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg">Approve</button>
                  <button type="button" onClick={() => setApproval(p.id, "rejected")} className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg">Reject</button>
                </>
              )}
              {(p.approval_status || "approved") === "approved" && (
                <button type="button" onClick={() => suspendPartner(p.id)} className="text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg">
                  Suspend
                </button>
              )}
              {p.approval_status === "suspended" && (
                <button type="button" onClick={() => setApproval(p.id, "approved")} className="text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg">
                  Reactivate
                </button>
              )}
              <button type="button" onClick={() => toggleAvailable(p)} className="text-xs font-bold border border-[#E5E7EB] px-3 py-1.5 rounded-lg">
                {p.is_available ? "Set Offline" : "Set Available"}
              </button>
            </div>
          </div>
        ))}
      </div>
      {!partners.length && !isLoading && (
        <p className="text-center text-[#9CA3AF] py-16">No delivery partners registered yet.</p>
      )}
    </AdminShell>
  );
}
