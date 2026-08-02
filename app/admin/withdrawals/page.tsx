"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import { adminPatch, formatCurrency, formatDate } from "@/services/adminApi";

type Withdrawal = {
  id: string;
  partner_id: string;
  partner_name?: string;
  partner_email?: string;
  partner_phone?: string;
  amount: number;
  bank_account_id?: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note?: string | null;
  requested_at: string;
  processed_at?: string | null;
};

type WithdrawalsResponse = {
  withdrawals: Withdrawal[];
  pagination: { page: number; limit: number; total: number; total_pages: number };
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
};

export default function AdminWithdrawalsPage() {
  const [status, setStatus] = useState<"" | "pending" | "approved" | "rejected">("pending");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    q.set("page", String(page));
    q.set("limit", "20");
    return `/api/admin/withdrawals?${q.toString()}`;
  }, [status, page]);

  const { data, isLoading } = useAdminList<WithdrawalsResponse>(path);
  const withdrawals = data?.withdrawals || [];
  const pagination = data?.pagination;
  const refresh = () => mutate(path);

  const process = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      await adminPatch(`/api/admin/withdrawals/${id}`, {
        action,
        admin_note: notes[id] || "",
      });
      refresh();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminShell title="Withdrawals">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Delivery Withdrawals</h1>
          <p className="text-gray-text">Review and process delivery partner payout requests.</p>
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | "pending" | "approved" | "rejected");
            setPage(1);
          }}
          className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm"
        >
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-section text-left">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-text">Partner</th>
                <th className="px-5 py-3 font-bold text-gray-text">Amount</th>
                <th className="px-5 py-3 font-bold text-gray-text">Requested</th>
                <th className="px-5 py-3 font-bold text-gray-text">Status</th>
                <th className="px-5 py-3 font-bold text-gray-text">Admin Note</th>
                <th className="px-5 py-3 font-bold text-gray-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals.map((w) => (
                <tr key={w.id}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-foreground">{w.partner_name || "Partner"}</p>
                    <p className="text-xs text-gray-text">{w.partner_email}</p>
                    <p className="text-xs text-[#9CA3AF]">{w.partner_phone}</p>
                  </td>
                  <td className="px-5 py-4 font-black text-foreground">
                    {formatCurrency(Number(w.amount))}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-text">
                    {formatDate(w.requested_at)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        STATUS_STYLES[w.status] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {w.status}
                    </span>
                    {w.processed_at && (
                      <p className="text-[10px] text-[#9CA3AF] mt-1">
                        {formatDate(w.processed_at)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {w.status === "pending" ? (
                      <input
                        value={notes[w.id] || ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [w.id]: e.target.value }))}
                        placeholder="Optional note"
                        className="border border-border rounded-lg px-2 py-1.5 text-xs w-40"
                      />
                    ) : (
                      <p className="text-xs text-gray-text">{w.admin_note || "—"}</p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {w.status === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={processingId === w.id}
                          onClick={() => process(w.id, "approve")}
                          className="text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={processingId === w.id}
                          onClick={() => process(w.id, "reject")}
                          className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#9CA3AF]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!withdrawals.length && !isLoading && (
          <p className="text-center text-[#9CA3AF] py-16">No withdrawal requests found.</p>
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-text">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} requests
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              className="text-xs font-bold border border-border px-3 py-1.5 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
