"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tag, Copy, CheckCircle2, Ticket, ArrowRight } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  fetchCoupons,
  couponTypeLabel,
  couponDiscountText,
  type CouponRecord,
} from "@/services/couponApi";

function CouponBrowseCard({ coupon, onCopy }: { coupon: CouponRecord; onCopy: (code: string) => void }) {
  return (
    <div className="bg-section border-2 border-dashed border-primary/30 rounded-3xl p-6 flex flex-col h-full hover:border-primary/60 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase">
          <Tag className="w-3.5 h-3.5" />
          {couponTypeLabel(coupon)}
        </span>
        <button
          type="button"
          onClick={() => onCopy(coupon.code)}
          className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center text-gray-text hover:text-primary"
          aria-label={`Copy ${coupon.code}`}
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <p className="font-mono font-black text-xl text-foreground tracking-wider mb-1">{coupon.code}</p>
      <p className="text-lg font-bold text-foreground mb-1">{coupon.title || couponDiscountText(coupon)}</p>
      <p className="text-2xl font-black text-emerald-600 mb-4">{couponDiscountText(coupon)}</p>

      <ul className="text-xs font-bold text-gray-text space-y-1 mb-4 flex-1">
        <li>Min. order: ₹{coupon.min_order_amount || 0}</li>
        <li>
          Valid till:{" "}
          {coupon.valid_until ? new Date(coupon.valid_until).toLocaleDateString("en-IN") : "No expiry"}
        </li>
        {coupon.one_time_per_user ? <li>One-time use per account</li> : null}
      </ul>

      {coupon.description ? (
        <p className="text-[10px] text-[#9CA3AF] mb-4 leading-relaxed">{coupon.description}</p>
      ) : null}

      <Link
        href={`/checkout?coupon=${encodeURIComponent(coupon.code)}`}
        className="w-full py-3 rounded-xl font-bold text-center bg-white border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
      >
        Apply at Checkout
      </Link>
    </div>
  );
}

export default function CouponsPageView() {
  const { showToast } = useToast();
  const hasToken = useAuthToken();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { data: coupons = [], isLoading } = useSWR("public-coupons", fetchCoupons);

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast(`Copied ${code}`, "success");
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      showToast("Could not copy code", "error");
    }
  };

  const grouped = {
    all: coupons,
    festival: coupons.filter((c) => c.coupon_type === "festival"),
    first_order: coupons.filter((c) => c.coupon_type === "first_order"),
    free_delivery: coupons.filter((c) => c.coupon_type === "free_delivery"),
  };

  return (
    <main className="min-h-screen bg-background relative pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Ticket className="w-7 h-7 text-primary" />
              <h1 className="text-3xl md:text-4xl font-black text-foreground">Coupons</h1>
            </div>
            <p className="text-gray-text max-w-xl">
              Browse active offers — flat discounts, percentage off, free delivery, first-order deals, and festival specials.
            </p>
          </div>
          {hasToken ? (
            <Link
              href="/my-rewards"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              My Rewards <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
        </div>

        {copiedCode ? (
          <div className="mb-6 flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-4 h-4" /> Code &apos;{copiedCode}&apos; copied to clipboard
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-section animate-pulse rounded-3xl border border-border" />
            ))}
          </div>
        ) : grouped.all.length === 0 ? (
          <div className="text-center py-20 bg-section rounded-3xl border border-border">
            <Ticket className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
            <p className="text-gray-text font-bold">No active coupons right now. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.first_order.length > 0 ? (
              <section>
                <h2 className="text-xl font-black text-foreground mb-4">First Order Offers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped.first_order.map((c) => (
                    <CouponBrowseCard key={c.id} coupon={c} onCopy={handleCopy} />
                  ))}
                </div>
              </section>
            ) : null}

            {grouped.festival.length > 0 ? (
              <section>
                <h2 className="text-xl font-black text-foreground mb-4">Festival Offers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped.festival.map((c) => (
                    <CouponBrowseCard key={c.id} coupon={c} onCopy={handleCopy} />
                  ))}
                </div>
              </section>
            ) : null}

            {grouped.free_delivery.length > 0 ? (
              <section>
                <h2 className="text-xl font-black text-foreground mb-4">Free Delivery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grouped.free_delivery.map((c) => (
                    <CouponBrowseCard key={c.id} coupon={c} onCopy={handleCopy} />
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <h2 className="text-xl font-black text-foreground mb-4">All Available Coupons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grouped.all.map((c) => (
                  <CouponBrowseCard key={c.id} coupon={c} onCopy={handleCopy} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
