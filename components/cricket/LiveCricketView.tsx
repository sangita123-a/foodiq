"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, ShoppingBag, ArrowLeft, Radio, Volume2, Award } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useToast } from "@/contexts/ToastContext";

export default function LiveCricketView() {
  const router = useRouter();
  const { showToast } = useToast();
  const { updateQuantity } = useCartActions();
  const [activeTab, setActiveTab] = useState<"stream" | "commentary" | "scorecard">("stream");

  const combos = [
    {
      id: "cricket_combo_1",
      name: "India Match Day Combo",
      price: 349,
      origPrice: 599,
      discount: "40% OFF",
      desc: "Large Cheese Burst Pizza + 2 Pepsi (500ml) + Garlic Bread",
      image: "/images/catalog/dishes/pizza/cheese-burst-pizza.webp",
      restId: "rest-pizza",
    },
    {
      id: "cricket_combo_2",
      name: "Sixer Party Bucket",
      price: 499,
      origPrice: 799,
      discount: "35% OFF",
      desc: "12 Warm Brownies + Ice Cream Family Pack + Coke",
      image: "/images/catalog/dishes/desserts/brownie-sundae.webp",
      restId: "rest-icecream",
    },
    {
      id: "cricket_combo_3",
      name: "Chiller Beverage Quad",
      price: 199,
      origPrice: 349,
      discount: "43% OFF",
      desc: "Coke + Pepsi + Virgin Mojito + Iced Tea Chilled Pack",
      image: "/images/catalog/dishes/beverages/coca-cola.webp",
      restId: "rest-cold-drinks",
    },
  ];

  const handleOrderCombo = async (combo: typeof combos[0]) => {
    await updateQuantity(combo.id, 1, {
      restaurant_id: combo.restId,
      name: combo.name,
      price: combo.price,
      image: combo.image,
      isVeg: true,
    });
    showToast(`🎉 ${combo.name} added to your cart!`, "success");
    router.push("/cart");
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="sr-only">Live Cricket and Match Day Food on Foodiq</h1>
      {/* Back Button & Title */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-foreground font-bold text-sm border border-border transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary text-white text-xs font-black uppercase tracking-wider shadow-sm animate-pulse">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>🔴 ICC MATCH LIVE BROADCAST</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Video & Score Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Video Box */}
          <div className="relative bg-black rounded-[24px] overflow-hidden shadow-2xl border border-gray-800 aspect-video flex flex-col justify-between p-6">
            <SafeImage
              src="/images/catalog/cricket-stadium.png"
              fallback={FOOD_FALLBACK}
              alt="Cricket Match Live Stream"
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />

            {/* Stream Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                <span className="text-xl">🇮🇳</span>
                <span className="font-black text-white text-sm">IND vs AUS</span>
                <span className="text-xl">🇦🇺</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-black rounded-lg uppercase tracking-widest flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" /> LIVE HD
                </span>
                <span className="px-3 py-1 bg-black/60 text-amber-300 text-xs font-bold rounded-lg border border-amber-300/30 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5" /> 1080p 60fps
                </span>
              </div>
            </div>

            {/* Live Scorecard Overlay */}
            <div className="relative z-10 bg-black/75 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                <div>
                  <div className="text-xs font-bold text-red-400 uppercase tracking-widest">
                    ICC World Cup Final · Over 42.3
                  </div>
                  <div className="text-2xl font-black text-amber-300 tracking-tight">
                    INDIA: 284/4 <span className="text-sm text-gray-300 font-medium">(42.3/50 ov)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 font-medium">Target: 312</div>
                  <div className="text-sm font-bold text-emerald-400">Needs 28 runs in 45 balls</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-medium text-gray-300">
                <div>
                  <span className="text-white font-bold">Batsmen:</span> Virat Kohli 94* (82), Hardik Pandya 38* (21)
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">Bowler:</span> Pat Cummins 2/54 (8.3 ov)
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="bg-white rounded-2xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("stream")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === "stream"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Match Info & Highlights
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("commentary")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === "commentary"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Ball-By-Ball Commentary
              </button>
            </div>

            {activeTab === "stream" ? (
              <div className="space-y-3">
                <div className="p-3 bg-primary-soft rounded-xl border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-xs font-black text-foreground">Match Day Special Offer</div>
                      <div className="text-[11px] text-gray-text">Apply coupon <span className="font-bold text-primary">MATCHCOMBO</span> for extra ₹100 flat discount!</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  High-stakes final overs! India requires 28 runs off 45 deliveries with 6 wickets in hand. Enjoy uninterrupted live stream paired with FoodIQ 30-minute flash delivery on all match combos.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 font-mono">
                  <span className="font-bold text-red-600">42.3</span> Pat Cummins to Hardik Pandya, <span className="font-bold text-emerald-600">FOUR!</span> Smashed over extra cover for a boundary!
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 font-mono">
                  <span className="font-bold text-red-600">42.2</span> Pat Cummins to Virat Kohli, 1 run, tucked away to deep mid-wicket.
                </div>
                <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 font-mono">
                  <span className="font-bold text-red-600">42.1</span> Pat Cummins to Virat Kohli, <span className="font-bold text-purple-600">SIX!</span> Picked off the pads over deep backward square leg!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Match Day Combo Order Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-border shadow-md">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Flame className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-black text-foreground">Match Day Food Combos</h3>
            </div>
            <p className="text-xs text-gray-text mb-4">
              Get express 20-30 min delivery directly to your doorstep while you enjoy the live cricket action!
            </p>

            <div className="space-y-4">
              {combos.map((c) => (
                <div
                  key={c.id}
                  className="group relative bg-footer hover:bg-white rounded-2xl p-3 border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="flex gap-3 mb-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative">
                      <SafeImage
                        src={c.image}
                        fallback={FOOD_FALLBACK}
                        alt={c.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="inline-block bg-primary text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase mb-1">
                        {c.discount}
                      </div>
                      <h4 className="text-xs font-black text-foreground truncate">{c.name}</h4>
                      <p className="text-[10px] text-gray-text line-clamp-1">{c.desc}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-black text-foreground">₹{c.price}</span>
                        <span className="text-[10px] text-gray-400 line-through font-medium">₹{c.origPrice}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOrderCombo(c)}
                    className="w-full py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Order Now</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
