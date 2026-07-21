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
    <section className="food-section">
      <div className="food-section-heading">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 tracking-tight">Today&apos;s Best Offers</h2>
          <p>Save big with our exclusive deals across top restaurants.</p>
        </div>
        <Link
          href="/offers"
          className="inline-flex items-center gap-1.5 text-[#696969] hover:text-[var(--color-primary)] font-bold text-sm transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="food-grid">
        {FIVE_BEST_OFFERS.map((offer) => (
          <article
            key={offer.id}
            className="food-card relative group bg-white p-5 flex flex-col justify-between border border-[#EAEAEA] rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 min-h-[200px]"
          >
            {/* Image Banner Background */}
            <div className="absolute top-0 right-0 w-36 sm:w-44 h-full opacity-40 group-hover:opacity-60 transition-opacity duration-300 group-hover:scale-105 transform origin-right overflow-hidden rounded-r-[18px]">
              <SafeImage
                src={offer.image}
                fallback={FOOD_FALLBACK}
                alt={offer.title}
                fill
                sizes={OFFER_BANNER_IMAGE_SIZES}
                className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black)]"
              />
            </div>

            <div className="relative z-10 w-3/4 flex flex-col h-full justify-between">
              <div>
                {/* Restaurant Name */}
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#696969]">
                  <Tag className="w-3 h-3 text-[#696969]" />
                  <span className="truncate">{offer.restaurantName}</span>
                </div>

                {/* Offer Title & Discount */}
                <h3 className="text-lg sm:text-xl font-black text-[#1C1C1C] mb-1 leading-tight group-hover:text-[#1C1C1C] transition-colors">
                  {offer.title}
                </h3>

                <span className="offer-badge mb-2">
                  {offer.discountBadge}
                </span>

                <p className="text-[#666666] text-xs font-medium line-clamp-1 mb-3">
                  {offer.description}
                </p>
              </div>

              <div>
                {/* Code & Expiry */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center bg-white border border-[#ECECEC] rounded-lg px-2.5 py-1 shadow-sm">
                    <span className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold mr-1.5">Code:</span>
                    <span className="text-xs text-[#E23744] font-black tracking-wider">{offer.code}</span>
                  </div>

                  <div className="inline-flex items-center text-[10px] text-[#666666] font-bold gap-1 bg-[#F8F8F8] px-2 py-1 rounded-lg border border-[#ECECEC]">
                    <Clock className="w-3 h-3 text-[#696969]" />
                    <span>{offer.expiryDate}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleOrderNow(offer)}
                  className="food-button food-button-primary w-full py-2 text-xs"
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
