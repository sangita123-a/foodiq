"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIVE_BEST_OFFERS, PromotionalOffer } from "@/lib/data/20offersData";
import { setActiveOffer } from "@/lib/offers";
import { useToast } from "@/contexts/ToastContext";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { OFFER_BANNER_IMAGE_SIZES } from "@/lib/performance/assets";
import { Tag, Clock, ArrowRight } from "lucide-react";

export default function BestOffers() {
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
    <section className="food-section overflow-hidden">
      <div className="food-section-heading flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="mb-1 text-lg font-bold tracking-tight text-foreground md:mb-2 md:text-3xl">Today&apos;s Best Offers</h2>
          <p className="text-xs md:text-base">Save big with our exclusive deals across top restaurants.</p>
        </div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1.5 text-gray-text hover:text-[var(--color-primary)] font-bold text-sm transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 max-md:grid-cols-1 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {FIVE_BEST_OFFERS.map((offer) => (
          <article
            key={offer.id}
            className="food-card group relative flex min-h-0 flex-col justify-between overflow-hidden rounded-xl border border-border bg-white p-3 shadow-card transition-all duration-300 md:min-h-[200px] md:rounded-[18px] md:p-5 md:hover:-translate-y-1 md:hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]"
          >
            {/* Image Banner Background */}
            <div className="absolute top-0 right-0 h-full w-28 overflow-hidden rounded-r-xl opacity-40 transition-opacity duration-300 group-hover:opacity-60 sm:w-44 md:rounded-r-[18px] md:group-hover:scale-105">
              <SafeImage
                src={offer.image}
                fallback={FOOD_FALLBACK}
                alt={offer.title}
                fill
                sizes={OFFER_BANNER_IMAGE_SIZES}
                className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black)]"
              />
            </div>

            <div className="relative z-10 flex h-full w-[72%] flex-col justify-between md:w-3/4">
              <div>
                {/* Restaurant Name */}
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-text md:text-[11px]">
                  <Tag className="h-2.5 w-2.5 text-gray-text md:h-3 md:w-3" />
                  <span className="truncate">{offer.restaurantName}</span>
                </div>

                {/* Offer Title & Discount */}
                <h3 className="mb-0.5 text-base font-black leading-tight text-foreground transition-colors group-hover:text-foreground md:mb-1 md:text-xl sm:text-lg">
                  {offer.title}
                </h3>

                <span className="offer-badge mb-1.5 md:mb-2">
                  {offer.discountBadge}
                </span>

                <p className="mb-2 line-clamp-1 text-[11px] font-medium text-gray-text md:mb-3 md:text-xs">
                  {offer.description}
                </p>
              </div>

              <div>
                {/* Code & Expiry */}
                <div className="mb-2 flex flex-wrap items-center gap-1.5 md:mb-3 md:gap-2">
                  <div className="inline-flex items-center rounded-md border border-border bg-white px-2 py-0.5 shadow-sm md:rounded-lg md:px-2.5 md:py-1">
                    <span className="mr-1 text-[9px] font-semibold uppercase tracking-wider text-gray-text md:mr-1.5 md:text-[10px]">Code:</span>
                    <span className="text-[10px] font-black tracking-wider text-primary md:text-xs">{offer.code}</span>
                  </div>

                  <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-footer px-1.5 py-0.5 text-[9px] font-bold text-gray-text md:gap-1 md:rounded-lg md:px-2 md:py-1 md:text-[10px]">
                    <Clock className="h-2.5 w-2.5 text-gray-text md:h-3 md:w-3" />
                    <span className="truncate">{offer.expiryDate}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleOrderNow(offer)}
                  className="food-button food-button-primary w-full py-1.5 text-[11px] md:py-2 md:text-xs"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
