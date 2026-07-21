"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/ui/SafeImage";
import Link from "next/link";
import { FOOD_FALLBACK } from "@/lib/images";
import { OFFER_PAGE_BANNER_SIZES } from "@/lib/performance/assets";
import { Tag, Clock, ArrowRight, Sparkles } from "lucide-react";
import { FIVE_BEST_OFFERS, PromotionalOffer } from "@/lib/data/20offersData";
import { setActiveOffer } from "@/lib/offers";
import { useToast } from "@/contexts/ToastContext";
import { useRouter } from "next/navigation";

export default function OffersPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleOrderNow = (offer: PromotionalOffer) => {
    setActiveOffer({
      couponCode: offer.code,
      title: offer.title,
      restaurantId: offer.restaurantId,
    });
    showToast(`Coupon ${offer.code} applied! Opening ${offer.restaurantName}...`, "success");
    router.push(`/restaurant/${offer.restaurantId}?deal=${offer.code}`);
  };

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[#E23744]/15 selection:text-[#1C1C1C] pt-[90px]">
      <Navbar />

      <div className="container mx-auto max-w-[1440px] px-4 md:px-8 py-10">
        {/* Page Header */}
        <div className="mb-10 text-center md:text-left border-b border-[#ECECEC] pb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FFF5F6] text-[#E23744] text-xs font-black uppercase tracking-wider mb-3 border border-[#E23744]/20">
            <Sparkles className="w-4 h-4" />
            <span>Today&apos;s Featured Deals</span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A1A1A] tracking-tight mb-3">
            Today&apos;s Best Offers
          </h1>
          <p className="text-[#666666] text-base md:text-lg max-w-2xl font-medium">
            Save big on your favorite food with active coupons applied automatically at checkout.
          </p>
        </div>

        {/* 5 Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FIVE_BEST_OFFERS.map((offer) => (
            <div
              key={offer.id}
              className="food-card relative group cursor-pointer bg-white p-6 flex flex-col justify-between border border-[#EAEAEA] rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 min-h-[220px]"
            >
              {/* Image Banner Background */}
              <div className="absolute top-0 right-0 w-40 sm:w-48 h-full opacity-40 group-hover:opacity-60 transition-opacity duration-300 group-hover:scale-105 transform origin-right overflow-hidden rounded-r-[18px]">
                <SafeImage
                  src={offer.image}
                  fallback={FOOD_FALLBACK}
                  alt={offer.title}
                  fill
                  sizes={OFFER_PAGE_BANNER_SIZES}
                  className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black)]"
                />
              </div>

              <div className="relative z-10 w-3/4 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#E23744] uppercase tracking-wider mb-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="truncate">{offer.restaurantName}</span>
                  </div>

                  <h3 className="text-xl font-black text-[#1C1C1C] mb-1 leading-tight group-hover:text-[#1C1C1C] transition-colors">
                    {offer.title}
                  </h3>

                  <span className="inline-block bg-[#E23744] text-white text-xs font-black px-2.5 py-0.5 rounded-md mb-2 uppercase tracking-wide">
                    {offer.discountBadge}
                  </span>

                  <p className="text-[#666666] text-xs font-medium line-clamp-2 mb-4">
                    {offer.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="inline-flex items-center bg-white border border-[#ECECEC] rounded-lg px-3 py-1 shadow-sm">
                      <span className="text-xs text-[#666666] uppercase tracking-wider font-semibold mr-2">Code:</span>
                      <span className="text-sm text-[#E23744] font-black tracking-wider">{offer.code}</span>
                    </div>

                    <div className="inline-flex items-center text-xs text-[#666666] font-bold gap-1 bg-[#F8F8F8] px-2.5 py-1 rounded-lg border border-[#ECECEC]">
                      <Clock className="w-3.5 h-3.5 text-[#E23744]" />
                      <span>{offer.expiryDate}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOrderNow(offer)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#E23744] hover:bg-[#C81E32] text-white text-sm font-semibold transition-all shadow-sm active:scale-98"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
