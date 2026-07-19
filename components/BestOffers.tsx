"use client";

import Image from "next/image";
import Link from "next/link";
import { STATIC_OFFER_STYLES } from "@/lib/offers";

export default function BestOffers() {
  return (
    <section className="food-section">
      <div className="food-section-heading">
        <h2 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2 tracking-tight">Today's Best Offers</h2>
        <p>Save big with our exclusive deals.</p>
      </div>

      <div className="food-grid">
        {STATIC_OFFER_STYLES.map((offer) => (
          <Link
            key={offer.slug}
            href={`/offers/${offer.slug}`}
            className="food-card relative group cursor-pointer bg-gradient-to-br from-[#FFF7ED] to-white p-4 flex flex-col justify-center min-h-[170px]"
          >
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-full opacity-40 group-hover:opacity-50 transition-opacity duration-300 group-hover:scale-105 transform origin-right">
              <Image
                src={offer.image}
                alt={offer.title}
                fill
                sizes="(max-width: 640px) 128px, 192px"
                className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black)]"
              />
            </div>

            <div className="relative z-10 w-2/3">
              <h3 className="text-xl font-bold text-[#111827] mb-1 leading-tight">{offer.title}</h3>
              <p className="text-[#6B7280] text-sm font-medium mb-4">{offer.subtitle}</p>

              <div className="inline-flex items-center bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                <span className="text-xs sm:text-sm text-[#6B7280] uppercase tracking-wider font-semibold mr-2">Code:</span>
                <span className="text-sm sm:text-base text-[#E23744] font-bold">{offer.code}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
