"use client";

import Link from "next/link";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Wallet, Gift, RotateCcw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useAuthToken } from "@/hooks/useAuthToken";
import { fetchWallet, transactionLabel, type WalletTransaction } from "@/services/walletApi";

function TxnRow({ txn }: { txn: WalletTransaction }) {
  const isCredit = Number(txn.amount) > 0;
  return (
    <div className="flex items-center justify-between border border-[#E5E7EB] rounded-xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center ${
            isCredit ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
          }`}
        >
          {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
        </div>
        <div>
          <p className="font-bold text-[#111827] text-sm">{transactionLabel(txn)}</p>
          <p className="text-xs text-[#9CA3AF]">
            {new Date(txn.created_at).toLocaleString("en-IN")}
            {txn.note ? ` · ${txn.note}` : ""}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-black ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
          {isCredit ? "+" : ""}₹{Math.abs(Number(txn.amount)).toFixed(2)}
        </p>
        <p className="text-[10px] text-[#9CA3AF]">Bal ₹{Number(txn.balance_after).toFixed(2)}</p>
      </div>
    </div>
  );
}

export default function MyWalletView() {
  const hasToken = useAuthToken();
  const { data, isLoading } = useSWR(hasToken ? "/api/wallet" : null, fetchWallet);

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <Wallet className="w-12 h-12 text-[#E23744] mx-auto mb-4" />
          <h1 className="text-3xl font-black text-[#111827] mb-3">My Wallet</h1>
          <p className="text-[#6B7280] mb-6">Sign in to view your Foodiq Wallet balance and transaction history.</p>
          <Link href="/login" className="inline-block bg-[#E23744] text-white font-black px-8 py-3 rounded-xl">
            Sign In
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-7 h-7 text-[#E23744]" />
            <h1 className="text-3xl md:text-4xl font-black text-[#111827]">My Wallet</h1>
          </div>
          <p className="text-[#6B7280]">Use your balance at checkout. Refunds and cashback are stored here.</p>
        </div>

        {isLoading ? (
          <div className="h-48 bg-[#F8FAFC] animate-pulse rounded-3xl border border-[#E5E7EB] mb-8" />
        ) : (
          <>
            <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] rounded-3xl p-8 text-white mb-6">
              <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-2">Current Balance</p>
              <p className="text-5xl font-black mb-6">₹{Number(data?.balance || 0).toFixed(2)}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-white/80 text-xs font-bold mb-1">
                    <Gift className="w-3.5 h-3.5" /> Cashback Balance
                  </div>
                  <p className="text-xl font-black">₹{Number(data?.cashback_balance || 0).toFixed(2)}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-white/80 text-xs font-bold mb-1">
                    <RotateCcw className="w-3.5 h-3.5" /> Refund Balance
                  </div>
                  <p className="text-xl font-black">₹{Number(data?.refund_balance || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mb-8">
              <Link
                href="/checkout"
                className="flex-1 text-center bg-[#E23744] text-white font-black py-3 rounded-xl"
              >
                Use at Checkout
              </Link>
              <Link
                href="/my-orders"
                className="flex-1 text-center bg-white border border-[#E5E7EB] text-[#111827] font-black py-3 rounded-xl"
              >
                My Orders
              </Link>
            </div>

            <section>
              <h2 className="text-lg font-black text-[#111827] mb-4">Transaction History</h2>
              <div className="space-y-3">
                {(data?.transactions || []).length === 0 ? (
                  <p className="text-sm text-[#9CA3AF] text-center py-10 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
                    No transactions yet. Refunds and cashback will appear here.
                  </p>
                ) : (
                  (data?.transactions || []).map((txn) => <TxnRow key={txn.id} txn={txn} />)
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
