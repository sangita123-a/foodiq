"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Tv, Tag, Sparkles } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useToast } from "@/contexts/ToastContext";

export default function FoodiqLiveHub() {
  const router = useRouter();
  const { showToast } = useToast();
  const { updateQuantity } = useCartActions();

  const handleAddToCartAndNavigate = async (
    menuItemId: string,
    name: string,
    price: number,
    image: string,
    restaurantId: string,
    categoryUrl: string
  ) => {
    await updateQuantity(menuItemId, 1, {
      restaurant_id: restaurantId,
      name: name,
      price: price,
      image: image,
      isVeg: true,
    });
    showToast(`🛒 ${name} added to cart!`, "success");
    router.push(categoryUrl);
  };

  return (
    <section className="py-6 bg-[#FFFFFF]">
      <div className="container mx-auto max-w-[1440px] px-4 md:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#ECECEC]">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF5F6] text-[#E23744] text-xs font-black uppercase tracking-wider border border-[#E23744]/20">
              <Flame className="w-3.5 h-3.5 fill-[#E23744]" />
              <span>Live Action & Deals</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-2">
              🔥 FOODIQ LIVE HUB
            </h2>
          </div>
          <span className="text-xs font-bold text-[#666666] hidden sm:inline-block">
            Updated Real-Time
          </span>
        </div>

        {/* 1 ROW ONLY (4 Equal Cards in Horizontal Line) */}
        <div className="flex overflow-x-auto snap-x scrollbar-none gap-4 md:gap-5 md:grid md:grid-cols-4 pb-2">
          
          {/* CARD 1: 🏏 LIVE CRICKET */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative rounded-[18px] p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_32px_rgba(226,55,68,0.25)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 border border-[#ECECEC] bg-[#1A1A1A]">
            {/* Background Cricket Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
              <SafeImage
                src="/images/catalog/cricket-stadium.png"
                fallback="/images/catalog/cuisines/indian.webp"
                alt="Live Cricket Match"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/80 to-black/60" />
            </div>

            {/* Top Bar: Live Badge & Sub-label */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E23744] text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse border border-white/20">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>🔴 LIVE</span>
              </div>
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm border border-amber-300/30">
                ICC Match
              </span>
            </div>

            {/* Cricket Score & Teams */}
            <div className="relative z-10 my-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black text-white flex items-center gap-1.5">
                  <span className="text-base">🇮🇳</span> India vs Australia <span className="text-base">🇦🇺</span>
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-amber-300 tracking-tight">IND 284/4</span>
                <span className="text-xs font-bold text-gray-200">(42.3 ov)</span>
              </div>
              <p className="text-[11px] text-gray-300 font-medium line-clamp-1">
                Target: 312 · Needs 28 off 45 balls
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 relative z-10">
              <Link
                href="/live-cricket"
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold transition-all border border-white/30 backdrop-blur-md active:scale-95"
              >
                <Tv className="w-3.5 h-3.5 text-red-400" />
                <span>Watch Live</span>
              </Link>
              <button
                type="button"
                onClick={() =>
                  handleAddToCartAndNavigate(
                    "cricket_match_combo_1",
                    "India Match Day Combo",
                    349,
                    "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
                    "rest-pizza",
                    "/restaurant/rest-pizza?deal=MATCHCOMBO"
                  )
                }
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-[11px] font-black transition-all shadow-md active:scale-95"
              >
                <span>Order Match Combo</span>
              </button>
            </div>
          </div>

          {/* CARD 2: 🍕 PIZZA COMBO */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative bg-white rounded-[18px] border border-[#ECECEC] p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(226,55,68,0.15)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300">
            {/* Background Image Banner Right */}
            <div className="absolute top-0 right-0 w-36 h-full opacity-35 group-hover:opacity-50 transition-opacity duration-300 overflow-hidden rounded-r-[18px]">
              <SafeImage
                src="/images/catalog/dishes/pizza/cheese-burst-pizza.webp"
                fallback={FOOD_FALLBACK}
                alt="Cheese Burst Pizza"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full w-[72%]">
              <div>
                <div className="inline-flex items-center gap-1 bg-[#E23744] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide mb-1.5">
                  <Tag className="w-3 h-3" />
                  <span>40% OFF</span>
                </div>

                <h3 className="text-base font-black text-[#1A1A1A] line-clamp-1 group-hover:text-[#E23744] transition-colors">
                  🍕 Cheese Burst Pizza
                </h3>
                <p className="text-[#666666] text-xs font-medium line-clamp-1 mb-2">
                  Loaded mozzarella crust + Pepsi
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-base font-black text-[#1A1A1A]">₹299</span>
                  <span className="text-xs text-[#8E8E8E] line-through font-medium">₹499</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddToCartAndNavigate(
                      "pizza_combo_40",
                      "Cheese Burst Pizza (40% OFF)",
                      299,
                      "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
                      "rest-pizza",
                      "/cuisine/pizza"
                    )
                  }
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-[11px] font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <span>Order Now</span>
                </button>
                <Link
                  href="/cuisine/pizza"
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-[#F8F8F8] hover:bg-[#ECECEC] text-[#1A1A1A] text-[11px] font-bold transition-all border border-[#ECECEC] active:scale-95"
                >
                  <span>View Menu</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CARD 3: 🍰 DESSERT FEST */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative bg-white rounded-[18px] border border-[#ECECEC] p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(226,55,68,0.15)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300">
            {/* Background Image Banner Right */}
            <div className="absolute top-0 right-0 w-36 h-full opacity-35 group-hover:opacity-50 transition-opacity duration-300 overflow-hidden rounded-r-[18px]">
              <SafeImage
                src="/images/catalog/dishes/desserts/brownie-sundae.webp"
                fallback={FOOD_FALLBACK}
                alt="Brownie & Ice Cream"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full w-[72%]">
              <div>
                <div className="inline-flex items-center gap-1 bg-[#16A34A] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>BUY 1 GET 1</span>
                </div>

                <h3 className="text-base font-black text-[#1A1A1A] line-clamp-1 group-hover:text-[#E23744] transition-colors">
                  🍰 Brownie & Ice Cream
                </h3>
                <p className="text-[#666666] text-xs font-medium line-clamp-1 mb-2">
                  Warm fudge brownie + ice cream
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-base font-black text-[#1A1A1A]">₹189</span>
                  <span className="text-xs text-[#8E8E8E] line-through font-medium">₹378</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddToCartAndNavigate(
                      "dessert_bogo_1",
                      "Brownie & Ice Cream BOGO",
                      189,
                      "/images/catalog/dishes/desserts/brownie-sundae.webp",
                      "rest-icecream",
                      "/cuisine/desserts"
                    )
                  }
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-[11px] font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <span>Order Now</span>
                </button>
                <Link
                  href="/cuisine/desserts"
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-[#F8F8F8] hover:bg-[#ECECEC] text-[#1A1A1A] text-[11px] font-bold transition-all border border-[#ECECEC] active:scale-95"
                >
                  <span>View Menu</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CARD 4: 🥤 COLD DRINKS */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative bg-white rounded-[18px] border border-[#ECECEC] p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(226,55,68,0.15)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300">
            {/* Background Image Banner Right */}
            <div className="absolute top-0 right-0 w-36 h-full opacity-35 group-hover:opacity-50 transition-opacity duration-300 overflow-hidden rounded-r-[18px]">
              <SafeImage
                src="/images/catalog/dishes/beverages/coca-cola.webp"
                fallback={FOOD_FALLBACK}
                alt="Cold Drinks"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full w-[72%]">
              <div>
                <div className="inline-flex items-center gap-1 bg-[#E23744] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide mb-1.5">
                  <Tag className="w-3 h-3" />
                  <span>SUMMER COMBO</span>
                </div>

                <h3 className="text-base font-black text-[#1A1A1A] line-clamp-1 group-hover:text-[#E23744] transition-colors">
                  🥤 Coke, Pepsi & Mojito
                </h3>
                <p className="text-[#666666] text-xs font-medium line-clamp-1 mb-2">
                  Chilled carbonated trio pack
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-base font-black text-[#1A1A1A]">₹139</span>
                  <span className="text-xs text-[#8E8E8E] line-through font-medium">₹199</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddToCartAndNavigate(
                      "cold_drinks_combo_1",
                      "Coke, Pepsi & Mojito Trio",
                      139,
                      "/images/catalog/dishes/beverages/coca-cola.webp",
                      "rest-cold-drinks",
                      "/cuisine/beverages"
                    )
                  }
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-[#E23744] hover:bg-[#C81E34] text-white text-[11px] font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <span>Order Now</span>
                </button>
                <Link
                  href="/cuisine/beverages"
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-[#F8F8F8] hover:bg-[#ECECEC] text-[#1A1A1A] text-[11px] font-bold transition-all border border-[#ECECEC] active:scale-95"
                >
                  <span>View Menu</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
