"use client";

import { useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetcher, adminPost, formatCurrency, formatDate } from "@/services/adminApi";
import { useAuthToken } from "@/hooks/useAuthToken";

type PaymentsOverview = {
  stats: {
    total_revenue: number;
    successful_payments: number;
    failed_payments: number;
    pending_payments: number;
    refunded_amount: number;
    refund_count: number;
    refund_total: number;
  };
  transactions: Array<Record<string, unknown>>;
  refunds: Array<Record<string, unknown>>;
};

export default function AdminPaymentsPage() {
  const hasToken = useAuthToken();
  const { data, mutate, isLoading, error } = useSWR<PaymentsOverview>(
    hasToken ? "/api/admin/payments" : null,
    adminFetcher
  );
  const [refundOrderId, setRefundOrderId] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [busy, setBusy] = useState(false);

  const stats = data?.stats;

  const handleRefund = async () => {
    if (!refundOrderId) return;
    setBusy(true);
    try {
      await adminPost("/api/admin/payments/refunds", {
        order_id: refundOrderId,
        amount: refundAmount ? Number(refundAmount) : undefined,
        reason: refundReason || "Admin refund",
        type: refundAmount ? "partial" : "full",
      });
      setRefundOrderId("");
      setRefundAmount("");
      setRefundReason("");
      mutate();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell title="Payments">
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load payments.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: formatCurrency(stats?.total_revenue || 0) },
          { label: "Successful", value: String(stats?.successful_payments || 0) },
          { label: "Failed", value: String(stats?.failed_payments || 0) },
          { label: "Refunds", value: formatCurrency(stats?.refund_total || 0) },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
              {card.label}
            </p>
            <p className="text-2xl font-black text-[#111827]">{card.value}</p>
          </div>
        ))}
      </div>

      <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-black text-[#111827] mb-4">Process Refund</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={refundOrderId}
            onChange={(e) => setRefundOrderId(e.target.value)}
            placeholder="Order UUID"
            className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
          />
          <input
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="Amount (blank = full)"
            className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
          />
          <input
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Reason"
            className="border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
          />
          <button
            type="button"
            disabled={busy || !refundOrderId}
            onClick={handleRefund}
            className="bg-[#E23744] text-white font-bold rounded-xl px-4 py-3 disabled:opacity-60"
          >
            {busy ? "Processing..." : "Refund"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-lg font-black text-[#111827]">Transaction Logs</h2>
          </div>
          {isLoading && <p className="p-5 text-sm text-[#6B7280]">Loading...</p>}
          <div className="divide-y divide-[#F3F4F6] max-h-[480px] overflow-y-auto">
            {(data?.transactions || []).map((t) => (
              <div key={String(t.id)} className="px-5 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-bold text-[#111827]">
                    {String(t.full_name || "")} · {String(t.payment_method || "")}
                  </p>
                  <span className="font-black">{formatCurrency(Number(t.amount || 0))}</span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  {String(t.status)} · {String(t.razorpay_order_id || "").slice(0, 18)} ·{" "}
                  {formatDate(String(t.created_at || ""))}
                </p>
              </div>
            ))}
            {!data?.transactions?.length && !isLoading && (
              <p className="p-6 text-sm text-[#6B7280] text-center">No transactions yet</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-lg font-black text-[#111827]">Refund Management</h2>
          </div>
          <div className="divide-y divide-[#F3F4F6] max-h-[480px] overflow-y-auto">
            {(data?.refunds || []).map((r) => (
              <div key={String(r.id)} className="px-5 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-bold text-[#111827]">
                    {String(r.type)} · {String(r.full_name || "")}
                  </p>
                  <span className="font-black text-emerald-600">
                    {formatCurrency(Number(r.amount || 0))}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  {String(r.reason || "—")} · {formatDate(String(r.created_at || ""))}
                </p>
              </div>
            ))}
            {!data?.refunds?.length && (
              <p className="p-6 text-sm text-[#6B7280] text-center">No refunds yet</p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
