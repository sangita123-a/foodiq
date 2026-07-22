"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { OFFER_BANNER_IMAGE_SIZES } from "@/lib/performance/assets";
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
    <main className="min-h-screen bg-background relative selection:bg-primary/15 selection:text-foreground pt-14 max-md:pt-14 md:pt-[90px]">
      <Navbar />

      <div className="container mx-auto max-w-[1440px] px-3 py-4 max-md:px-3 max-md:py-4 md:px-8 md:py-10">
        {/* Page Header */}
        <div className="mb-4 border-b border-border pb-4 text-center max-md:mb-4 max-md:pb-4 md:mb-10 md:pb-8 md:text-left">
          <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary-soft px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary max-md:mb-2 md:mb-3 md:gap-1.5 md:px-3.5 md:py-1 md:text-xs">
            <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
            <span>Today&apos;s Featured Deals</span>
          </div>
          <h1 className="mb-1 text-lg font-black tracking-tight text-foreground max-md:text-lg md:mb-3 md:text-4xl lg:text-5xl">
            Today&apos;s Best Offers
          </h1>
          <p className="mx-auto max-w-2xl text-[11px] font-medium text-gray-text max-md:line-clamp-2 md:text-base lg:text-lg">
            Save big on your favorite food with active coupons applied automatically at checkout.
          </p>
        </div>

        {/* Offers Grid — compact 2-col on mobile */}
        <div className="grid grid-cols-2 gap-2 max-md:grid-cols-2 max-md:gap-2 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {FIVE_BEST_OFFERS.map((offer) => (
            <article
              key={offer.id}
              className="food-card group relative flex min-h-0 cursor-pointer flex-col justify-between overflow-hidden rounded-lg border border-border bg-white p-2 shadow-card transition-all duration-300 max-md:min-h-[140px] max-md:rounded-lg max-md:p-2 md:min-h-[220px] md:rounded-[18px] md:p-6 md:hover:-translate-y-1 md:hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
            >
              <div className="absolute top-0 right-0 h-full w-14 overflow-hidden rounded-r-lg opacity-35 transition-opacity duration-300 max-md:w-14 md:w-48 md:rounded-r-[18px] md:opacity-40 md:group-hover:scale-105 md:group-hover:opacity-60">
                <SafeImage
                  src={offer.image}
                  fallback={FOOD_FALLBACK}
                  alt={offer.title}
                  fill
                  sizes={OFFER_BANNER_IMAGE_SIZES}
                  className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black)]"
                />
              </div>

              <div className="relative z-10 flex h-full w-full flex-col justify-between md:w-3/4">
                <div>
                  <div className="mb-0.5 flex items-center gap-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-primary max-md:truncate md:mb-1 md:gap-1 md:text-xs">
                    <Tag className="h-2 w-2 shrink-0 md:h-3.5 md:w-3.5" />
                    <span className="truncate">{offer.restaurantName}</span>
                  </div>

                  <h3 className="mb-0.5 line-clamp-1 text-xs font-black leading-tight text-foreground max-md:text-xs md:mb-1 md:text-xl">
                    {offer.title}
                  </h3>

                  <span className="offer-badge mb-1 inline-block text-[8px] font-black uppercase tracking-wide max-md:mb-1 md:mb-2 md:px-2.5 md:py-0.5 md:text-xs">
                    {offer.discountBadge}
                  </span>

                  <p className="mb-1 line-clamp-1 text-[9px] font-medium text-gray-text max-md:hidden md:mb-4 md:block md:line-clamp-2 md:text-xs">
                    {offer.description}
                  </p>
                </div>

                <div>
                  <div className="mb-1.5 hidden flex-wrap items-center gap-2 md:mb-4 md:flex">
                    <div className="inline-flex items-center rounded-lg border border-border bg-white px-3 py-1 shadow-sm">
                      <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-gray-text">Code:</span>
                      <span className="text-sm font-black tracking-wider text-primary">{offer.code}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-footer px-2.5 py-1 text-xs font-bold text-gray-text">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{offer.expiryDate}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOrderNow(offer)}
                    className="food-button food-button-primary inline-flex w-full items-center justify-center gap-1 py-1 text-[10px] max-md:h-7 max-md:py-0 md:gap-2 md:py-2.5 md:text-sm"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
