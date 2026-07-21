"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tv, Sparkles, ChefHat, Truck } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { LIVE_HUB_IMAGES } from "@/lib/data/sectionImages";
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
    <section className="py-6 bg-background">
      <div className="container mx-auto max-w-[1440px] px-4 md:px-8">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-section text-gray-text text-xs font-black uppercase tracking-wider border border-border">
              <span aria-hidden="true">🔥</span>
              <span>Live Action & Deals</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              🔥 FOODIQ LIVE HUB
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-text hidden sm:inline-block">
            Updated Real-Time
          </span>
        </div>

        {/* 1 ROW ONLY (4 Equal Cards in Horizontal Line) */}
        <div className="flex overflow-x-auto snap-x scrollbar-none gap-4 md:gap-5 md:grid md:grid-cols-4 pb-2">
          
          {/* CARD 1: 🏏 LIVE CRICKET */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative rounded-[18px] p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-card hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300 border border-border bg-[#1A1A1A]">
            {/* Background Cricket Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0">
              <SafeImage
                src={LIVE_HUB_IMAGES.cricket}
                fallback="/images/catalog/restaurants/rest-street-food.jpg"
                alt="Live Cricket Match"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/80 to-black/60" />
            </div>

            {/* Top Bar: Live Badge & Sub-label */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C81E32] text-white text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse border border-white/20">
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
                className="inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-[#C81E32] hover:bg-primary-hover text-white text-[11px] font-black transition-all shadow-md active:scale-95"
              >
                <span>Order Match Combo</span>
              </button>
            </div>
          </div>

          {/* CARD 2: Live Cooking */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative bg-white rounded-[18px] border border-border p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 w-36 h-full opacity-35 group-hover:opacity-50 transition-opacity duration-300 overflow-hidden rounded-r-[18px]">
              <SafeImage
                src={LIVE_HUB_IMAGES.liveCooking}
                fallback={FOOD_FALLBACK}
                alt="Live cooking in restaurant kitchen"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full w-[72%]">
              <div>
                <div className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide mb-1.5">
                  <ChefHat className="w-3 h-3" />
                  <span>LIVE COOKING</span>
                </div>

                <h3 className="text-base font-black text-foreground line-clamp-1 group-hover:text-gray-text transition-colors">
                  Chef&apos;s Tandoor Special
                </h3>
                <p className="text-gray-text text-xs font-medium line-clamp-1 mb-2">
                  Fresh from the kitchen, straight to your door
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-base font-black text-foreground">₹349</span>
                  <span className="text-xs text-gray-text line-through font-medium">₹499</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddToCartAndNavigate(
                      "live_cooking_tandoor_1",
                      "Chef's Tandoor Special",
                      349,
                      LIVE_HUB_IMAGES.liveCookingDish,
                      "rest-tandoori",
                      "/restaurant/rest-tandoori"
                    )
                  }
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <span>Order Now</span>
                </button>
                <Link
                  href="/restaurant/rest-tandoori"
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-white hover:bg-section text-foreground text-[11px] font-bold transition-all border border-border active:scale-95"
                >
                  <span>View Menu</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CARD 3: Chef Kitchen */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative bg-white rounded-[18px] border border-border p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 w-36 h-full opacity-35 group-hover:opacity-50 transition-opacity duration-300 overflow-hidden rounded-r-[18px]">
              <SafeImage
                src={LIVE_HUB_IMAGES.chefKitchen}
                fallback={FOOD_FALLBACK}
                alt="Chef preparing food in restaurant kitchen"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full w-[72%]">
              <div>
                <div className="inline-flex items-center gap-1 bg-[#16A34A] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>CHEF SPECIAL</span>
                </div>

                <h3 className="text-base font-black text-foreground line-clamp-1 group-hover:text-gray-text transition-colors">
                  Smokey BBQ Platter
                </h3>
                <p className="text-gray-text text-xs font-medium line-clamp-1 mb-2">
                  Premium grilled meats &amp; sides
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-base font-black text-foreground">₹449</span>
                  <span className="text-xs text-gray-text line-through font-medium">₹599</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddToCartAndNavigate(
                      "chef_bbq_platter_1",
                      "Smokey BBQ Platter",
                      449,
                      LIVE_HUB_IMAGES.chefDish,
                      "rest-bbq",
                      "/restaurant/rest-bbq"
                    )
                  }
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <span>Order Now</span>
                </button>
                <Link
                  href="/restaurant/rest-bbq"
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-white hover:bg-section text-foreground text-[11px] font-bold transition-all border border-border active:scale-95"
                >
                  <span>View Menu</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CARD 4: Fresh Delivery */}
          <div className="min-w-[280px] sm:min-w-[300px] md:min-w-0 flex-1 group relative bg-white rounded-[18px] border border-border p-4 flex flex-col justify-between h-[210px] md:h-[220px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 w-36 h-full opacity-35 group-hover:opacity-50 transition-opacity duration-300 overflow-hidden rounded-r-[18px]">
              <SafeImage
                src={LIVE_HUB_IMAGES.freshDelivery}
                fallback={FOOD_FALLBACK}
                alt="Fresh ingredients and healthy delivery"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 [mask-image:linear-gradient(to_right,transparent,black_70%)]"
              />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full w-[72%]">
              <div>
                <div className="inline-flex items-center gap-1 bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wide mb-1.5">
                  <Truck className="w-3 h-3" />
                  <span>FRESH DELIVERY</span>
                </div>

                <h3 className="text-base font-black text-foreground line-clamp-1 group-hover:text-gray-text transition-colors">
                  Green Bowl &amp; Juice Combo
                </h3>
                <p className="text-gray-text text-xs font-medium line-clamp-1 mb-2">
                  Fresh ingredients delivered fast
                </p>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-base font-black text-foreground">₹199</span>
                  <span className="text-xs text-gray-text line-through font-medium">₹279</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddToCartAndNavigate(
                      "fresh_delivery_combo_1",
                      "Green Bowl & Juice Combo",
                      199,
                      LIVE_HUB_IMAGES.freshDish,
                      "rest-healthy",
                      "/restaurant/rest-healthy"
                    )
                  }
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <span>Order Now</span>
                </button>
                <Link
                  href="/restaurant/rest-healthy"
                  className="w-full inline-flex items-center justify-center py-1.5 rounded-xl bg-white hover:bg-section text-foreground text-[11px] font-bold transition-all border border-border active:scale-95"
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
