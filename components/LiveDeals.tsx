"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Ticket } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { getBrandFoodImage, RESTAURANT_FALLBACK } from "@/lib/images";

type Deal = {
  id: number;
  restaurant: string;
  restaurantId?: string;
  logo: string;
  image: string;
  offer: string;
  code: string;
  description: string;
  deliveryTime: string;
  initialTimeInSeconds: number;
};

const fallbackDeals: Deal[] = [
  {
    id: 1,
    restaurant: "Domino's Pizza",
    logo: "https://logo.clearbit.com/dominos.co.in",
    image: getBrandFoodImage("Domino's Pizza"),
    offer: "🔥 Flat 50% OFF",
    code: "DOM50",
    description: "Get flat 50% off on all medium and large pizzas.",
    deliveryTime: "30 min",
    initialTimeInSeconds: 1 * 3600 + 45 * 60 + 28,
  },
  {
    id: 2,
    restaurant: "KFC",
    logo: "https://logo.clearbit.com/kfc.co.in",
    image: getBrandFoodImage("KFC"),
    offer: "🍗 Buy 1 Get 1",
    code: "KFCB1G1",
    description: "Buy any bucket and get another absolutely free.",
    deliveryTime: "25 min",
    initialTimeInSeconds: 0 * 3600 + 58 * 60 + 12,
  },
  {
    id: 3,
    restaurant: "Burger King",
    logo: "https://logo.clearbit.com/burgerking.in",
    image: getBrandFoodImage("Burger King"),
    offer: "🍔 Free Fries",
    code: "BKFREE",
    description: "Free medium fries with any Whopper meal.",
    deliveryTime: "20 min",
    initialTimeInSeconds: 2 * 3600 + 10 * 60 + 45,
  },
  {
    id: 4,
    restaurant: "Behrouz Biryani",
    logo: "https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/g1uompslbfswsnhm8pys",
    image: getBrandFoodImage("Behrouz Biryani"),
    offer: "🍛 ₹150 OFF",
    code: "BIRYANI150",
    description: "Save ₹150 on your first royal biryani order.",
    deliveryTime: "40 min",
    initialTimeInSeconds: 3 * 3600 + 25 * 60 + 18,
  },
];

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

function mapApiDeal(apiDeal: any, index: number): Deal {
  const fallback = fallbackDeals[index] || fallbackDeals[0];
  return {
    id: apiDeal.id || fallback.id,
    restaurant: apiDeal.restaurant_name || fallback.restaurant,
    restaurantId: apiDeal.restaurant_id,
    logo: apiDeal.logo_url || fallback.logo,
    image: apiDeal.banner_url || fallback.image,
    offer: apiDeal.offer_title || fallback.offer,
    code: apiDeal.coupon_code || fallback.code,
    description: apiDeal.description || fallback.description,
    deliveryTime: apiDeal.delivery_time_label || fallback.deliveryTime,
    initialTimeInSeconds: apiDeal.timer_seconds ?? fallback.initialTimeInSeconds,
  };
}

export default function LiveDeals() {
  const { data: apiDeals } = useSWR("/api/live-deals");

  const deals: Deal[] = useMemo(() => {
    if (apiDeals?.length) {
      return apiDeals.map((d: any, i: number) => mapApiDeal(d, i));
    }
    return fallbackDeals;
  }, [apiDeals]);

  const [timers, setTimers] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const initial: { [key: number]: number } = {};
    deals.forEach((deal) => {
      initial[deal.id] = deal.initialTimeInSeconds;
    });
    setTimers(initial);
  }, [deals]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) => {
        const newTimers = { ...prevTimers };
        let updated = false;
        Object.keys(newTimers).forEach((key) => {
          const id = Number(key);
          if (newTimers[id] > 0) {
            newTimers[id] -= 1;
            updated = true;
          }
        });
        return updated ? newTimers : prevTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-[#0F0F0F] w-full py-[100px] overflow-hidden border-t border-white/5 mt-8">
      <div className="w-[90%] max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-14 text-center md:text-left"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            🔥 Live Deals Ending Soon
          </h2>
          <p className="text-gray-400 text-lg md:text-xl font-light">
            Exclusive restaurant offers available for a limited time. Grab them before they're gone!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {deals.map((deal, index) => {
            const timeLeft = timers[deal.id] ?? deal.initialTimeInSeconds;
            const isExpired = timeLeft <= 0;
            const orderHref = deal.restaurantId
              ? `/restaurant/${deal.restaurantId}?deal=${deal.code}`
              : null;

            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                className="bg-[#171717] rounded-[22px] overflow-hidden flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] transition-all duration-300 group border border-white/5"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <SafeImage
                    src={deal.image}
                    fallback={RESTAURANT_FALLBACK}
                    alt={deal.restaurant}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-black/40"></div>

                  <div className="absolute top-4 left-4 bg-[#FF2D3B] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-[#FF2D3B]/40">
                    {deal.offer}
                  </div>

                  <div className="absolute -bottom-6 right-6 w-14 h-14 bg-white rounded-full p-1.5 shadow-xl border-4 border-[#171717] z-10 group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={deal.logo}
                      alt={`${deal.restaurant} logo`}
                      className="w-full h-full object-contain rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200";
                      }}
                    />
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col pt-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{deal.restaurant}</h3>
                  <p className="text-gray-400 text-sm mb-5 flex-1 line-clamp-2">{deal.description}</p>

                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-xs text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{deal.deliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-xs text-gray-300">
                      <Ticket className="w-3.5 h-3.5 text-green-400" />
                      <span className="font-mono">{deal.code}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
                        Ends in:
                      </span>
                      <span
                        className={`text-xl font-mono font-bold ${isExpired ? "text-red-500" : "text-white"}`}
                      >
                        {formatTime(timeLeft)}
                      </span>
                    </div>

                    {isExpired ? (
                      <button
                        disabled
                        className="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center bg-gray-800 text-gray-500 cursor-not-allowed"
                      >
                        Expired
                      </button>
                    ) : orderHref ? (
                      <Link
                        href={orderHref}
                        className="px-6 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center bg-[#FF2D3B] text-white hover:scale-105 hover:shadow-[0_0_15px_rgba(255,45,59,0.5)]"
                      >
                        Order Now
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="px-6 py-2.5 rounded-xl font-bold bg-gray-800 text-gray-500 cursor-not-allowed"
                      >
                        Order Now
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
