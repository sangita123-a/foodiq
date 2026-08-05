"use client";

import { useState } from "react";
import useSWR from "swr";
import AdminShell from "@/components/admin/AdminShell";
import { adminFetcher, adminPost, formatCurrency, formatDate } from "@/services/adminApi";
import { useAuthToken } from "@/hooks/useAuthToken";
import StatCard from "@/components/admin/dashboard/StatCard";
import { Badge, EmptyState } from "@/components/admin/ui";
import { Wallet, TrendingUp, CheckCircle2, Clock, XCircle, Undo2, Receipt } from "lucide-react";

type PaymentsOverview = {
  stats: {
    total_revenue: number;
    todays_revenue: number;
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

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Total Revenue"
          value={stats?.total_revenue || 0}
          icon={Wallet}
          color="text-primary"
          bg="bg-primary/10"
          format={formatCurrency}
          loading={isLoading && !stats}
        />
        <StatCard
          label="Today's Revenue"
          value={stats?.todays_revenue || 0}
          icon={TrendingUp}
          color="text-emerald-600"
          bg="bg-emerald-500/10"
          format={formatCurrency}
          loading={isLoading && !stats}
        />
        <StatCard
          label="Successful"
          value={stats?.successful_payments || 0}
          icon={CheckCircle2}
          color="text-sky-600"
          bg="bg-sky-500/10"
          loading={isLoading && !stats}
        />
        <StatCard
          label="Pending"
          value={stats?.pending_payments || 0}
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-500/10"
          loading={isLoading && !stats}
        />
        <StatCard
          label="Failed"
          value={stats?.failed_payments || 0}
          icon={XCircle}
          color="text-red-500"
          bg="bg-red-500/10"
          loading={isLoading && !stats}
        />
        <StatCard
          label="Refunds"
          value={stats?.refund_total || 0}
          icon={Undo2}
          color="text-rose-600"
          bg="bg-rose-500/10"
          format={formatCurrency}
          loading={isLoading && !stats}
        />
      </div>

      <section className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] p-5 sm:p-6 mb-8">
        <h2 className="text-lg font-black text-foreground tracking-tight mb-4 flex items-center gap-2">
          <Receipt className="w-4.5 h-4.5 text-primary" /> Process Refund
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={refundOrderId}
            onChange={(e) => setRefundOrderId(e.target.value)}
            placeholder="Order UUID"
            className="border border-border rounded-xl px-4 py-3 text-sm"
          />
          <input
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
            placeholder="Amount (blank = full)"
            className="border border-border rounded-xl px-4 py-3 text-sm"
          />
          <input
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Reason"
            className="border border-border rounded-xl px-4 py-3 text-sm"
          />
          <button
            type="button"
            disabled={busy || !refundOrderId}
            onClick={handleRefund}
            className="bg-primary text-white font-bold rounded-xl px-4 py-3 shadow-[var(--shadow-button)] hover:bg-primary-hover disabled:opacity-60 transition-colors"
          >
            {busy ? "Processing..." : "Refund"}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-lg font-black text-foreground tracking-tight">Transaction Logs</h2>
          </div>
          {isLoading && <p className="p-5 text-sm text-gray-text">Loading...</p>}
          <div className="divide-y divide-[#F3F4F6] max-h-[480px] overflow-y-auto">
            {(data?.transactions || []).map((t) => (
              <div key={String(t.id)} className="px-5 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-bold text-foreground">
                    {String(t.full_name || "")} · {String(t.payment_method || "")}
                  </p>
                  <span className="font-black">{formatCurrency(Number(t.amount || 0))}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge status={String(t.status)}>{String(t.status)}</Badge>
                  <p className="text-xs text-gray-text">
                    {String(t.razorpay_order_id || "").slice(0, 18)} · {formatDate(String(t.created_at || ""))}
                  </p>
                </div>
              </div>
            ))}
            {!data?.transactions?.length && !isLoading && (
              <EmptyState icon={Receipt} title="No transactions yet" className="py-12" />
            )}
          </div>
        </section>

        <section className="bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-soft)] overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-lg font-black text-foreground tracking-tight">Refund Management</h2>
          </div>
          <div className="divide-y divide-[#F3F4F6] max-h-[480px] overflow-y-auto">
            {(data?.refunds || []).map((r) => (
              <div key={String(r.id)} className="px-5 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-bold text-foreground">
                    {String(r.type)} · {String(r.full_name || "")}
                  </p>
                  <span className="font-black text-emerald-600">
                    {formatCurrency(Number(r.amount || 0))}
                  </span>
                </div>
                <p className="text-xs text-gray-text mt-1">
                  {String(r.reason || "—")} · {formatDate(String(r.created_at || ""))}
                </p>
              </div>
            ))}
            {!data?.refunds?.length && (
              <EmptyState icon={Undo2} title="No refunds yet" className="py-12" />
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
