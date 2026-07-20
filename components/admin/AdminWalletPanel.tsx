"use client";

import { useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  adminApproveRefund,
  adminCreditWallet,
  adminDebitWallet,
  adminFetchRefundRequests,
  adminFetchWalletTransactions,
  adminRejectRefund,
  transactionLabel,
  type RefundRequest,
  type WalletTransaction,
} from "@/services/walletApi";
import { Check, X, Wallet, RotateCcw } from "lucide-react";

export default function AdminWalletPanel() {
  const hasToken = useAuthToken();
  const { data: txns = [], mutate: refreshTxns } = useSWR(
    hasToken ? "/api/wallet/admin/transactions" : null,
    () => adminFetchWalletTransactions()
  );
  const { data: refunds = [], mutate: refreshRefunds } = useSWR(
    hasToken ? "/api/wallet/admin/refund-requests" : null,
    () => adminFetchRefundRequests("pending")
  );

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("admin");
  const [filterUserId, setFilterUserId] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const credit = async () => {
    if (!userId.trim() || !amount) return;
    setBusy("credit");
    setMessage("");
    try {
      await adminCreditWallet({
        user_id: userId.trim(),
        amount: Number(amount),
        category,
        note: note || undefined,
      });
      setMessage("Wallet credited.");
      setAmount("");
      setNote("");
      await refreshTxns();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Credit failed";
      setMessage(msg);
    } finally {
      setBusy("");
    }
  };

  const debit = async () => {
    if (!userId.trim() || !amount) return;
    setBusy("debit");
    setMessage("");
    try {
      await adminDebitWallet({
        user_id: userId.trim(),
        amount: Number(amount),
        note: note || "Admin debit",
      });
      setMessage("Wallet debited.");
      setAmount("");
      setNote("");
      await refreshTxns();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Debit failed";
      setMessage(msg);
    } finally {
      setBusy("");
    }
  };

  const approve = async (id: string) => {
    setBusy(id);
    try {
      await adminApproveRefund(id);
      await refreshRefunds();
      await refreshTxns();
    } finally {
      setBusy("");
    }
  };

  const reject = async (id: string) => {
    setBusy(`reject-${id}`);
    try {
      await adminRejectRefund(id, "Rejected by admin");
      await refreshRefunds();
    } finally {
      setBusy("");
    }
  };

  const filteredTxns = filterUserId
    ? (txns as WalletTransaction[]).filter((t) => String((t as WalletTransaction & { user_id?: string }).user_id || "").includes(filterUserId))
    : (txns as WalletTransaction[]);

  return (
    <AdminShell title="Customer Wallet">
      {message && (
        <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-3 text-sm font-bold text-[#111827]">
          {message}
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#E23744]" />
            <h2 className="text-lg font-black text-[#111827]">Manual Credit / Debit</h2>
          </div>
          <div className="space-y-3">
            <input
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm"
            />
            <input
              placeholder="Amount (₹)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm"
            >
              <option value="admin">Admin credit</option>
              <option value="cashback">Cashback</option>
              <option value="refund">Refund</option>
            </select>
            <input
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={credit}
                disabled={busy === "credit"}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white disabled:opacity-50"
              >
                Credit
              </button>
              <button
                type="button"
                onClick={debit}
                disabled={busy === "debit"}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-black text-white disabled:opacity-50"
              >
                Debit
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-[#E23744]" />
            <h2 className="text-lg font-black text-[#111827]">Pending Refund Requests</h2>
          </div>
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {(refunds as RefundRequest[]).length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No pending refund requests.</p>
            ) : (
              (refunds as RefundRequest[]).map((r) => (
                <div key={r.id} className="rounded-xl border border-[#E5E7EB] p-4">
                  <p className="text-sm font-bold text-[#111827]">
                    ₹{Number(r.amount).toFixed(2)} · {r.refund_type} → {r.refund_method}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {r.full_name || r.email} · Order {String(r.order_id).slice(0, 8)}
                  </p>
                  {r.reason && <p className="mt-1 text-xs text-[#9CA3AF]">{r.reason}</p>}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => approve(r.id)}
                      disabled={busy === r.id}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => reject(r.id)}
                      disabled={busy === `reject-${r.id}`}
                      className="flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-black text-white"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#111827]">All Wallet Transactions</h2>
          <input
            placeholder="Filter by user ID"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-xs uppercase text-[#9CA3AF]">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Balance</th>
                <th className="py-2 pr-4">Note</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxns.slice(0, 100).map((t) => (
                <tr key={t.id} className="border-b border-[#F3F4F6]">
                  <td className="py-2 pr-4 font-bold">{transactionLabel(t)}</td>
                  <td className={`py-2 pr-4 font-bold ${Number(t.amount) >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {Number(t.amount) >= 0 ? "+" : ""}₹{Math.abs(Number(t.amount)).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4">₹{Number(t.balance_after).toFixed(2)}</td>
                  <td className="py-2 pr-4 text-[#6B7280]">{t.note || "—"}</td>
                  <td className="py-2 text-[#9CA3AF]">{new Date(t.created_at).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
