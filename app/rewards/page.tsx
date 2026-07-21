"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MembershipCard, { TierBenefitsList } from "@/components/loyalty/MembershipCard";
import ReferralPanel from "@/components/loyalty/ReferralPanel";
import LoyaltyHistoryList from "@/components/loyalty/LoyaltyHistoryList";
import { useLoyaltyOverview } from "@/hooks/useLoyalty";
import { redeemLoyaltyPoints, pointsToRupees } from "@/services/loyaltyApi";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";
import { Coins, Ticket, History, Sparkles, ShoppingBag } from "lucide-react";

export default function RewardsPage() {
  const hasToken = useAuthToken();
  const { data, isLoading, mutate } = useLoyaltyOverview();
  const { showToast } = useToast();
  const [redeeming, setRedeeming] = useState(false);
  const [tab, setTab] = useState<"benefits" | "coupons" | "history" | "earn">("benefits");

  const wallet = data?.wallet;
  const tier = wallet?.tier?.current;
  const benefits = tier?.benefits || {};

  const handleRedeem = async (points = 100) => {
    if (!wallet || wallet.points_balance < points) {
      showToast("Insufficient points", "error");
      return;
    }
    setRedeeming(true);
    try {
      const result = await redeemLoyaltyPoints(points);
      showToast(`Redeemed! Use coupon ${result.coupon.code} at checkout`, "success");
      mutate();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Redemption failed";
      showToast(msg || "Redemption failed", "error");
    } finally {
      setRedeeming(false);
    }
  };

  if (!hasToken) {
    return (
      <main className="min-h-screen bg-background pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center max-w-lg">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-black text-foreground mb-3">Foodiq Rewards</h1>
          <p className="text-gray-text mb-6">Sign in to view your membership, points wallet, and exclusive benefits.</p>
          <Link href="/login" className="inline-block bg-primary text-white font-black px-8 py-3 rounded-xl">
            Sign In
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-black text-foreground">Foodiq Rewards</h1>
          </div>
          <p className="text-gray-text">Your membership, points wallet, referrals, and exclusive benefits.</p>
        </div>

        {isLoading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-48 bg-section rounded-3xl border border-border" />
            <div className="h-32 bg-section rounded-3xl border border-border" />
          </div>
        )}

        {!isLoading && wallet && tier && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <MembershipCard
                  tier={tier}
                  pointsBalance={wallet.points_balance}
                  lifetimePoints={wallet.lifetime_points}
                  progressPercent={wallet.tier.progress_percent}
                  pointsToNext={wallet.tier.next?.points_needed ?? null}
                  nextTierName={wallet.tier.next?.name}
                  expiryDate={wallet.next_expiry}
                />
              </div>

              <div className="bg-white rounded-3xl border border-border p-6 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">Points Wallet</p>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-text">Current Points</span>
                      <span className="font-black text-foreground">{wallet.points_balance.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-text">Lifetime Points</span>
                      <span className="font-black text-foreground">{wallet.lifetime_points.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-text">Redeemed</span>
                      <span className="font-black text-foreground">{wallet.redeemed_points.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-text">Redeemable Value</span>
                      <span className="font-black text-emerald-600">₹{pointsToRupees(wallet.points_balance).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={redeeming || wallet.points_balance < 100}
                  onClick={() => handleRedeem(100)}
                  className="mt-6 w-full bg-primary text-white font-black py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  {redeeming ? "Redeeming…" : "Redeem 100 Points"}
                </button>
                <p className="text-xs text-[#9CA3AF] text-center mt-2">10 points = ₹1 · Min 100 points</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {([
                ["benefits", "Benefits", Sparkles],
                ["coupons", "Coupons", Ticket],
                ["history", "History", History],
                ["earn", "Earn Points", ShoppingBag],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                    tab === id ? "bg-primary text-white" : "bg-white border border-border text-gray-text"
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                {tab === "benefits" && (
                  <div className="bg-white rounded-3xl border border-border p-6">
                    <h2 className="text-lg font-black text-foreground mb-4">Your {tier.name} Benefits</h2>
                    <TierBenefitsList benefits={benefits} />
                  </div>
                )}

                {tab === "coupons" && (
                  <div className="bg-white rounded-3xl border border-border p-6">
                    <h2 className="text-lg font-black text-foreground mb-4">Available Coupons</h2>
                    <div className="space-y-3">
                      {(data?.coupons || []).map((c: Record<string, unknown>) => (
                        <div key={String(c.id)} className="border border-border rounded-xl p-4 flex justify-between items-center">
                          <div>
                            <p className="font-mono font-black text-primary">{String(c.code)}</p>
                            <p className="text-xs text-gray-text">
                              {c.discount_type === "percentage"
                                ? `${c.discount_amount}% off`
                                : `₹${c.discount_amount} off`}
                              {" · Min ₹"}{String(c.min_order_amount || 0)}
                            </p>
                          </div>
                          <Link href="/checkout" className="text-xs font-bold text-foreground bg-section px-3 py-1.5 rounded-lg border">
                            Use at Checkout
                          </Link>
                        </div>
                      ))}
                      {!data?.coupons?.length && <p className="text-sm text-gray-text">No coupons available right now.</p>}
                    </div>
                  </div>
                )}

                {tab === "history" && (
                  <div className="bg-white rounded-3xl border border-border p-6">
                    <h2 className="text-lg font-black text-foreground mb-4">Reward History</h2>
                    <LoyaltyHistoryList items={data?.history || []} />
                  </div>
                )}

                {tab === "earn" && (
                  <div className="bg-white rounded-3xl border border-border p-6">
                    <h2 className="text-lg font-black text-foreground mb-4">How to Earn Points</h2>
                    <div className="space-y-3">
                      {(data?.earn_rules || []).map((rule) => (
                        <div key={rule.rule_key} className="flex justify-between items-center border border-border rounded-xl px-4 py-3">
                          <span className="text-sm font-bold text-foreground">{rule.label}</span>
                          <span className="text-sm font-black text-primary">
                            {rule.rule_key === "order_delivered" ? "1 pt / ₹100" : `+${rule.points} pts`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <ReferralPanel
                code={data?.referral?.code || "—"}
                rewardPoints={data?.referral?.reward_points || 100}
                history={data?.referral?.history as Array<{ referee_name?: string; created_at?: string; points_awarded?: number }>}
              />
            </div>

            <div className="mt-8 bg-section rounded-2xl border border-border p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-foreground">Redeem at Checkout</p>
                <p className="text-sm text-gray-text">Choose coupon, wallet, or loyalty points when placing your order.</p>
              </div>
              <Link href="/checkout" className="bg-[#111827] text-white font-black px-6 py-3 rounded-xl text-center text-sm">
                Go to Checkout
              </Link>
            </div>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
