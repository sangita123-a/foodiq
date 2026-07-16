"use client";

import Image from "next/image";
import Link from "next/link";
import { STATIC_OFFER_STYLES } from "@/lib/offers";

export default function BestOffers() {
  return (
    <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Today's Best Offers</h2>
        <p className="text-gray-400 text-lg">Save big with our exclusive deals.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATIC_OFFER_STYLES.map((offer) => (
          <Link
            key={offer.slug}
            href={`/offers/${offer.slug}`}
            className={`relative rounded-3xl overflow-hidden group cursor-pointer bg-gradient-to-br ${offer.color} p-6 sm:p-8 flex flex-col justify-center min-h-[200px] sm:min-h-[240px]`}
          >
            <div className="absolute top-0 right-0 w-32 sm:w-48 h-full opacity-40 group-hover:opacity-50 transition-opacity duration-300 group-hover:scale-105 transform origin-right">
              <Image
                src={offer.image}
                alt={offer.title}
                fill
                className="object-cover object-left [mask-image:linear-gradient(to_right,transparent,black)]"
              />
            </div>

            <div className="relative z-10 w-2/3">
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 leading-tight">{offer.title}</h3>
              <p className="text-white/90 text-sm sm:text-base font-medium mb-6">{offer.subtitle}</p>

              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                <span className="text-xs sm:text-sm text-white uppercase tracking-wider font-semibold mr-2">Code:</span>
                <span className="text-sm sm:text-base text-white font-bold">{offer.code}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
