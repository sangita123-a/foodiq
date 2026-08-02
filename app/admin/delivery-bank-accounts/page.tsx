"use client";

import { useMemo, useState } from "react";
import { mutate } from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminList } from "@/hooks/useAdminData";
import {
  adminPatch,
  formatDate,
  type AdminBankAccountsResponse,
} from "@/services/adminApi";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-green-50 text-green-600",
  rejected: "bg-red-50 text-red-600",
};

export default function AdminDeliveryBankAccountsPage() {
  const [status, setStatus] = useState<"" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const path = useMemo(() => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    q.set("page", String(page));
    q.set("limit", "20");
    return `/api/admin/delivery/bank-accounts?${q.toString()}`;
  }, [status, search, page]);

  const { data, isLoading } = useAdminList<AdminBankAccountsResponse>(path);
  const accounts = data?.accounts || [];
  const pagination = data?.pagination;
  const refresh = () => mutate(path);

  const process = async (id: string, action: "approve" | "reject") => {
    if (action === "reject" && !reasons[id]?.trim()) {
      return;
    }
    setProcessingId(id);
    try {
      await adminPatch(`/api/admin/delivery/bank-accounts/${id}`, {
        status: action === "approve" ? "approved" : "rejected",
        reason: reasons[id] || "",
      });
      refresh();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminShell title="Delivery Bank Accounts">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">Delivery Bank Accounts</h1>
          <p className="text-gray-text">
            Review and verify delivery partner payout bank accounts before they can withdraw.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search partner name or email"
            className="bg-white border border-border rounded-xl px-4 py-2.5 text-sm w-56"
          />
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
      </div>

      {isLoading && <p className="text-sm text-gray-text mb-4">Loading…</p>}

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-section text-left">
              <tr>
                <th className="px-5 py-3 font-bold text-gray-text">Partner</th>
                <th className="px-5 py-3 font-bold text-gray-text">Bank</th>
                <th className="px-5 py-3 font-bold text-gray-text">Account Holder</th>
                <th className="px-5 py-3 font-bold text-gray-text">Account No.</th>
                <th className="px-5 py-3 font-bold text-gray-text">IFSC</th>
                <th className="px-5 py-3 font-bold text-gray-text">Type</th>
                <th className="px-5 py-3 font-bold text-gray-text">Status</th>
                <th className="px-5 py-3 font-bold text-gray-text">Created</th>
                <th className="px-5 py-3 font-bold text-gray-text">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="px-5 py-4">
                    <p className="font-bold text-foreground">{a.partner_name || "Partner"}</p>
                    <p className="text-xs text-gray-text">{a.partner_email}</p>
                    <p className="text-xs text-[#9CA3AF]">{a.partner_phone}</p>
                  </td>
                  <td className="px-5 py-4 text-foreground">{a.bank_name}</td>
                  <td className="px-5 py-4 text-foreground">{a.account_holder_name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-foreground">
                    {a.account_number_masked}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-foreground">{a.ifsc_code}</td>
                  <td className="px-5 py-4 text-xs text-gray-text capitalize">{a.account_type}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                        STATUS_STYLES[a.verification_status] || "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {a.verification_status}
                    </span>
                    {a.verification_status === "rejected" && a.rejection_reason && (
                      <p className="text-[10px] text-red-500 mt-1 max-w-[160px]">
                        {a.rejection_reason}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-text">{formatDate(a.created_at)}</td>
                  <td className="px-5 py-4">
                    {a.verification_status === "pending" ? (
                      <div className="flex flex-col gap-2">
                        <input
                          value={reasons[a.id] || ""}
                          onChange={(e) =>
                            setReasons((r) => ({ ...r, [a.id]: e.target.value }))
                          }
                          placeholder="Rejection reason (required to reject)"
                          className="border border-border rounded-lg px-2 py-1.5 text-xs w-48"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={processingId === a.id}
                            onClick={() => process(a.id, "approve")}
                            className="text-xs font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={processingId === a.id || !reasons[a.id]?.trim()}
                            onClick={() => process(a.id, "reject")}
                            className="text-xs font-bold bg-red-500 text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
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
        {!accounts.length && !isLoading && (
          <p className="text-center text-[#9CA3AF] py-16">No bank accounts found.</p>
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-text">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} accounts
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
