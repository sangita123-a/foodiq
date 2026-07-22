"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Eye, Flame, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import useSWR from "swr";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getUniqueTrendingImage, getRestaurantCoverImage } from "@/lib/images";
import {
  Dish60,
  POPULAR_RESTAURANTS_30,
  TRENDING_DISHES_60,
} from "@/lib/data/30restaurantsData";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

const CARD_HEIGHT = 240;
const IMAGE_HEIGHT = 110;
const SECTION_ID = "trending-dishes-section";

const GRID_CLASS =
  "flex gap-3 overflow-x-auto scroll-row pb-2 -mx-1 px-1 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0 lg:grid-cols-6 xl:grid-cols-7 md:gap-[14px] md:justify-items-center";

function getGridColumns(width: number): number {
  if (width >= 1280) return 7;
  if (width >= 1024) return 6;
  if (width >= 768) return 4;
  return 2;
}

function useTrendingGridColumns(): number {
  const [columns, setColumns] = useState(2);

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
  const cardClassName =
    "group flex shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] w-[150px] md:w-[170px]";
  const cardStyle = { height: CARD_HEIGHT };

  const cardBody = (
    <>
      <div
        className="relative w-full shrink-0 overflow-hidden rounded-t-2xl bg-footer"
        style={{ height: IMAGE_HEIGHT }}
      >
        <Link href={`/food/${dish.id}`} className="relative block h-full w-full">
          <SafeImage
            src={dish.image}
            fallback={FOOD_FALLBACK}
            alt={dish.name}
            fill
            sizes="(max-width: 767px) 150px, 170px"
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
          className="touch-target-expand absolute right-0 top-0 z-10 text-gray-text transition-colors hover:text-primary"
          aria-label={isFavorite ? `Remove ${dish.name} from favorites` : `Add ${dish.name} to favorites`}
          aria-pressed={isFavorite}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 shadow-sm">
            <Heart
              className="h-3 w-3"
              fill={isFavorite ? "var(--color-primary)" : "none"}
              stroke={isFavorite ? "var(--color-primary)" : "currentColor"}
            />
          </span>
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-[10px]">
        <Link
          href={`/food/${dish.id}`}
          className="line-clamp-1 text-[13px] font-extrabold leading-tight text-foreground transition-colors hover:text-foreground"
        >
          {dish.name}
        </Link>

        <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-gray-text">
          <Star className="h-3 w-3 food-rating-star" fill="#F4B400" stroke="#F4B400" aria-hidden />
          <span className="text-foreground">{dish.rating}</span>
          <span className="text-[#CCCCCC]">·</span>
          <Clock className="h-2.5 w-2.5" />
          <span>{deliveryTime}</span>
        </div>

        <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-[#757575]">
          {dish.restaurantName}
        </p>

          <div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
          <div className="min-w-0">
            <span className="text-xs md:text-sm font-black text-[var(--color-price)]">₹{dish.price}</span>
            {dish.originalPrice && dish.originalPrice > dish.price && (
              <span className="ml-0.5 text-[9px] text-[var(--color-price-old)] line-through">
                ₹{dish.originalPrice}
              </span>
            )}
          </div>

          {qty === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(dish)}
              disabled={isUpdating}
              aria-label={`Add ${dish.name} to cart`}
              className="food-button-add touch-target-expand inline-flex h-[34px] w-full md:w-auto shrink-0 items-center justify-center gap-0.5 px-2.5 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex h-[34px] shrink-0 items-center gap-0.5 rounded-lg border border-border bg-white px-1">
              <button
                type="button"
                onClick={() => onUpdateQty(dish.id, -1)}
                disabled={isUpdating}
                aria-label={`Decrease quantity of ${dish.name}`}
                className="touch-target-expand flex h-6 w-6 items-center justify-center rounded-md border border-border text-gray-text transition-colors hover:bg-section disabled:opacity-50"
              >
                <Minus className="h-3 w-3" aria-hidden="true" />
              </button>
              <span className="min-w-[12px] text-center text-[10px] font-black text-foreground" aria-live="polite">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQty(dish.id, 1)}
                disabled={isUpdating}
                aria-label={`Increase quantity of ${dish.name}`}
                className="touch-target-expand flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-primary)] text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] disabled:opacity-50"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <Link
          href={`/food/${dish.id}`}
          className="mt-1 inline-flex items-center justify-center gap-0.5 text-[9px] font-bold text-gray-text transition-colors hover:text-foreground"
        >
          <Eye className="h-2.5 w-2.5" aria-hidden="true" />
          <span>View Details</span>
        </Link>
      </div>
    </>
  );

  if (!animateIn) {
    return (
      <article className={cardClassName} style={cardStyle}>
        {cardBody}
      </article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, delay: revealDelay, ease: "easeOut" }}
      className={cardClassName}
      style={cardStyle}
    >
      {cardBody}
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
          image: getUniqueTrendingImage(
            (d.name as string) || fallbackObj.name,
            (d.category_name as string) || fallbackObj.category,
            (d.image_url || d.image) as string,
            fallbackObj.image,
            String(d.id || fallbackObj.id)
          ),
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
      <div className="container mx-auto max-w-7xl px-3 md:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-section px-3 py-1 text-xs font-bold uppercase tracking-wider text-gray-text">
              <Flame className="h-4 w-4 text-[var(--color-primary)]" fill="var(--color-primary)" stroke="var(--color-primary)" aria-hidden />
              <span>60 Trending Delicacies</span>
            </div>
            <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
              Trending Dishes Right Now
            </h2>
            <p className="text-base text-gray-text md:text-lg">
              Most ordered dishes across Foodiq with instant delivery.
            </p>
          </div>

          <Link
            href="/trending-dishes"
            className="food-button food-button-primary inline-flex items-center gap-2 px-5 py-2 text-sm"
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
                aria-pressed={isActive}
                className={`filter-tab md:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                  isActive ? "filter-tab-active" : ""
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className={GRID_CLASS}>
          <AnimatePresence mode="sync">
            {isLoading && visibleDishes.length === 0
              ? Array.from({ length: initialVisible }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl bg-footer w-[150px] md:w-[170px]"
                    style={{ height: CARD_HEIGHT }}
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

        {hasMore && visibleDishes.length > 0 && (
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
              className="food-button food-button-primary mt-10 px-8 py-2.5 text-sm"
            >
              {showAll ? "View Less" : "View More"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
