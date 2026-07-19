"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Star, Tag, Bookmark, Check, ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { RESTAURANT_FALLBACK, FOOD_FALLBACK } from "@/lib/images";
import { setActiveOffer } from "@/lib/offers";
import { useToast } from "@/contexts/ToastContext";

export interface LiveDealItem {
  id: string;
  restaurantId: string;
  restaurantName: string;
  logo: string;
  image: string;
  dealTitle: string;
  discountBadge: string;
  code: string;
  originalPrice: number;
  discountedPrice: number;
  rating: string;
  deliveryTime: string;
  initialSeconds: number;
}

export const TEN_LIVE_DEALS: LiveDealItem[] = [
  {
    id: "deal-1-pizza",
    restaurantId: "rest-pizza",
    restaurantName: "Pizza Italia Oven",
    logo: "/images/catalog/restaurants/logo-rest-pizza.jpg",
    image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
    dealTitle: "Pizza 50% OFF",
    discountBadge: "50% OFF",
    code: "PIZZA50",
    originalPrice: 499,
    discountedPrice: 249,
    rating: "4.9",
    deliveryTime: "25 min",
    initialSeconds: 1 * 3600 + 42 * 60 + 15,
  },
  {
    id: "deal-2-burger",
    restaurantId: "rest-burger",
    restaurantName: "Burger Craft House",
    logo: "/images/catalog/restaurants/logo-rest-burger.jpg",
    image: "/images/catalog/dishes/burger/crispy-chicken-burger.webp",
    dealTitle: "Burger Combo BOGO",
    discountBadge: "BUY 1 GET 1",
    code: "BURGERBOGO",
    originalPrice: 399,
    discountedPrice: 199,
    rating: "4.8",
    deliveryTime: "20 min",
    initialSeconds: 0 * 3600 + 58 * 60 + 40,
  },
  {
    id: "deal-3-drinks",
    restaurantId: "rest-cold-drinks",
    restaurantName: "The Soda & Chill Hub",
    logo: "/images/catalog/restaurants/logo-rest-cold-drinks.jpg",
    image: "/images/catalog/dishes/beverages/coca-cola.webp",
    dealTitle: "Cold Drinks Chiller",
    discountBadge: "30% OFF",
    code: "DRINK30",
    originalPrice: 199,
    discountedPrice: 139,
    rating: "4.9",
    deliveryTime: "15 min",
    initialSeconds: 2 * 3600 + 15 * 60 + 20,
  },
  {
    id: "deal-4-coffee",
    restaurantId: "rest-coffee",
    restaurantName: "Espresso & Co. Roastery",
    logo: "/images/catalog/restaurants/logo-rest-coffee.jpg",
    image: "/images/catalog/dishes/beverages/cold-coffee.webp",
    dealTitle: "Coffee Day Brew",
    discountBadge: "BUY 1 GET 1",
    code: "COFFEE50",
    originalPrice: 299,
    discountedPrice: 149,
    rating: "4.8",
    deliveryTime: "15 min",
    initialSeconds: 1 * 3600 + 10 * 60 + 50,
  },
  {
    id: "deal-5-cakes",
    restaurantId: "rest-cakes",
    restaurantName: "The Velvet Cake Studio",
    logo: "/images/catalog/restaurants/logo-rest-cakes.jpg",
    image: "/images/catalog/dishes/bakery/chocolate-cake.webp",
    dealTitle: "Cake Special Treat",
    discountBadge: "40% OFF",
    code: "CAKE50",
    originalPrice: 699,
    discountedPrice: 419,
    rating: "4.9",
    deliveryTime: "30 min",
    initialSeconds: 3 * 3600 + 20 * 60 + 30,
  },
  {
    id: "deal-6-icecream",
    restaurantId: "rest-icecream",
    restaurantName: "Frosty Scoop Creamery",
    logo: "/images/catalog/restaurants/logo-rest-icecream.jpg",
    image: "/images/catalog/dishes/desserts/chocolate-ice-cream.webp",
    dealTitle: "Ice Cream Delight",
    discountBadge: "40% OFF",
    code: "SWEET40",
    originalPrice: 249,
    discountedPrice: 186,
    rating: "4.8",
    deliveryTime: "20 min",
    initialSeconds: 0 * 3600 + 45 * 60 + 10,
  },
  {
    id: "deal-7-biryani",
    restaurantId: "rest-biryani",
    restaurantName: "Royal Hyderabadi Biryani",
    logo: "/images/catalog/restaurants/logo-rest-biryani.jpg",
    image: "/images/catalog/dishes/biryani/hyderabadi-chicken-biryani.webp",
    dealTitle: "Royal Biryani Fest",
    discountBadge: "₹150 OFF",
    code: "BIRYANI150",
    originalPrice: 499,
    discountedPrice: 349,
    rating: "4.9",
    deliveryTime: "35 min",
    initialSeconds: 2 * 3600 + 5 * 60 + 45,
  },
  {
    id: "deal-8-chinese",
    restaurantId: "rest-chinese",
    restaurantName: "Dragon Wok Chinese",
    logo: "/images/catalog/restaurants/logo-rest-chinese.jpg",
    image: "/images/catalog/dishes/chinese/hakka-noodles.webp",
    dealTitle: "Chinese Wok Combo",
    discountBadge: "20% OFF",
    code: "CHINESE20",
    originalPrice: 349,
    discountedPrice: 279,
    rating: "4.7",
    deliveryTime: "25 min",
    initialSeconds: 1 * 3600 + 35 * 60 + 0,
  },
  {
    id: "deal-9-momos",
    restaurantId: "rest-momos",
    restaurantName: "Himalayan Momo Corner",
    logo: "/images/catalog/restaurants/logo-rest-momos.jpg",
    image: "/images/catalog/dishes/dish-mo-1.jpg",
    dealTitle: "Momos Festival",
    discountBadge: "BUY 2 GET 1",
    code: "MOMOS15",
    originalPrice: 299,
    discountedPrice: 199,
    rating: "4.8",
    deliveryTime: "20 min",
    initialSeconds: 0 * 3600 + 32 * 60 + 25,
  },
  {
    id: "deal-10-south-indian",
    restaurantId: "rest-south-indian",
    restaurantName: "Dakshin Dosa Express",
    logo: "/images/catalog/restaurants/logo-rest-south-indian.jpg",
    image: "/images/catalog/dishes/south-indian/masala-dosa.webp",
    dealTitle: "South Indian Express",
    discountBadge: "30% OFF",
    code: "DOSA30",
    originalPrice: 249,
    discountedPrice: 174,
    rating: "4.9",
    deliveryTime: "25 min",
    initialSeconds: 2 * 3600 + 40 * 60 + 0,
  },
];

const formatCountdown = (totalSecs: number) => {
  if (totalSecs <= 0) return "Deal Expired";
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const SAVED_OFFERS_KEY = "foodiq_saved_offers";

export default function LiveDeals() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: apiDeals } = useSWR("/api/live-deals");
  const [savedDealIds, setSavedDealIds] = useState<Set<string>>(new Set());

  // Load saved offers from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_OFFERS_KEY);
      if (raw) {
        setSavedDealIds(new Set(JSON.parse(raw)));
      }
    } catch {
      // ignore
    }
  }, []);

  const deals: LiveDealItem[] = useMemo(() => {
    if (apiDeals?.length) {
      return apiDeals.map((d: any, idx: number) => {
        const fallback = TEN_LIVE_DEALS[idx % TEN_LIVE_DEALS.length];
        return {
          id: String(d.id || fallback.id),
          restaurantId: String(d.restaurant_id || fallback.restaurantId),
          restaurantName: d.restaurant_name || fallback.restaurantName,
          logo: d.logo_url || fallback.logo,
          image: d.banner_url || fallback.image,
          dealTitle: d.offer_title || fallback.dealTitle,
          discountBadge: d.offer_badge || fallback.discountBadge,
          code: d.coupon_code || fallback.code,
          originalPrice: Number(d.original_price || fallback.originalPrice),
          discountedPrice: Number(d.discounted_price || fallback.discountedPrice),
          rating: String(d.rating || fallback.rating),
          deliveryTime: d.delivery_time_label || fallback.deliveryTime,
          initialSeconds: d.timer_seconds || fallback.initialSeconds,
        };
      });
    }
    return TEN_LIVE_DEALS;
  }, [apiDeals]);

  const [timers, setTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    const initMap: Record<string, number> = {};
    deals.forEach((d) => {
      initMap[d.id] = d.initialSeconds;
    });
    setTimers(initMap);
  }, [deals]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        let hasChanges = false;
        Object.keys(updated).forEach((id) => {
          if (updated[id] > 0) {
            updated[id] -= 1;
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOrderNow = (deal: LiveDealItem) => {
    setActiveOffer({
      couponCode: deal.code,
      title: deal.dealTitle,
      restaurantId: deal.restaurantId,
    });
    showToast(`Deal applied! Opening ${deal.restaurantName}...`, "success");
    router.push(`/restaurant/${deal.restaurantId}?deal=${deal.code}`);
  };

  const handleToggleSaveOffer = (e: React.MouseEvent, deal: LiveDealItem) => {
    e.stopPropagation();
    const isSaved = savedDealIds.has(deal.id);
    const newSet = new Set(savedDealIds);
    if (isSaved) {
      newSet.delete(deal.id);
      showToast(`Offer removed from saved list`, "success");
    } else {
      newSet.add(deal.id);
      showToast(`Offer "${deal.dealTitle}" saved to account!`, "success");
    }
    setSavedDealIds(newSet);
    try {
      localStorage.setItem(SAVED_OFFERS_KEY, JSON.stringify(Array.from(newSet)));
    } catch {
      // ignore
    }
  };

  return (
    <section className="py-8 bg-[#FFFFFF] border-t border-[#ECECEC]">
      <div className="container mx-auto max-w-[1440px] px-4 md:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-[#ECECEC] gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF5F6] text-[#E23744] text-[11px] font-black uppercase tracking-wider mb-1.5 border border-[#E23744]/20">
              <Flame className="w-3.5 h-3.5 fill-[#E23744]" />
              <span>Limited Time Flash Deals</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] tracking-tight">
              Live Deals Ending Soon
            </h2>
          </div>

          <Link
            href="/offers"
            className="inline-flex items-center gap-1.5 text-[#E23744] hover:text-[#C81E34] font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <span>View All Deals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Compact Cards Grid (2 cols mobile, 3 cols tablet, 5 cols desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-[18px]">
          {deals.map((deal) => {
            const secsLeft = timers[deal.id] ?? deal.initialSeconds;
            const isExpired = secsLeft <= 0;
            const isSaved = savedDealIds.has(deal.id);

            return (
              <div
                key={deal.id}
                onClick={() => !isExpired && handleOrderNow(deal)}
                className="group relative bg-white rounded-[16px] border border-[#ECECEC] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(226,55,68,0.12)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 flex flex-col h-[290px] cursor-pointer"
              >
                {/* Cover Image (Height: 130px) */}
                <div className="relative h-[130px] w-full overflow-hidden bg-[#F8F8F8] shrink-0">
                  <SafeImage
                    src={deal.image}
                    fallback={FOOD_FALLBACK}
                    alt={deal.dealTitle}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                  {/* Discount Badge */}
                  <div className="absolute top-2 left-2 bg-[#E23744] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-md uppercase tracking-wider">
                    {deal.discountBadge}
                  </div>

                  {/* Save Offer Bookmark Button */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleSaveOffer(e, deal)}
                    className="absolute top-2 right-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full text-[#1A1A1A] hover:bg-white hover:text-[#E23744] transition-colors shadow-sm"
                    title={isSaved ? "Saved to your account" : "Save Offer"}
                  >
                    {isSaved ? (
                      <Check className="w-3.5 h-3.5 text-[#16A34A] stroke-[3]" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Countdown Timer Badge */}
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/20">
                    <Clock className="w-3 h-3 text-[#E23744]" />
                    <span>{formatCountdown(secsLeft)}</span>
                  </div>
                </div>

                {/* Compact Content Area */}
                <div className="p-3 flex flex-col flex-1 justify-between min-w-0">
                  <div>
                    {/* Restaurant Logo + Name */}
                    <div className="flex items-center gap-1.5 mb-1 min-w-0">
                      <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-[#ECECEC]">
                        <SafeImage
                          src={deal.logo}
                          fallback={RESTAURANT_FALLBACK}
                          alt={deal.restaurantName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[#666666] text-[11px] font-bold truncate">
                        {deal.restaurantName}
                      </span>
                    </div>

                    {/* Deal Title */}
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#1A1A1A] line-clamp-1 group-hover:text-[#E23744] transition-colors mb-1">
                      {deal.dealTitle}
                    </h3>

                    {/* Price & Rating Row */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-extrabold text-[#1A1A1A] text-sm">
                          ₹{deal.discountedPrice}
                        </span>
                        <span className="text-[11px] text-[#8E8E8E] line-through font-medium">
                          ₹{deal.originalPrice}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="bg-[#16A34A] text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          {deal.rating}
                          <Star className="w-2.5 h-2.5 fill-white" />
                        </span>
                        <span className="text-[10px] text-[#666666] font-medium">• {deal.deliveryTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    type="button"
                    disabled={isExpired}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isExpired) handleOrderNow(deal);
                    }}
                    className={`w-full inline-flex items-center justify-center py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-sm ${
                      isExpired
                        ? "bg-[#ECECEC] text-[#8E8E8E] cursor-not-allowed"
                        : "bg-[#E23744] hover:bg-[#C81E34] text-white active:scale-98"
                    }`}
                  >
                    <span>{isExpired ? "Deal Expired" : "Order Now"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
