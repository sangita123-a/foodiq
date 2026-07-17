"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import SafeImage from "@/components/ui/SafeImage";
import CuisineFoodCard, { CuisineFoodItem } from "@/components/cuisines/CuisineFoodCard";
import CuisineNotFound from "@/components/cuisines/CuisineNotFound";
import {
  Search,
  ArrowLeft,
  UtensilsCrossed,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Clock,
  Heart,
} from "lucide-react";
import { RESTAURANT_FALLBACK } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";

type Props = {
  slug: string;
};

export default function CuisineDetailView({ slug }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [diet, setDiet] = useState("all");
  const [rating, setRating] = useState("all");
  const [delivery, setDelivery] = useState("all");
  const [price, setPrice] = useState("all");
  const [sort, setSort] = useState("popular");
  const { quantities, updatingId, updateQuantity, addAndCheckout, cart } = useCartActions();
  const { itemIds, restaurantIds, toggleItem, toggleRestaurant } = useFavoriteActions();

  const { data: cuisine, isLoading: loadingCuisine, error: cuisineError } = useSWR(
    slug ? `/api/cuisines/${slug}` : null
  );
  const { data: items, isLoading: loadingItems } = useSWR(
    slug ? `/api/cuisines/${slug}/items` : null
  );

  const cartItems = cart?.items || [];
  const cuisineGallery = (items || []).slice(0, 6);

  const filteredItems = useMemo(() => {
    const list: CuisineFoodItem[] = items || [];
    const q = searchQuery.toLowerCase();
    const result = list.filter((item) => {
      const itemRating = Number(item.rating || 0);
      const deliveryMinutes = Number.parseInt(item.delivery_time || "30", 10);
      const itemPrice = item.discounted_price;
      return (
        (!q ||
          item.name.toLowerCase().includes(q) ||
          item.restaurant_name.toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q)) &&
        (diet === "all" || (diet === "veg" ? item.is_vegetarian : !item.is_vegetarian)) &&
        (rating === "all" || itemRating >= Number(rating)) &&
        (delivery === "all" || deliveryMinutes <= Number(delivery)) &&
        (price === "all" ||
          (price === "under-200"
            ? itemPrice < 200
            : price === "200-400"
              ? itemPrice >= 200 && itemPrice <= 400
              : itemPrice > 400))
      );
    });

    return result.sort((a, b) => {
      if (sort === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
      if (sort === "price-low") return a.discounted_price - b.discounted_price;
      if (sort === "price-high") return b.discounted_price - a.discounted_price;
      return 0;
    });
  }, [delivery, diet, items, price, rating, searchQuery, sort]);

  const restaurants = useMemo(() => {
    const restaurantMap = new Map<
      string,
      {
        id: string;
        name: string;
        image?: string;
        rating: number;
        deliveryTime: string;
        minPrice: number;
        dishCount: number;
      }
    >();

    (items || []).forEach((item: CuisineFoodItem) => {
      const existing = restaurantMap.get(item.restaurant_id);
      if (existing) {
        existing.dishCount += 1;
        existing.minPrice = Math.min(existing.minPrice, item.discounted_price);
        existing.rating = Math.max(existing.rating, Number(item.rating || 4.5));
        return;
      }
      restaurantMap.set(item.restaurant_id, {
        id: item.restaurant_id,
        name: item.restaurant_name,
        image: item.image_url,
        rating: Number(item.rating || 4.5),
        deliveryTime: item.delivery_time || "30 min",
        minPrice: item.discounted_price,
        dishCount: 1,
      });
    });

    const q = restaurantQuery.trim().toLowerCase();
    return Array.from(restaurantMap.values()).filter(
      (restaurant) => !q || restaurant.name.toLowerCase().includes(q)
    );
  }, [items, restaurantQuery]);

  if (loadingCuisine) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-[1600px]">
          <div className="h-64 bg-[#F8FAFC] animate-pulse rounded-3xl mb-8" />
          <div className="food-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-[#F8FAFC] animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (cuisineError || !cuisine) {
    return <CuisineNotFound slug={slug} />;
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <FloatingCart />

      <div className="container mx-auto px-4 md:px-8 py-8 max-w-[1600px]">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#6B7280] hover:text-[#111827] mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="relative rounded-3xl overflow-hidden mb-10 border border-[#E5E7EB]">
          <div className="absolute inset-0">
            <SafeImage
              src={cuisine.image_url}
              fallback={RESTAURANT_FALLBACK}
              alt={cuisine.name}
              className="w-full h-full object-cover opacity-40"
            />
          </div>
          <div className="relative z-10 bg-gradient-to-r from-[#111827]/75/80 via-[#111827]/30/60 to-transparent p-8 md:p-12">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3">{cuisine.name}</h1>
            <p className="text-[#6B7280] text-lg max-w-2xl mb-4">{cuisine.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-2 rounded-lg text-[#111827]">
                <UtensilsCrossed className="w-4 h-4 text-[var(--color-primary)]" />
                {cuisine.restaurant_count} Restaurants
              </span>
              <span className="inline-flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] px-4 py-2 rounded-lg text-[#111827]">
                {cuisine.item_count} Dishes
              </span>
            </div>
          </div>
        </div>

        {!loadingItems && (items || []).length > 0 && (
          <section className="mb-12" aria-labelledby="cuisine-restaurants-heading">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 id="cuisine-restaurants-heading" className="text-2xl font-black text-[#111827]">
                  Popular {cuisine.name} Restaurants
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Top nearby restaurants serving this cuisine.
                </p>
              </div>
              <label className="relative w-full md:w-80">
                <span className="sr-only">Search restaurants</span>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="search"
                  value={restaurantQuery}
                  onChange={(event) => setRestaurantQuery(event.target.value)}
                  placeholder="Search restaurants..."
                  className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-gray-600 focus:border-[var(--color-primary)]"
                />
              </label>
            </div>

            {restaurants.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-10 text-center text-sm text-[#6B7280]">
                No restaurants match &ldquo;{restaurantQuery}&rdquo;.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {restaurants.map((restaurant) => (
                <article
                  key={restaurant.id}
                  className="group relative flex min-w-0 gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-3 transition-[transform,border-color,background-color] duration-300 hover:-translate-y-1 hover:border-[#FC8019]/50 hover:bg-white/[0.06]"
                >
                  <Link
                    href={`/restaurant/${restaurant.id}`}
                    className="flex min-w-0 flex-1 gap-3"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F8FAFC]">
                      <SafeImage
                        src={restaurant.image}
                        fallback={RESTAURANT_FALLBACK}
                        alt={restaurant.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 py-1">
                      <h3 className="line-clamp-1 pr-7 text-sm font-bold text-[#111827]">
                        {restaurant.name}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 text-xs text-[#6B7280]">
                        <span className="inline-flex items-center gap-1 text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {restaurant.rating.toFixed(1)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {restaurant.deliveryTime}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[#9CA3AF]">
                        {restaurant.dishCount} dishes · From ₹{restaurant.minPrice}
                      </p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleRestaurant(restaurant.id)}
                    className="absolute right-3 top-3 rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-[#F8FAFC] hover:text-[#FC8019]"
                    aria-label={
                      restaurantIds.has(restaurant.id)
                        ? "Remove restaurant from favorites"
                        : "Add restaurant to favorites"
                    }
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        restaurantIds.has(restaurant.id)
                          ? "fill-[#FC8019] text-[#FC8019]"
                          : ""
                      }`}
                    />
                  </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {!loadingItems && cuisineGallery.length > 0 && (
          <section className="mb-10" aria-labelledby="cuisine-gallery-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="cuisine-gallery-heading" className="text-2xl font-black text-[#111827]">
                  {cuisine.name} Food Gallery
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  A different dish photo for every item in this cuisine.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {cuisineGallery.map((item: any) => (
                <Link
                  key={item.menu_item_id}
                  href={`/food/${item.menu_item_id}`}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-[#E5E7EB]"
                  aria-label={`View ${item.name}`}
                >
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#111827]/75 via-[#111827]/30/70 to-transparent p-3 pt-10">
                    <span className="line-clamp-1 text-xs font-bold text-[#111827]">{item.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8" aria-labelledby="popular-dishes-heading">
          <div className="mb-5">
            <h2 id="popular-dishes-heading" className="text-2xl font-black text-[#111827]">
              Popular {cuisine.name} Dishes
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Search and filter dishes from restaurants near you.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#121213] p-3 md:p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              <label className="relative sm:col-span-2 lg:col-span-2">
                <span className="sr-only">Search dishes or restaurants</span>
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="search"
                  placeholder={`Search dishes or restaurants...`}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-black/30 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[var(--color-primary)]"
                />
              </label>

              <select
                value={diet}
                onChange={(event) => setDiet(event.target.value)}
                aria-label="Diet preference"
                className="h-11 rounded-xl border border-[#E5E7EB] bg-black/30 px-3 text-sm text-[#6B7280] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">All food</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-vegetarian</option>
              </select>
              <select
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                aria-label="Minimum rating"
                className="h-11 rounded-xl border border-[#E5E7EB] bg-black/30 px-3 text-sm text-[#6B7280] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">Any rating</option>
                <option value="4">4.0+ rating</option>
                <option value="4.5">4.5+ rating</option>
              </select>
              <select
                value={delivery}
                onChange={(event) => setDelivery(event.target.value)}
                aria-label="Maximum delivery time"
                className="h-11 rounded-xl border border-[#E5E7EB] bg-black/30 px-3 text-sm text-[#6B7280] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">Any delivery</option>
                <option value="30">Under 30 min</option>
                <option value="45">Under 45 min</option>
              </select>
              <select
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                aria-label="Price range"
                className="h-11 rounded-xl border border-[#E5E7EB] bg-black/30 px-3 text-sm text-[#6B7280] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="all">Any price</option>
                <option value="under-200">Under ₹200</option>
                <option value="200-400">₹200–₹400</option>
                <option value="above-400">Above ₹400</option>
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                aria-label="Sort dishes"
                className="h-11 rounded-xl border border-[#E5E7EB] bg-black/30 px-3 text-sm text-[#6B7280] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="popular">Recommended</option>
                <option value="rating">Top rated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>
          </div>
        </section>

        {cartItems.length > 0 && (
          <div className="mb-8 flex justify-end">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 bg-[#FC8019] hover:bg-[#E76F0B] text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Proceed to Checkout
            </Link>
          </div>
        )}

        {loadingItems ? (
          <div className="food-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-[#F8FAFC] animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB]">
            <p className="text-[#6B7280]">
              No dishes match the selected search and filters.
            </p>
          </div>
        ) : (
          <div className="food-grid">
            {filteredItems.map((item: any) => (
              <CuisineFoodCard
                key={item.menu_item_id}
                item={item}
                quantity={quantities.get(item.menu_item_id) || 0}
                isUpdating={updatingId === item.menu_item_id}
                isFavorite={itemIds.has(item.menu_item_id)}
                onUpdateQuantity={updateQuantity}
                onToggleFavorite={toggleItem}
                onBuyNow={(menuItemId) => addAndCheckout(menuItemId, router)}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
