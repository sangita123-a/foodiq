"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import useSWR from "swr";
import Link from "next/link";
import { Tag, Percent } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { OFFER_FALLBACK, getOfferImage } from "@/lib/images";
import { OFFER_SLUG_MAP } from "@/lib/offers";

function getOfferHref(offer: { slug?: string; coupon_code?: string; code?: string }) {
  if (offer.slug) return `/offers/${offer.slug}`;
  const code = offer.coupon_code || offer.code;
  if (code && OFFER_SLUG_MAP[code]) return `/offers/${OFFER_SLUG_MAP[code]}`;
  return null;
}

export default function OffersPage() {
  const { data, isLoading } = useSWR("/api/offers");
  const offers = data || [];

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-5xl">
        <div className="mb-10 text-center md:text-left border-b border-[#E5E7EB] pb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-3">Offers & Deals</h1>
          <p className="text-[var(--color-gray-text)] text-lg">
            Save more on every order with active Foodiq coupons.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-56 bg-[#F8FAFC] animate-pulse rounded-2xl border border-[#E5E7EB]" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB]">
            <Percent className="w-12 h-12 text-[#9CA3AF] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No offers available</h3>
            <p className="text-[#6B7280] mb-6">Check back soon for new deals.</p>
            <Link
              href="/restaurants"
              className="inline-flex px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-medium"
            >
              Explore Restaurants
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer: any) => {
              const href = getOfferHref(offer);
              const code = offer.coupon_code || offer.code;
              const card = (
                <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl overflow-hidden hover:border-[var(--color-primary)]/40 transition-colors">
                  <div className="relative h-36 w-full overflow-hidden">
                    <SafeImage
                      src={getOfferImage(code, offer.banner_url)}
                      fallback={OFFER_FALLBACK}
                      alt={`${offer.title || code} offer`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-[#111827]/30/30 to-transparent" />
                  </div>
                  <div className="p-6 flex gap-4">
                    <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center shrink-0">
                      <Tag className="w-6 h-6 text-[var(--color-primary)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <h3 className="text-xl font-bold text-[#111827]">{offer.title || code}</h3>
                        <span className="text-[var(--color-primary)] font-bold text-sm shrink-0">
                          {offer.discount_type === "percentage"
                            ? `${offer.discount_amount}% OFF`
                            : code === "FREEDEL"
                              ? "Free Delivery"
                              : `₹${offer.discount_amount} OFF`}
                        </span>
                      </div>
                      <p className="text-[#6B7280] text-sm mb-1">Code: {code}</p>
                      <p className="text-[#6B7280] text-sm mb-3">
                        Min order ₹{offer.min_order_amount || offer.coupon_min_order || 0}
                        {offer.valid_until
                          ? ` · Valid till ${new Date(offer.valid_until).toLocaleDateString()}`
                          : " · No expiry"}
                      </p>
                      {href ? (
                        <span className="text-sm font-medium text-white hover:text-[var(--color-primary)] transition-colors">
                          View offer →
                        </span>
                      ) : (
                        <span className="text-sm text-[#9CA3AF]">Coupon only — apply at checkout</span>
                      )}
                    </div>
                  </div>
                </div>
              );

              return href ? (
                <Link key={offer.id} href={href}>
                  {card}
                </Link>
              ) : (
                <div key={offer.id}>{card}</div>
              );
            })}
          </div>
        )}

        <p className="text-[#9CA3AF] text-sm mt-8">
          Note: Coupons require login. Offer coupons apply automatically when you checkout from an offer page.
        </p>
      </div>

      <Footer />
    </main>
  );
}
