"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import {
  Clock,
  Heart,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import FilterSidebar from "@/components/FilterSidebar";
import RestaurantCard from "@/components/RestaurantCard";
import CompactSearchBar from "@/components/CompactSearchBar";
import SafeImage from "@/components/ui/SafeImage";
import { fetchRestaurantsPage } from "@/lib/restaurants";
import { getFoodImage, mapRestaurantCard, FOOD_FALLBACK } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";
import { useToast } from "@/contexts/ToastContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { POPULAR_RESTAURANTS_30, TRENDING_DISHES_60 } from "@/lib/data/30restaurantsData";

const PAGE_SIZE = 9;

type ViewTab = "restaurants" | "menu";

function parseDeliveryMinutes(time: string): number {
  const match = time.match(/(\d+)\s*-\s*(\d+)/);
  if (match) return Number(match[2]);
  const single = time.match(/(\d+)/);
  return single ? Number(single[1]) : 30;
}

export default function OrderOnlineView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const foodQuery = searchParams.get("food") || "";
  const view = (searchParams.get("view") as ViewTab) || "restaurants";
  const categoryFilter = searchParams.get("category") || "";

  const { showToast } = useToast();
  const { settings } = useSiteSettings();
  const { quantities, updatingId, updateQuantity, totalQuantity, subtotal } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [menuSearch, setMenuSearch] = useState(foodQuery);
  const [menuSort, setMenuSort] = useState<"rating" | "price_low" | "price_high" | "delivery">("rating");
  const [menuCategory, setMenuCategory] = useState(categoryFilter);

  const { data: searchData, isLoading: menuLoading } = useSWR(
    view === "menu" && menuSearch.trim().length >= 2
      ? `/api/search?q=${encodeURIComponent(menuSearch.trim())}`
      : null
  );

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      try {
        const { restaurants: items, pagination } = await fetchRestaurantsPage(
          pageNum,
          PAGE_SIZE,
          queryString
        );
        setRestaurants((prev) => (append ? [...prev, ...items] : items));
        setPage(pagination.page);
        setTotalPages(pagination.totalPages);
      } catch {
        if (!append) {
          setRestaurants(
            POPULAR_RESTAURANTS_30.map((r) =>
              mapRestaurantCard({
                id: r.id,
                name: r.name,
                image_url: r.image,
                rating: r.rating,
                estimated_delivery_time: parseDeliveryMinutes(r.time),
                description: r.cuisine,
                category_name: r.category,
              })
            )
          );
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [queryString]
  );

  useEffect(() => {
    setPage(1);
    loadPage(1, false);
  }, [loadPage]);

  const setView = (next: ViewTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", next);
    router.push(`/order-online?${params.toString()}`, { scroll: false });
  };

  const searchResults = useMemo(() => {
    const raw = Array.isArray(searchData)
      ? searchData
      : Array.isArray(searchData?.data)
        ? searchData.data
        : [];
    let items = raw.filter((r: any) => r.type === "menu_item");

    if (items.length === 0 && menuSearch.trim()) {
      const q = menuSearch.toLowerCase();
      items = TRENDING_DISHES_60.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.restaurantName.toLowerCase().includes(q)
      ).map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        image_url: d.image,
        price: d.price,
        rating: d.rating,
        is_vegetarian: d.isVeg,
        restaurant_id: d.restaurantId,
        restaurant_name: d.restaurantName,
        type: "menu_item",
      }));
    }

    if (menuCategory) {
      items = items.filter((item: any) =>
        String(item.category_name || item.category || item.description || "")
          .toLowerCase()
          .includes(menuCategory.toLowerCase())
      );
    }

    items = [...items].sort((a: any, b: any) => {
      if (menuSort === "price_low") return Number(a.price) - Number(b.price);
      if (menuSort === "price_high") return Number(b.price) - Number(a.price);
      if (menuSort === "delivery") {
        const restA = POPULAR_RESTAURANTS_30.find((r) => r.id === a.restaurant_id);
        const restB = POPULAR_RESTAURANTS_30.find((r) => r.id === b.restaurant_id);
        return parseDeliveryMinutes(restA?.time || "30") - parseDeliveryMinutes(restB?.time || "30");
      }
      return Number(b.rating || 0) - Number(a.rating || 0);
    });

    return items;
  }, [searchData, menuSearch, menuCategory, menuSort]);

  const estimatedDelivery = useMemo(() => {
    if (restaurants.length === 0) return "25–35 min";
    const mins = restaurants.slice(0, 5).map((r) => parseDeliveryMinutes(r.time || "30 min"));
    const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
    return `${Math.max(15, avg - 5)}–${avg + 10} min`;
  }, [restaurants]);

  const handleMenuSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (menuSearch.trim()) params.set("food", menuSearch.trim());
    else params.delete("food");
    params.set("view", "menu");
    router.push(`/order-online?${params.toString()}`, { scroll: false });
  };

  const handleAddToCart = async (item: any) => {
    await updateQuantity(String(item.id), 1, {
      restaurant_id: item.restaurant_id,
      name: item.name,
      price: Number(item.price),
      image: item.image_url || item.image,
      isVeg: item.is_vegetarian ?? item.isVeg,
    });
    showToast(`Added ${item.name} to cart`, "success");
  };

  const deliveryFee =
    subtotal >= Number(settings.free_delivery_min || 499) ? 0 : Number(settings.delivery_charge || 35);
  const taxAmount = Math.round(subtotal * (Number(settings.tax_percent || 5) / 100));
  const cartTotal = subtotal + deliveryFee + taxAmount;

  return (
    <main className="relative min-h-screen bg-white pt-[90px] selection:bg-[#E23744]/20">
      <Navbar />
      <FloatingCart />

      <div className="border-b border-[#ECECEC] bg-[#F8F9FA] py-8">
        <div className="container mx-auto max-w-[1600px] px-4 md:px-8">
          <CompactSearchBar />
        </div>
      </div>

      <div className="container mx-auto max-w-[1600px] px-4 py-10 md:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1C1C1C] md:text-4xl">
              Order Online
            </h1>
            <p className="mt-1 text-sm font-medium text-[#555555] md:text-base">
              Browse restaurants, explore menus, and get food delivered fast.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-[#ECECEC] bg-white px-4 py-2 text-xs font-bold text-[#555555] shadow-sm">
              <Clock className="mr-1 inline h-3.5 w-3.5 text-[#E23744]" />
              Est. delivery: {estimatedDelivery}
            </div>
            {totalQuantity > 0 && (
              <Link
                href="/checkout"
                className="rounded-xl bg-[#E23744] px-5 py-2.5 text-xs font-black text-white shadow-[0_6px_16px_rgba(226,55,68,0.25)] transition hover:bg-[#C81E34]"
              >
                Cart ₹{cartTotal} · Checkout →
              </Link>
            )}
          </div>
        </div>

        <div className="mb-8 flex gap-2">
          <button
            type="button"
            onClick={() => setView("restaurants")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              view === "restaurants"
                ? "bg-[#E23744] text-white shadow-md"
                : "border border-[#ECECEC] bg-white text-[#555555] hover:text-[#222222]"
            }`}
          >
            <Store className="h-4 w-4" /> Restaurants
          </button>
          <button
            type="button"
            onClick={() => setView("menu")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition ${
              view === "menu"
                ? "bg-[#E23744] text-white shadow-md"
                : "border border-[#ECECEC] bg-white text-[#555555] hover:text-[#222222]"
            }`}
          >
            <UtensilsCrossed className="h-4 w-4" /> Browse Menu
          </button>
        </div>

        {view === "restaurants" ? (
          <div className="flex flex-col gap-6 lg:flex-row">
            <FilterSidebar />
            <div className="flex-1">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[#222222]">All Restaurants</h2>
                <span className="text-sm text-[#555555]">
                  {isLoading ? "Loading…" : `${restaurants.length} places`}
                </span>
              </div>

              {isLoading ? (
                <div className="food-grid">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-[300px] animate-pulse rounded-2xl border border-[#ECECEC] bg-[#F8F9FA]"
                    />
                  ))}
                </div>
              ) : restaurants.length === 0 ? (
                <div className="rounded-2xl border border-[#ECECEC] bg-white py-20 text-center shadow-sm">
                  <p className="text-lg font-bold text-[#222222]">No restaurants found</p>
                  <p className="mt-2 text-sm text-[#555555]">Try adjusting filters or search.</p>
                </div>
              ) : (
                <>
                  <div className="food-grid">
                    {restaurants.map((restaurant: any, idx: number) => (
                      <RestaurantCard key={`${restaurant.id}-${idx}`} {...restaurant} delay={Math.min(idx * 0.08, 0.4)} />
                    ))}
                  </div>
                  {page < totalPages && (
                    <div className="mt-10 flex justify-center">
                      <button
                        type="button"
                        onClick={() => loadPage(page + 1, true)}
                        disabled={isLoadingMore}
                        className="rounded-xl bg-[#E23744] px-7 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isLoadingMore ? "Loading…" : "View More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-[#ECECEC] bg-[#F8F9FA] p-4 lg:flex-row lg:items-center">
              <form onSubmit={handleMenuSearch} className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search food, dishes, restaurants…"
                  className="h-11 w-full rounded-xl border border-[#ECECEC] bg-white pl-10 pr-4 text-sm text-[#222222] outline-none focus:border-[#E23744]"
                />
              </form>
              <div className="flex flex-wrap gap-2">
                {["", "pizza", "biryani", "burger", "desserts", "chinese"].map((cat) => (
                  <button
                    key={cat || "all"}
                    type="button"
                    onClick={() => setMenuCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${
                      menuCategory === cat
                        ? "bg-[#E23744] text-white"
                        : "border border-[#ECECEC] bg-white text-[#555555]"
                    }`}
                  >
                    {cat || "All"}
                  </button>
                ))}
              </div>
              <div className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#888888]" />
                <select
                  value={menuSort}
                  onChange={(e) => setMenuSort(e.target.value as typeof menuSort)}
                  className="h-10 appearance-none rounded-xl border border-[#ECECEC] bg-white pl-9 pr-8 text-xs font-bold text-[#222222]"
                >
                  <option value="rating">Sort: Rating</option>
                  <option value="price_low">Sort: Price Low</option>
                  <option value="price_high">Sort: Price High</option>
                  <option value="delivery">Sort: Delivery Time</option>
                </select>
              </div>
            </div>

            {menuLoading ? (
              <p className="text-sm text-[#555555]">Searching menu…</p>
            ) : searchResults.length === 0 ? (
              <div className="rounded-2xl border border-[#ECECEC] bg-white py-16 text-center">
                <p className="font-bold text-[#222222]">No dishes found</p>
                <p className="mt-1 text-sm text-[#555555]">Try a different search term or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((item: any) => {
                  const qty = quantities.get(String(item.id)) || 0;
                  const fav = itemIds.has(String(item.id));
                  return (
                    <div
                      key={String(item.id)}
                      className="group overflow-hidden rounded-[20px] border border-[#ECECEC] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(226,55,68,0.15)]"
                    >
                      <div className="relative h-40 overflow-hidden bg-[#F8F8F8]">
                        <SafeImage
                          src={getFoodImage(item.image_url || item.image)}
                          fallback={FOOD_FALLBACK}
                          alt={item.name}
                          fill
                          sizes="320px"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => toggleItem(String(item.id))}
                          className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 shadow"
                          aria-label="Favourite"
                        >
                          <Heart
                            className={`h-4 w-4 ${fav ? "fill-[#E23744] text-[#E23744]" : "text-gray-600"}`}
                          />
                        </button>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-[#16A34A] px-2 py-0.5 text-[11px] font-black text-white">
                          {item.rating || "4.5"} <Star className="h-3 w-3 fill-white" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-1 font-black text-[#222222] group-hover:text-[#E23744]">
                          {item.name}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-xs text-[#555555]">
                          {item.restaurant_name || "Restaurant"}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-black text-[#E23744]">₹{item.price}</span>
                          <Link
                            href={`/food/${item.id}`}
                            className="text-xs font-bold text-[#555555] hover:text-[#E23744]"
                          >
                            View Details
                          </Link>
                        </div>
                        <div className="mt-3">
                          {qty > 0 ? (
                            <div className="flex items-center justify-between rounded-xl bg-[#E23744] p-1 text-white">
                              <button
                                type="button"
                                disabled={updatingId === String(item.id)}
                                onClick={() => updateQuantity(String(item.id), -1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/20"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-black">{qty}</span>
                              <button
                                type="button"
                                disabled={updatingId === String(item.id)}
                                onClick={() => handleAddToCart(item)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/20"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={updatingId === String(item.id)}
                              onClick={() => handleAddToCart(item)}
                              className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[#E23744] py-2.5 text-xs font-black text-white hover:bg-[#C81E34]"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
