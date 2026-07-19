"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIVE_BEST_OFFERS, PromotionalOffer } from "@/lib/data/20offersData";
import { setActiveOffer } from "@/lib/offers";
import { useToast } from "@/contexts/ToastContext";
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
          className="inline-flex items-center gap-1.5 text-[#E23744] hover:text-[#C81E34] font-bold text-sm transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="food-grid">
        {FIVE_BEST_OFFERS.map((offer) => (
          <div
            key={offer.id}
            className="food-card relative group cursor-pointer bg-gradient-to-br from-[#FFF5F6] via-white to-white p-5 flex flex-col justify-between border border-[#ECECEC] rounded-[18px] hover:shadow-[0_12px_32px_rgba(226,55,68,0.12)] hover:-translate-y-1 transition-all duration-300 min-h-[200px]"
          >
            {/* Image Banner Background */}
            <div className="absolute top-0 right-0 w-36 sm:w-44 h-full opacity-40 group-hover:opacity-60 transition-opacity duration-300 group-hover:scale-105 transform origin-right overflow-hidden rounded-r-[18px]">
              <Image
                src={offer.image}
                alt={offer.title}
                fill
                sizes="(max-width: 640px) 144px, 176px"
                className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black)]"
              />
            </div>

            <div className="relative z-10 w-3/4 flex flex-col h-full justify-between">
              <div>
                {/* Restaurant Name */}
                <div className="flex items-center gap-1 text-[11px] font-bold text-[#E23744] uppercase tracking-wider mb-1">
                  <Tag className="w-3 h-3" />
                  <span className="truncate">{offer.restaurantName}</span>
                </div>

                {/* Offer Title & Discount */}
                <h3 className="text-lg sm:text-xl font-black text-[#1A1A1A] mb-1 leading-tight group-hover:text-[#E23744] transition-colors">
                  {offer.title}
                </h3>

                <span className="inline-block bg-[#E23744] text-white text-[11px] font-black px-2 py-0.5 rounded-md mb-2 uppercase tracking-wide">
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
                    <Clock className="w-3 h-3 text-[#E23744]" />
                    <span>{offer.expiryDate}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleOrderNow(offer)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-xs font-extrabold transition-all shadow-sm active:scale-98"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
