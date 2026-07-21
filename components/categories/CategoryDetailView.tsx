"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import SafeImage from "@/components/ui/SafeImage";
import CategoryFoodCard from "@/components/categories/CategoryFoodCard";
import CategoryNotFound from "@/components/categories/CategoryNotFound";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";
import { useToast } from "@/contexts/ToastContext";
import {
  getCategoryBySlug,
  getCategoryDishes,
  type CategoryDishItem,
} from "@/lib/data/categoryData";

type Props = {
  slug: string;
};

export default function CategoryDetailView({ slug }: Props) {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const { quantities, updateQuantity } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  const category = getCategoryBySlug(slug);
  const dishes = getCategoryDishes(slug);

  const filteredDishes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return dishes;
    return dishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(query) ||
        dish.restaurantName.toLowerCase().includes(query)
    );
  }, [dishes, searchQuery]);

  const handleAddToCart = async (dish: CategoryDishItem) => {
    await updateQuantity(dish.id, 1, {
      restaurant_id: dish.restaurantId,
      name: dish.name,
      price: dish.price,
      image: dish.image,
      isVeg: dish.isVeg,
    });
    showToast(`🛒 ${dish.name} added to cart!`, "success");
  };

  if (!category || dishes.length === 0) {
    return <CategoryNotFound slug={slug} />;
  }

  return (
    <main className="relative min-h-screen bg-white pt-[90px] selection:bg-primary/20 selection:text-foreground">
      <Navbar />
      <FloatingCart />

      <div className="container mx-auto max-w-[1440px] px-4 py-8 md:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-text transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="relative mb-10 overflow-hidden rounded-3xl border border-border bg-[#1A1A1A]">
          <div className="absolute inset-0">
            <SafeImage
              src={category.image}
              fallback={RESTAURANT_FALLBACK}
              alt={category.name}
              className="h-full w-full object-cover opacity-50"
            />
          </div>
          <div className="relative z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent p-8 md:p-12">
            <h1 className="mb-3 text-3xl font-black text-white md:text-5xl">{category.name}</h1>
            <p className="mb-4 max-w-2xl text-sm font-medium text-gray-200 md:text-lg">
              {category.description}
            </p>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-md">
              {dishes.length} delicious {category.name.toLowerCase()} options
            </span>
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
          <label className="relative w-full md:w-80">
            <span className="sr-only">Search dishes</span>
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E8E8E]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${category.name.toLowerCase()}...`}
              className="h-11 w-full rounded-xl border border-border bg-footer pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-gray-500 focus:border-primary"
            />
          </label>
        </div>

        {filteredDishes.length === 0 ? (
          <div className="rounded-2xl border border-border bg-primary-soft px-6 py-16 text-center">
            <p className="text-lg font-black text-foreground">No dishes found</p>
            <p className="mt-2 text-sm text-gray-text">Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {filteredDishes.map((dish) => (
              <CategoryFoodCard
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
