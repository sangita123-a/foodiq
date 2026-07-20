"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Eye, Flame, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import {
  Dish60,
  POPULAR_RESTAURANTS_30,
  TRENDING_DISHES_60,
} from "@/lib/data/30restaurantsData";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

const CARD_WIDTH = 170;
const CARD_HEIGHT = 240;
const IMAGE_HEIGHT = 110;
const SECTION_ID = "trending-dishes-section";

const GRID_CLASS =
  "grid grid-cols-2 justify-items-center gap-[14px] md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7";

function getGridColumns(width: number): number {
  if (width >= 1280) return 7;
  if (width >= 1024) return 6;
  if (width >= 768) return 4;
  return 2;
}

function useTrendingGridColumns(): number {
  const [columns, setColumns] = useState(() =>
    typeof window !== "undefined" ? getGridColumns(window.innerWidth) : 2
  );

  useEffect(() => {
    const update = () => setColumns(getGridColumns(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}

function getDeliveryTime(dish: Dish60): string {
  const restaurant = POPULAR_RESTAURANTS_30.find((r) => r.id === dish.restaurantId);
  return restaurant?.time || "25 min";
}

function scrollToTrendingSection() {
  const el = document.getElementById(SECTION_ID);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 88;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

type DishCardProps = {
  dish: Dish60;
  qty: number;
  isUpdating: boolean;
  isFavorite: boolean;
  deliveryTime: string;
  animateIn?: boolean;
  revealDelay?: number;
  onFavoriteToggle: (dish: Dish60) => void;
  onAdd: (dish: Dish60) => void;
  onUpdateQty: (dishId: string, delta: number) => void;
};

function DishCard({
  dish,
  qty,
  isUpdating,
  isFavorite,
  deliveryTime,
  animateIn = false,
  revealDelay = 0,
  onFavoriteToggle,
  onAdd,
  onUpdateQty,
}: DishCardProps) {
  return (
    <motion.article
      layout
      initial={animateIn ? { opacity: 0, y: -20 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={animateIn ? { opacity: 0, y: -20 } : undefined}
      transition={{ duration: 0.35, delay: revealDelay, ease: "easeOut" }}
      className="group flex shrink-0 flex-col overflow-hidden rounded-2xl border border-[#ECECEC] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(226,55,68,0.14)]"
      style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
    >
      <div
        className="relative w-full shrink-0 overflow-hidden rounded-t-2xl bg-[#F8F8F8]"
        style={{ height: IMAGE_HEIGHT }}
      >
        <Link href={`/food/${dish.id}`} className="relative block h-full w-full">
          <SafeImage
            src={dish.image}
            fallback={FOOD_FALLBACK}
            alt={dish.name}
            fill
            sizes="170px"
            className="block object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.05]"
          />
        </Link>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavoriteToggle(dish);
          }}
          className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#666666] shadow-sm transition-colors hover:text-[#E23744]"
          aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          aria-pressed={isFavorite}
        >
          <Heart className={`h-3 w-3 ${isFavorite ? "fill-[#E23744] text-[#E23744]" : ""}`} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-[10px]">
        <Link
          href={`/food/${dish.id}`}
          className="line-clamp-1 text-[13px] font-extrabold leading-tight text-[#1A1A1A] transition-colors hover:text-[#E23744]"
        >
          {dish.name}
        </Link>

        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#666666]">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-[#1A1A1A]">{dish.rating}</span>
          <span className="text-[#CCCCCC]">·</span>
          <Clock className="h-2.5 w-2.5" />
          <span>{deliveryTime}</span>
        </div>

        <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-[#888888]">
          {dish.restaurantName}
        </p>

        <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
          <div className="min-w-0">
            <span className="text-sm font-black text-[#E23744]">₹{dish.price}</span>
            {dish.originalPrice && dish.originalPrice > dish.price && (
              <span className="ml-0.5 text-[9px] text-[#AAAAAA] line-through">
                ₹{dish.originalPrice}
              </span>
            )}
          </div>

          {qty === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(dish)}
              disabled={isUpdating}
              className="inline-flex h-[34px] shrink-0 items-center justify-center gap-0.5 rounded-lg bg-[#E23744] px-2.5 text-[10px] font-extrabold text-white transition-all hover:bg-[#C81E34] disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex h-[34px] shrink-0 items-center gap-0.5 rounded-lg border border-[#E23744] bg-[#FFF5F6] px-1">
              <button
                type="button"
                onClick={() => onUpdateQty(dish.id, -1)}
                disabled={isUpdating}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[#E23744] transition-colors hover:bg-[#E23744] hover:text-white disabled:opacity-50"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[12px] text-center text-[10px] font-black text-[#E23744]">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(dish.id, 1)}
                disabled={isUpdating}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[#E23744] transition-colors hover:bg-[#E23744] hover:text-white disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <Link
          href={`/food/${dish.id}`}
          className="mt-1 inline-flex items-center justify-center gap-0.5 text-[9px] font-bold text-[#888888] transition-colors hover:text-[#E23744]"
        >
          <Eye className="h-2.5 w-2.5" />
          <span>View Details</span>
        </Link>
      </div>
    </motion.article>
  );
}

export default function TrendingDishes() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showAll, setShowAll] = useState(false);
  const gridColumns = useTrendingGridColumns();
  const initialVisible = gridColumns * 2;

  const { quantities, updatingId, updateQuantity } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  const { data: apiData, isLoading } = useSWR("/api/menu-items?limit=60");

  const dishes: Dish60[] = useMemo(() => {
    const rawList = Array.isArray(apiData)
      ? apiData
      : Array.isArray((apiData as { data?: unknown[] })?.data)
        ? (apiData as { data: unknown[] }).data
        : Array.isArray((apiData as { items?: unknown[] })?.items)
          ? (apiData as { items: unknown[] }).items
          : [];

    if (rawList.length >= 60) {
      return rawList.slice(0, 60).map((d: Record<string, unknown>, idx: number) => {
        const fallbackObj = TRENDING_DISHES_60[idx % TRENDING_DISHES_60.length];
        return {
          id: String(d.id || fallbackObj.id),
          name: (d.name as string) || fallbackObj.name,
          restaurantId: String(d.restaurant_id || fallbackObj.restaurantId),
          restaurantName: (d.restaurant_name as string) || fallbackObj.restaurantName,
          rating: String(d.rating || d.restaurant_rating || fallbackObj.rating),
          price: d.discount_price ? Number(d.discount_price) : Number(d.price || fallbackObj.price),
          originalPrice: d.price ? Number(d.price) : fallbackObj.originalPrice,
          image: getFoodImage((d.image_url || d.image) as string) || fallbackObj.image,
          description: (d.description as string) || fallbackObj.description,
          isVeg: Boolean(d.is_vegetarian ?? d.is_veg ?? fallbackObj.isVeg),
          isBestseller: Boolean(d.is_bestseller ?? fallbackObj.isBestseller),
          category: (d.category_name as string) || fallbackObj.category,
        };
      });
    }

    return TRENDING_DISHES_60;
  }, [apiData]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    TRENDING_DISHES_60.forEach((d) => set.add(d.category));
    return ["All", ...Array.from(set)];
  }, []);

  const filteredDishes = useMemo(() => {
    if (selectedCategory === "All") return dishes;
    return dishes.filter((d) => d.category.toLowerCase() === selectedCategory.toLowerCase());
  }, [dishes, selectedCategory]);

  const visibleDishes = showAll
    ? filteredDishes
    : filteredDishes.slice(0, initialVisible);
  const hasMore = filteredDishes.length > initialVisible;

  useEffect(() => {
    setShowAll(false);
  }, [selectedCategory]);

  const handleFavoriteToggle = useCallback(
    (dish: Dish60) => {
      void toggleItem(dish.id, {
        name: dish.name,
        restaurant: dish.restaurantName,
        image: dish.image,
        price: dish.price,
        rating: dish.rating,
        isVeg: dish.isVeg,
      });
    },
    [toggleItem]
  );

  const handleAdd = useCallback(
    (dish: Dish60) => {
      updateQuantity(dish.id, 1, {
        restaurant_id: dish.restaurantId,
        name: dish.name,
        price: dish.price,
        image: dish.image,
        isVeg: dish.isVeg,
      });
    },
    [updateQuantity]
  );

  const handleUpdateQty = useCallback(
    (dishId: string, delta: number) => {
      updateQuantity(dishId, delta);
    },
    [updateQuantity]
  );

  const renderDish = (dish: Dish60, animateIn = false, revealIndex = 0) => (
    <DishCard
      key={dish.id}
      dish={dish}
      qty={quantities.get(dish.id) || 0}
      isUpdating={updatingId === dish.id}
      isFavorite={itemIds.has(dish.id)}
      deliveryTime={getDeliveryTime(dish)}
      animateIn={animateIn}
      revealDelay={animateIn ? Math.min(revealIndex * 0.03, 0.3) : 0}
      onFavoriteToggle={handleFavoriteToggle}
      onAdd={handleAdd}
      onUpdateQty={handleUpdateQty}
    />
  );

  return (
    <section className="bg-white py-12" id={SECTION_ID}>
      <div className="container mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-600">
              <Flame className="h-4 w-4 fill-red-500 text-red-500" />
              <span>60 Trending Delicacies</span>
            </div>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
              Trending Dishes Right Now
            </h2>
            <p className="text-base text-[#64748B] md:text-lg">
              Most ordered dishes across Foodiq with instant delivery.
            </p>
          </div>

          <Link
            href="/trending-dishes"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#E23744]"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>View All 60 Dishes</span>
          </Link>
        </div>

        <div className="hide-scrollbar mb-8 flex items-center gap-2 overflow-x-auto pb-4 scroll-smooth">
          {categories.slice(0, 16).map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 md:text-sm ${
                  isActive
                    ? "scale-105 bg-[#0F172A] text-white shadow-md"
                    : "border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className={GRID_CLASS}>
          <AnimatePresence mode="popLayout">
            {isLoading && visibleDishes.length === 0
              ? Array.from({ length: initialVisible }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl bg-[#F8F8F8]"
                    style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                  />
                ))
              : visibleDishes.map((dish, index) =>
                  renderDish(
                    dish,
                    index >= initialVisible,
                    index >= initialVisible ? index - initialVisible : 0
                  )
                )}
          </AnimatePresence>
        </div>

        {hasMore && !isLoading && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => {
                if (showAll) {
                  scrollToTrendingSection();
                  setShowAll(false);
                } else {
                  setShowAll(true);
                }
              }}
              className="mt-10 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg"
            >
              {showAll ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
