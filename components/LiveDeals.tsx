"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Ticket } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { getBrandFoodImage, RESTAURANT_FALLBACK } from "@/lib/images";

const LIVE_DEAL_FOOD_IMAGES: Record<string, string> = {
  "Domino's Pizza": "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
  KFC: "/images/catalog/dishes/fast-food/fried-chicken-bucket.webp",
  "Burger King": "/images/catalog/dishes/burger/double-patty-burger.webp",
  "Behrouz Biryani": "/images/catalog/dishes/biryani/chicken-biryani.webp",
  "Wow! Momo": "/images/catalog/dishes/chinese/veg-momos.webp",
  Subway: "/images/catalog/dishes/fast-food/veggie-sub.webp",
  "Barbeque Nation": "/images/catalog/dishes/north-indian/chicken-seekh-kebab.webp",
  "Haldiram's": "/images/catalog/dishes/indian/chole-bhature.webp",
  "Pizza Hut": "/images/catalog/dishes/pizza/farmhouse-pizza.webp",
  "McDonald's": "/images/catalog/dishes/burger/cheese-burger.webp",
  "Taco Bell": "/images/catalog/dishes/mexican/veg-taco.webp",
  Starbucks: "/images/catalog/dishes/beverages/salted-caramel-frappe.webp",
  Faasos: "/images/catalog/dishes/street-food/chicken-kathi-roll.webp",
  "Biryani By Kilo": "/images/catalog/dishes/biryani/hyderabadi-biryani.webp",
  "Baskin Robbins": "/images/catalog/dishes/desserts/vanilla-ice-cream.webp",
};

type Deal = {
  id: number;
  restaurant: string;
  restaurantId?: string;
  orderPath?: string;
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
    image: LIVE_DEAL_FOOD_IMAGES["Domino's Pizza"],
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
    image: LIVE_DEAL_FOOD_IMAGES.KFC,
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
    image: LIVE_DEAL_FOOD_IMAGES["Burger King"],
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
    image: LIVE_DEAL_FOOD_IMAGES["Behrouz Biryani"],
    offer: "🍛 ₹150 OFF",
    code: "BIRYANI150",
    description: "Save ₹150 on your first royal biryani order.",
    deliveryTime: "40 min",
    initialTimeInSeconds: 3 * 3600 + 25 * 60 + 18,
  },
];

const extraDeals: Deal[] = [
  {
    id: 101,
    restaurant: "Wow! Momo",
    logo: "https://logo.clearbit.com/wowmomo.com",
    image: LIVE_DEAL_FOOD_IMAGES["Wow! Momo"],
    offer: "🥟 Buy 2 Get 1 Free",
    code: "WOWMOMO3",
    description: "Buy any 2 plates of momos and get a third one free.",
    deliveryTime: "25 min",
    initialTimeInSeconds: 1 * 3600 + 20 * 60 + 40,
    orderPath: "/cuisine/chinese",
  },
  {
    id: 102,
    restaurant: "Subway",
    logo: "https://logo.clearbit.com/subway.com",
    image: LIVE_DEAL_FOOD_IMAGES.Subway,
    offer: "🥪 Flat ₹100 OFF",
    code: "SUB100",
    description: "Flat ₹100 off on all footlong subs and sandwiches.",
    deliveryTime: "20 min",
    initialTimeInSeconds: 2 * 3600 + 5 * 60 + 30,
    orderPath: "/cuisine/fast-food",
  },
  {
    id: 103,
    restaurant: "Barbeque Nation",
    logo: "https://logo.clearbit.com/barbequenation.com",
    image: LIVE_DEAL_FOOD_IMAGES["Barbeque Nation"],
    offer: "🍢 Unlimited Buffet",
    code: "BBQFEAST",
    description: "Unlimited grills, kebabs and tikkas at a fixed price.",
    deliveryTime: "35 min",
    initialTimeInSeconds: 0 * 3600 + 48 * 60 + 55,
    orderPath: "/cuisine/north-indian",
  },
  {
    id: 104,
    restaurant: "Haldiram's",
    logo: "https://logo.clearbit.com/haldirams.com",
    image: LIVE_DEAL_FOOD_IMAGES["Haldiram's"],
    offer: "🍛 Family Combo ₹299",
    code: "HALDIRAM299",
    description: "Complete Indian family combo meal at just ₹299.",
    deliveryTime: "30 min",
    initialTimeInSeconds: 2 * 3600 + 40 * 60 + 10,
    orderPath: "/cuisine/indian",
  },
  {
    id: 105,
    restaurant: "Pizza Hut",
    logo: "https://logo.clearbit.com/pizzahut.com",
    image: LIVE_DEAL_FOOD_IMAGES["Pizza Hut"],
    offer: "🍕 Buy 1 Get 1 Free",
    code: "PHBOGO",
    description: "Order any large pizza and get a second one free.",
    deliveryTime: "30 min",
    initialTimeInSeconds: 1 * 3600 + 55 * 60 + 20,
    orderPath: "/cuisine/pizza",
  },
  {
    id: 106,
    restaurant: "McDonald's",
    logo: "https://logo.clearbit.com/mcdonalds.com",
    image: LIVE_DEAL_FOOD_IMAGES["McDonald's"],
    offer: "🍔 McSaver ₹99",
    code: "MCD99",
    description: "Burger, fries and a coke combo at just ₹99.",
    deliveryTime: "20 min",
    initialTimeInSeconds: 0 * 3600 + 42 * 60 + 15,
    orderPath: "/cuisine/burger",
  },
  {
    id: 107,
    restaurant: "Taco Bell",
    logo: "https://logo.clearbit.com/tacobell.com",
    image: LIVE_DEAL_FOOD_IMAGES["Taco Bell"],
    offer: "🌮 2 Tacos Free",
    code: "TACO2",
    description: "Get 2 crunchy tacos free on orders above ₹399.",
    deliveryTime: "25 min",
    initialTimeInSeconds: 2 * 3600 + 15 * 60 + 35,
    orderPath: "/cuisine/mexican",
  },
  {
    id: 108,
    restaurant: "Starbucks",
    logo: "https://logo.clearbit.com/starbucks.com",
    image: LIVE_DEAL_FOOD_IMAGES.Starbucks,
    offer: "☕ 20% OFF",
    code: "SBUX20",
    description: "20% off on all handcrafted beverages and frappes.",
    deliveryTime: "15 min",
    initialTimeInSeconds: 1 * 3600 + 30 * 60 + 50,
    orderPath: "/cuisine/beverages",
  },
  {
    id: 109,
    restaurant: "Faasos",
    logo: "https://logo.clearbit.com/faasos.com",
    image: LIVE_DEAL_FOOD_IMAGES.Faasos,
    offer: "🌯 50% OFF Rolls",
    code: "ROLL50",
    description: "Flat 50% off on all signature wraps and rolls.",
    deliveryTime: "30 min",
    initialTimeInSeconds: 3 * 3600 + 5 * 60 + 25,
    orderPath: "/cuisine/street-food",
  },
  {
    id: 110,
    restaurant: "Biryani By Kilo",
    logo: "https://logo.clearbit.com/biryanibykilo.com",
    image: LIVE_DEAL_FOOD_IMAGES["Biryani By Kilo"],
    offer: "🍚 ₹200 OFF",
    code: "BBK200",
    description: "₹200 off on handi biryanis ordered by the kilo.",
    deliveryTime: "45 min",
    initialTimeInSeconds: 2 * 3600 + 50 * 60 + 5,
    orderPath: "/cuisine/biryani",
  },
  {
    id: 111,
    restaurant: "Baskin Robbins",
    logo: "https://logo.clearbit.com/baskinrobbins.com",
    image: LIVE_DEAL_FOOD_IMAGES["Baskin Robbins"],
    offer: "🍨 Free Scoop",
    code: "SCOOP1",
    description: "Free extra scoop with every sundae or ice cream tub.",
    deliveryTime: "20 min",
    initialTimeInSeconds: 1 * 3600 + 10 * 60 + 45,
    orderPath: "/cuisine/desserts",
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
  const restaurant = apiDeal.restaurant_name || fallback.restaurant;
  return {
    id: apiDeal.id || fallback.id,
    restaurant,
    restaurantId: apiDeal.restaurant_id,
    logo: apiDeal.logo_url || fallback.logo,
    image:
      LIVE_DEAL_FOOD_IMAGES[restaurant] ||
      getBrandFoodImage(restaurant, apiDeal.banner_url) ||
      fallback.image,
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
    const baseDeals: Deal[] = apiDeals?.length
      ? apiDeals.map((d: any, i: number) => mapApiDeal(d, i))
      : fallbackDeals;
    return [...baseDeals, ...extraDeals];
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
    <section className="mt-4 w-full overflow-hidden border-t border-[#E5E7EB] bg-[#F8FAFC]">
      <div className="food-section" style={{ paddingBlock: "28px" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-5 text-center md:text-left"
        >
          <h2 className="mb-1 text-xl font-bold tracking-tight text-[#111827] md:text-2xl">
            🔥 Live Deals Ending Soon
          </h2>
          <p className="text-xs leading-5 text-[#6B7280]">
            Exclusive restaurant offers available for a limited time. Grab them before they're gone!
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
          {deals.map((deal, index) => {
            const timeLeft = timers[deal.id] ?? deal.initialTimeInSeconds;
            const isExpired = timeLeft <= 0;
            const orderHref = deal.restaurantId
              ? `/restaurant/${deal.restaurantId}?deal=${deal.code}`
              : deal.orderPath || null;

            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.025 }}
                className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[16px] border border-[#E5E7EB] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-[border-color,box-shadow] duration-300 hover:border-[#FC8019]/40 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1),0_8px_24px_rgba(252,128,25,0.1)]"
              >
                <div className="relative h-[120px] w-full shrink-0 overflow-hidden rounded-t-[16px] bg-[#F8FAFC]">
                  <SafeImage
                    src={deal.image}
                    fallback={RESTAURANT_FALLBACK}
                    alt={`${deal.restaurant} — ${deal.offer}`}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#111827]/75/35 via-transparent to-[#F8FAFC]/5" />
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <div className="mb-2.5 flex min-w-0 items-center gap-2.5">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#E5E7EB] bg-white p-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.12)]">
                      <SafeImage
                        src={deal.logo}
                        fallback={RESTAURANT_FALLBACK}
                        alt={`${deal.restaurant} logo`}
                        className="h-full w-full rounded-full object-contain"
                      />
                    </div>
                    <h3 className="line-clamp-2 text-[13px] font-semibold leading-[17px] tracking-[-0.02em] text-[#111827]">
                      {deal.restaurant}
                    </h3>
                  </div>

                  <div className="mb-2 inline-flex w-fit max-w-full items-center rounded-md bg-[#FC8019]/10 px-2 py-1 text-[10px] font-bold leading-4 text-[#FC8019] ring-1 ring-inset ring-[#FC8019]/25">
                    <span className="truncate">{deal.offer}</span>
                  </div>

                  <p className="mb-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-[#6B7280]">
                    {deal.description}
                  </p>

                  <div className="mb-2.5 flex items-center gap-1.5">
                    <div className="flex min-w-0 items-center gap-1 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-1.5 py-1 text-[9px] font-medium text-[#6B7280]">
                      <Clock className="h-3 w-3 text-primary" />
                      <span className="whitespace-nowrap">{deal.deliveryTime}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-1 rounded-md border border-[#E5E7EB] bg-[#F8FAFC] px-1.5 py-1 text-[9px] font-medium text-[#6B7280]">
                      <Ticket className="h-3 w-3 text-green-400" />
                      <span className="truncate font-mono">{deal.code}</span>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-[#E5E7EB] pt-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#9CA3AF]">
                        Ends in
                      </span>
                      <span
                        className={`font-mono text-[13px] font-bold tracking-tight ${isExpired ? "text-red-500" : "text-[#111827]"}`}
                      >
                        {formatTime(timeLeft)}
                      </span>
                    </div>

                    {isExpired ? (
                      <button
                        disabled
                        className="flex h-8 w-full cursor-not-allowed items-center justify-center rounded-lg bg-[#E5E7EB] px-3 text-[11px] font-bold text-[#9CA3AF]"
                      >
                        Expired
                      </button>
                    ) : orderHref ? (
                      <Link
                        href={orderHref}
                        className="flex h-8 w-full items-center justify-center rounded-lg bg-[#FC8019] px-3 text-[11px] font-bold text-white shadow-[0_5px_14px_rgba(252,128,25,0.2)] transition-all duration-200 hover:bg-[#E76F0B] hover:shadow-[0_7px_18px_rgba(252,128,25,0.3)]"
                      >
                        Order Now
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="h-8 w-full cursor-not-allowed rounded-lg bg-[#E5E7EB] px-3 text-[11px] font-bold text-[#9CA3AF]"
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
