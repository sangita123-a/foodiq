"use client";

import { useState } from "react";
import { mutate } from "swr";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  deliveryFetcher,
  formatCurrency,
  formatRelativeTime,
  requestWalletWithdrawal,
  type DeliveryWallet,
} from "@/services/deliveryApi";
import { useToast } from "@/contexts/ToastContext";

export default function DeliveryWalletPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const hasToken = useAuthToken();
  const { showToast } = useToast();
  const { data, error, isLoading } = useSWR<DeliveryWallet>(
    hasToken ? "/api/delivery/wallet" : null,
    deliveryFetcher
  );
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    mutate("/api/delivery/wallet");
    mutate("/api/delivery/dashboard");
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestWalletWithdrawal(Number(amount));
      showToast("Withdrawal request submitted", "success");
      setAmount("");
      refresh();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      showToast(ax.response?.data?.message || "Withdrawal failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DeliveryShell title="Wallet" online={dashboard?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load wallet.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
            Wallet Balance
          </p>
          <p className="text-3xl font-black text-[#111827]">
            {formatCurrency(data?.balance || dashboard?.wallet_balance || 0)}
          </p>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
            Total Earned
          </p>
          <p className="text-3xl font-black text-[#E23744]">
            {formatCurrency(data?.total_earned || dashboard?.total_earnings || 0)}
          </p>
        </div>
      </div>

      <section className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-black text-[#111827] mb-4">Request Withdrawal</h2>
        <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            min={100}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (min ₹100)"
            className="flex-1 border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#E23744] hover:bg-[#C81E34] text-white font-bold px-6 py-3 rounded-xl disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Withdraw"}
          </button>
        </form>
        <p className="text-xs text-[#9CA3AF] mt-2">
          Add bank or UPI details in Profile before requesting a withdrawal.
        </p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-lg font-black text-[#111827]">Transaction History</h2>
          </div>
          {isLoading && !data && (
            <p className="p-6 text-sm text-[#6B7280]">Loading transactions...</p>
          )}
          <div className="divide-y divide-[#F3F4F6]">
            {(data?.transactions || []).map((tx) => (
              <div key={tx.id} className="px-5 py-4 flex justify-between gap-3">
                <div>
                  <p className="font-bold text-[#111827] capitalize">{tx.type}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {tx.note || tx.status} · {formatRelativeTime(tx.created_at)}
                  </p>
                </div>
                <p
                  className={`font-black ${
                    tx.type === "credit" ? "text-emerald-600" : "text-[#111827]"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {formatCurrency(Number(tx.amount))}
                </p>
              </div>
            ))}
            {!data?.transactions?.length && !isLoading && (
              <p className="p-8 text-sm text-[#6B7280] text-center">No transactions yet.</p>
            )}
          </div>
        </section>

        <section className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-lg font-black text-[#111827]">Withdrawal Requests</h2>
          </div>
          <div className="divide-y divide-[#F3F4F6]">
            {(data?.withdrawals || []).map((w) => (
              <div key={w.id} className="px-5 py-4 flex justify-between gap-3">
                <div>
                  <p className="font-bold text-[#111827]">{formatCurrency(Number(w.amount))}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {w.status} · {formatRelativeTime(w.created_at)}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[#F8FAFC] text-[#6B7280] uppercase">
                  {w.status}
                </span>
              </div>
            ))}
            {!data?.withdrawals?.length && !isLoading && (
              <p className="p-8 text-sm text-[#6B7280] text-center">No withdrawal requests.</p>
            )}
          </div>
        </section>
      </div>
    </DeliveryShell>
  );
}
