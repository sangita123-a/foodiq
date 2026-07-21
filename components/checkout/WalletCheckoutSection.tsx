"use client";

import { useState } from "react";
import useSWR from "swr";
import { Wallet, ToggleLeft, ToggleRight } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { fetchWallet } from "@/services/walletApi";

type Props = {
  grandTotal: number;
  walletAmount: number;
  onWalletChange: (amount: number) => void;
};

export default function WalletCheckoutSection({ grandTotal, walletAmount, onWalletChange }: Props) {
  const hasToken = useAuthToken();
  const { data } = useSWR(hasToken ? "/api/wallet" : null, fetchWallet);
  const balance = Number(data?.balance || 0);
  const [enabled, setEnabled] = useState(false);

  if (!hasToken || balance <= 0) return null;

  const maxUsable = Math.min(balance, grandTotal);
  const payable = Math.max(0, grandTotal - walletAmount);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    onWalletChange(next ? maxUsable : 0);
  };

  const adjustAmount = (value: number) => {
    const clamped = Math.min(Math.max(0, value), maxUsable);
    setEnabled(clamped > 0);
    onWalletChange(Math.round(clamped * 100) / 100);
  };

  return (
    <section className="mb-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-black text-foreground">Foodiq Wallet</h3>
        </div>
        <button type="button" onClick={toggle} className="text-primary" aria-label="Toggle wallet">
          {enabled ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8 text-[#9CA3AF]" />}
        </button>
      </div>

      <p className="mb-3 text-sm text-gray-text">
        Available balance: <span className="font-bold text-foreground">₹{balance.toFixed(2)}</span>
      </p>

      {enabled && (
        <div className="mb-3">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">
            Amount to use
          </label>
          <input
            type="number"
            min={0}
            max={maxUsable}
            step={1}
            value={walletAmount || maxUsable}
            onChange={(e) => adjustAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground"
          />
        </div>
      )}

      {walletAmount > 0 && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm">
          <p className="font-bold text-emerald-700">Wallet applied: -₹{walletAmount.toFixed(2)}</p>
          <p className="text-emerald-600">Pay ₹{payable.toFixed(2)} via {payable > 0 ? "Razorpay + wallet" : "wallet only"}</p>
        </div>
      )}
    </section>
  );
}
