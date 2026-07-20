"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Gift,
  Ticket,
  Users,
  History,
  Copy,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  fetchMyRewards,
  couponTypeLabel,
  couponDiscountText,
} from "@/services/couponApi";

type Tab = "coupons" | "referral" | "history";

export default function MyRewardsView() {
  const hasToken = useAuthToken();
  const { showToast } = useToast();
  const [tab, setTab] = useState<Tab>("coupons");
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useSWR(hasToken ? "/api/coupons/my-rewards" : null, fetchMyRewards);

  const copyReferral = async () => {
    if (!data?.referral?.code) return;
    try {
      await navigator.clipboard.writeText(data.referral.code);
      setCopied(true);
      showToast("Referral code copied!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Could not copy code", "error");
    }
  };

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <Gift className="w-12 h-12 text-[#E23744] mx-auto mb-4" />
          <h1 className="text-3xl font-black text-[#111827] mb-3">My Rewards</h1>
          <p className="text-[#6B7280] mb-6">Sign in to view your coupons, referral earnings, and reward history.</p>
          <Link href="/login" className="inline-block bg-[#E23744] text-white font-black px-8 py-3 rounded-xl">
            Sign In
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Ticket }[] = [
    { id: "coupons", label: "Available Coupons", icon: Ticket },
    { id: "referral", label: "Referral Earnings", icon: Users },
    { id: "history", label: "Coupon History", icon: History },
  ];

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-7 h-7 text-[#E23744]" />
            <h1 className="text-3xl md:text-4xl font-black text-[#111827]">My Rewards</h1>
          </div>
          <p className="text-[#6B7280]">Your coupons, referral earnings, and usage history.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                tab === id ? "bg-[#E23744] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-[#F8FAFC] rounded-3xl border border-[#E5E7EB]" />
            <div className="h-40 bg-[#F8FAFC] rounded-3xl border border-[#E5E7EB]" />
          </div>
        ) : (
          <>
            {tab === "coupons" && (
              <div className="space-y-4">
                {(data?.available_coupons || []).length === 0 ? (
                  <div className="text-center py-16 bg-[#F8FAFC] rounded-3xl border border-[#E5E7EB]">
                    <Ticket className="w-10 h-10 text-[#9CA3AF] mx-auto mb-3" />
                    <p className="text-[#6B7280] font-bold">No coupons available right now.</p>
                    <Link href="/coupons" className="text-sm font-bold text-[#E23744] mt-2 inline-block">
                      Browse all coupons
                    </Link>
                  </div>
                ) : (
                  (data?.available_coupons || []).map((c) => (
                    <div
                      key={c.id}
                      className="bg-white border border-[#E5E7EB] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E23744] bg-[#E23744]/10 px-2 py-0.5 rounded">
                            {couponTypeLabel(c)}
                          </span>
                        </div>
                        <p className="font-mono font-black text-lg text-[#111827]">{c.code}</p>
                        <p className="text-sm text-[#6B7280]">
                          {couponDiscountText(c)} · Min ₹{c.min_order_amount || 0}
                          {c.valid_until
                            ? ` · Expires ${new Date(c.valid_until).toLocaleDateString("en-IN")}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(c.code);
                            showToast(`Copied ${c.code}`, "success");
                          }}
                          className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-sm font-bold text-[#111827]"
                        >
                          <Copy className="w-4 h-4 inline mr-1" /> Copy
                        </button>
                        <Link
                          href={`/checkout?coupon=${encodeURIComponent(c.code)}`}
                          className="px-4 py-2 rounded-xl bg-[#E23744] text-white text-sm font-bold"
                        >
                          Apply
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "referral" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#E23744] to-[#C81E34] rounded-3xl p-8 text-white">
                  <p className="text-sm font-bold uppercase tracking-widest text-white/80 mb-2">Total Referral Earnings</p>
                  <p className="text-4xl font-black mb-1">
                    {data?.referral?.earnings?.total_points || 0} pts
                  </p>
                  <p className="text-white/80 text-sm">
                    {data?.referral?.earnings?.credited_count || 0} credited ·{" "}
                    {data?.referral?.earnings?.pending_count || 0} pending first order
                  </p>
                </div>

                <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6">
                  <h2 className="text-lg font-black text-[#111827] mb-2">Your Referral Code</h2>
                  <p className="text-sm text-[#6B7280] mb-4">
                    Share with friends — they get a welcome bonus, you earn{" "}
                    {data?.referral?.reward_points || 100} points after their first order.
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-4 py-3 font-mono font-black tracking-widest">
                      {data?.referral?.code || "—"}
                    </div>
                    <button
                      type="button"
                      onClick={copyReferral}
                      className="px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const code = data?.referral?.code;
                        if (!code) return;
                        const text = `Join Foodiq with my code ${code} and we both earn rewards!`;
                        if (navigator.share) await navigator.share({ title: "Foodiq Referral", text });
                        else copyReferral();
                      }}
                      className="px-4 py-3 rounded-xl bg-[#E23744] text-white"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {(data?.referral?.history || []).length > 0 ? (
                  <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">Referral Activity</h3>
                    <div className="space-y-2">
                      {(data?.referral?.history || []).map((h, i) => (
                        <div key={i} className="flex justify-between items-center border border-[#E5E7EB] rounded-xl px-4 py-3">
                          <div>
                            <p className="font-bold text-[#111827]">{h.referee_name || "New user"}</p>
                            <p className="text-xs text-[#9CA3AF]">
                              {h.created_at ? new Date(h.created_at).toLocaleDateString("en-IN") : ""}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              h.status === "credited" ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {h.status === "credited"
                              ? `+${h.points_awarded || 0} pts`
                              : "Pending first order"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {tab === "history" && (
              <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6">
                <h2 className="text-lg font-black text-[#111827] mb-4">Coupon History</h2>
                {(data?.coupon_history || []).length === 0 ? (
                  <p className="text-sm text-[#6B7280] py-8 text-center">No coupons used yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(data?.coupon_history || []).map((h) => (
                      <div
                        key={h.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-[#E5E7EB] rounded-xl px-4 py-3"
                      >
                        <div>
                          <p className="font-mono font-black text-[#111827]">{h.coupon_code}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            {new Date(h.created_at).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-600">−₹{h.discount_amount}</p>
                          <p className="text-xs text-[#6B7280]">Paid ₹{h.final_price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/coupons" className="text-sm font-bold text-[#E23744] hover:underline">
            Browse all coupons →
          </Link>
          <Link href="/checkout" className="text-sm font-bold text-[#6B7280] hover:underline">
            Go to checkout →
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
