"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, SlidersHorizontal } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import SafeImage from "@/components/ui/SafeImage";
import CollectionFoodCard from "@/components/collections/CollectionFoodCard";
import CollectionNotFound from "@/components/collections/CollectionNotFound";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";
import { useToast } from "@/contexts/ToastContext";
import {
  getCollectionBySlug,
  getCollectionDishes,
  type CollectionDishItem,
} from "@/lib/data/collectionsData";

type Props = {
  slug: string;
};

export default function CollectionDetailView({ slug }: Props) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [diet, setDiet] = useState<"all" | "veg" | "nonveg">("all");
  const [sort, setSort] = useState<"popular" | "price-low" | "price-high" | "rating">("popular");
  const { quantities, updateQuantity } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  const collection = getCollectionBySlug(slug);
  const dishes = getCollectionDishes(slug);

  const filteredDishes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = dishes.filter((dish) => {
      const matchesSearch =
        !query ||
        dish.name.toLowerCase().includes(query) ||
        dish.restaurantName.toLowerCase().includes(query);
      const matchesDiet =
        diet === "all" ||
        (diet === "veg" ? dish.isVeg : !dish.isVeg);
      return matchesSearch && matchesDiet;
    });

    list = [...list].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "rating") return Number(b.rating) - Number(a.rating);
      return 0;
    });

    return list;
  }, [dishes, diet, searchQuery, sort]);

  const handleAddToCart = async (dish: CollectionDishItem) => {
    await updateQuantity(dish.id, 1, {
      restaurant_id: dish.restaurantId,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      isVeg: dish.isVeg,
    });
    showToast(`🛒 ${dish.name} added to cart!`, "success");
  };

  if (!collection || dishes.length === 0) {
    return <CollectionNotFound slug={slug} />;
  }

  return (
    <main className="relative min-h-screen bg-white pt-[90px] selection:bg-[#E23744]/20 selection:text-[#1A1A1A]">
      <Navbar />
      <FloatingCart />

      <div className="container mx-auto max-w-[1440px] px-4 py-8 md:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#666666] transition-colors hover:text-[#1A1A1A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="relative mb-10 overflow-hidden rounded-3xl border border-[#ECECEC] bg-[#1A1A1A]">
          <div className="absolute inset-0">
            <SafeImage
              src={collection.bannerImage}
              fallback={RESTAURANT_FALLBACK}
              alt={collection.title}
              fill
              sizes="100vw"
              className="object-cover opacity-50"
            />
          </div>
          <div className="relative z-10 bg-gradient-to-r from-black/85 via-black/50 to-transparent p-8 md:p-12">
            <span className="mb-3 inline-block text-2xl">{collection.emoji}</span>
            <h1 className="mb-3 text-3xl font-black text-white md:text-5xl">{collection.title}</h1>
            <p className="mb-4 max-w-2xl text-sm font-medium text-gray-200 md:text-lg">
              {collection.description}
            </p>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
              {collection.itemCount} · {dishes.length} dishes available
            </span>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative w-full lg:max-w-md">
            <span className="sr-only">Search dishes</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search dishes or restaurants..."
              className="h-11 w-full rounded-xl border border-[#ECECEC] bg-[#F8F8F8] pl-10 pr-4 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-gray-500 focus:border-[#E23744]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-[#ECECEC] bg-[#F8F8F8] p-1">
              {(["all", "veg", "nonveg"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDiet(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                    diet === value
                      ? "bg-[#E23744] text-white"
                      : "text-[#666666] hover:text-[#1A1A1A]"
                  }`}
                >
                  {value === "nonveg" ? "Non-Veg" : value}
                </button>
              ))}
            </div>

            <div className="relative">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8E8E8E]" />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                className="h-10 appearance-none rounded-xl border border-[#ECECEC] bg-[#F8F8F8] pl-9 pr-8 text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E23744]"
              >
                <option value="popular">Sort: Popular</option>
                <option value="rating">Sort: Rating</option>
                <option value="price-low">Sort: Price Low</option>
                <option value="price-high">Sort: Price High</option>
              </select>
            </div>
          </div>
        </div>

        {filteredDishes.length === 0 ? (
          <div className="rounded-2xl border border-[#ECECEC] bg-[#FFF5F6] px-6 py-16 text-center">
            <p className="text-lg font-black text-[#1A1A1A]">No dishes found</p>
            <p className="mt-2 text-sm text-[#666666]">Try adjusting search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {filteredDishes.map((dish) => (
              <CollectionFoodCard
                key={dish.id}
                dish={dish}
                quantity={quantities.get(dish.id) || 0}
                isFavorite={itemIds.has(dish.id)}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={updateQuantity}
                onToggleFavorite={toggleItem}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
