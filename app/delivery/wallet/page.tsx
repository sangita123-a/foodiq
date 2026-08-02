"use client";

import { useState } from "react";
import Link from "next/link";
import { mutate } from "swr";
import { Landmark } from "lucide-react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import { useDeliveryDashboard } from "@/hooks/useDeliveryData";
import useSWR from "swr";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  deliveryFetcher,
  formatCurrency,
  requestWalletWithdrawal,
  type DeliveryBankAccount,
  type DeliveryWallet,
} from "@/services/deliveryApi";
import { useToast } from "@/contexts/ToastContext";

const MIN_WITHDRAWAL = 100;

export default function DeliveryWalletPage() {
  const { data: dashboard } = useDeliveryDashboard();
  const hasToken = useAuthToken();
  const { showToast } = useToast();
  const { data, error, isLoading } = useSWR<DeliveryWallet>(
    hasToken ? "/api/delivery/wallet" : null,
    deliveryFetcher
  );
  const { data: bankAccount } = useSWR<DeliveryBankAccount | null>(
    hasToken ? "/api/delivery/bank-account" : null,
    deliveryFetcher
  );
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => {
    mutate("/api/delivery/wallet");
    mutate("/api/delivery/dashboard");
  };

  const hasApprovedBankAccount = bankAccount?.verification_status === "approved";
  const hasPendingWithdrawal = Number(data?.pending_balance || 0) > 0;
  const availableBalance = Number(data?.available_balance || 0);
  const canWithdraw = hasApprovedBankAccount && !hasPendingWithdrawal && availableBalance >= MIN_WITHDRAWAL;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestWalletWithdrawal(Number(amount), bankAccount?.id);
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

  const stats = [
    { label: "Available Balance", value: data?.available_balance, emphasis: true },
    { label: "Pending Balance", value: data?.pending_balance },
    { label: "Lifetime Earnings", value: data?.lifetime_earnings },
    { label: "Today Earnings", value: data?.today_earnings },
    { label: "Weekly Earnings", value: data?.weekly_earnings },
    { label: "Monthly Earnings", value: data?.monthly_earnings },
  ];

  return (
    <DeliveryShell title="Wallet" online={dashboard?.is_online}>
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load wallet.
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-foreground">Wallet &amp; Earnings</h1>
        <Link
          href="/delivery/transactions"
          className="text-sm font-bold text-primary hover:underline"
        >
          View Transactions →
        </Link>
      </div>

      {/* Wallet Card */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-8 shadow-card">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">
                {s.label}
              </p>
              {isLoading && !data ? (
                <div className="h-8 w-24 rounded bg-section animate-pulse" />
              ) : (
                <p
                  className={`font-black ${
                    s.emphasis ? "text-3xl text-primary" : "text-xl text-foreground"
                  }`}
                >
                  {formatCurrency(Number(s.value || 0))}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bank Account */}
      <section className="bg-white border border-border rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-black text-foreground mb-4">Bank Account</h2>
        {!bankAccount ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-sm text-gray-text">
              Add a bank account to withdraw your earnings.
            </p>
            <Link
              href="/delivery/bank-account"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold px-5 py-2.5 rounded-xl"
            >
              <Landmark className="w-4 h-4" />
              Add Bank Account
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{bankAccount.account_number_masked}</p>
                <p className="text-xs text-gray-text">
                  {bankAccount.bank_name} · {bankAccount.account_holder_name}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                  bankAccount.verification_status === "approved"
                    ? "bg-green-50 text-green-600"
                    : bankAccount.verification_status === "rejected"
                    ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                {bankAccount.verification_status}
              </span>
            </div>
            <Link
              href="/delivery/bank-account"
              className="text-sm font-bold text-primary hover:underline whitespace-nowrap"
            >
              Manage →
            </Link>
          </div>
        )}
      </section>

      <section className="bg-white border border-border rounded-2xl p-5 mb-8">
        <h2 className="text-lg font-black text-foreground mb-4">Request Withdrawal</h2>
        <form onSubmit={handleWithdraw} className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            min={MIN_WITHDRAWAL}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Amount (min ₹${MIN_WITHDRAWAL})`}
            className="flex-1 border border-border rounded-xl px-4 py-3 text-sm"
            required
            disabled={!canWithdraw}
          />
          <button
            type="submit"
            disabled={submitting || !amount || !canWithdraw}
            className="bg-primary hover:bg-primary-hover text-white font-bold px-6 py-3 rounded-xl disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Withdraw"}
          </button>
        </form>
        <p className="text-xs text-[#9CA3AF] mt-2">
          {!hasApprovedBankAccount
            ? "Add and verify your bank account to enable withdrawals."
            : hasPendingWithdrawal
            ? "You already have a pending withdrawal request."
            : `Withdrawals are made from your available balance only. Minimum withdrawal amount is ₹${MIN_WITHDRAWAL}.`}
        </p>
      </section>
    </DeliveryShell>
  );
}
