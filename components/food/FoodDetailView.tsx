"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ChevronLeft, Clock, Heart, Minus, Plus, Share2, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SafeImage from "@/components/ui/SafeImage";
import { FOOD_FALLBACK, getFoodImage } from "@/lib/images";
import { useCartActions } from "@/hooks/useCartActions";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";
import { useToast } from "@/contexts/ToastContext";
import CatalogViewTracker from "@/components/analytics/CatalogViewTracker";
import {
  getCategoryDishById,
  getCategoryDishes,
  isCategoryDishId,
} from "@/lib/data/categoryData";
import {
  getCollectionDishById,
  getCollectionDishes,
  getCollectionFeaturedDish,
  isCollectionDishId,
} from "@/lib/data/collectionsData";

type FoodDetails = {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  gallery_urls?: string[];
  price: string | number;
  discount_price?: string | number | null;
  rating?: string | number;
  is_vegetarian?: boolean;
  preparation_time?: number;
  ingredients?: string[];
  restaurant_id: string;
  restaurant_name: string;
  cuisines?: { name: string; slug: string }[];
  reviews?: {
    id: string;
    rating: number;
    comment?: string;
    full_name: string;
    profile_image_url?: string;
    created_at: string;
  }[];
  related_items?: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    price: string | number;
    discount_price?: string | number | null;
    rating?: string | number;
    restaurant_name: string;
  }[];
};

function categoryDishToFoodDetails(id: string): FoodDetails | undefined {
  const dish = getCategoryDishById(id);
  if (!dish) return undefined;

  const related = getCategoryDishes(dish.category)
    .filter((item) => item.id !== dish.id)
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      image_url: item.image,
      price: item.originalPrice,
      discount_price: item.price,
      rating: item.rating,
      restaurant_name: item.restaurantName,
    }));

  return {
    id: dish.id,
    name: dish.name,
    description: dish.description,
    image_url: dish.image,
    price: dish.originalPrice,
    discount_price: dish.price,
    rating: dish.rating,
    is_vegetarian: dish.isVeg,
    preparation_time: Number.parseInt(dish.deliveryTime, 10) || 25,
    restaurant_id: dish.restaurantId,
    restaurant_name: dish.restaurantName,
    cuisines: [{ name: dish.category, slug: dish.category }],
    related_items: related,
  };
}

function collectionDishToFoodDetails(id: string): FoodDetails | undefined {
  const dish = getCollectionDishById(id);
  if (!dish) return undefined;

  const featured = getCollectionFeaturedDish(id);
  const displayName = featured?.name ?? dish.name;
  const displayImage = featured?.image ?? dish.image;
  const displayDescription = featured?.description ?? dish.description;

  const related = getCollectionDishes(dish.collection)
    .filter((item) => item.id !== dish.id)
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      name: item.restaurantName,
      description: item.description,
      image_url: item.image,
      price: item.originalPrice,
      discount_price: item.price,
      rating: item.rating,
      restaurant_name: item.restaurantName,
    }));

  return {
    id: dish.id,
    name: displayName,
    description: displayDescription,
    image_url: displayImage,
    price: dish.originalPrice,
    discount_price: dish.price,
    rating: dish.rating,
    is_vegetarian: dish.isVeg,
    preparation_time: Number.parseInt(dish.deliveryTime, 10) || 25,
    restaurant_id: dish.restaurantId,
    restaurant_name: dish.restaurantName,
    cuisines: [{ name: dish.collection, slug: dish.collection }],
    related_items: related,
  };
}

function staticDishToFoodDetails(id: string): FoodDetails | undefined {
  return categoryDishToFoodDetails(id) ?? collectionDishToFoodDetails(id);
}

function isStaticCatalogDishId(id: string): boolean {
  return isCategoryDishId(id) || isCollectionDishId(id);
}

function getStaticCatalogDish(id: string) {
  return getCategoryDishById(id) ?? getCollectionDishById(id);
}

export default function FoodDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const isStaticDish = isStaticCatalogDishId(id);
  const { data: rawFood, isLoading, error } = useSWR<any>(
    id && !isStaticDish ? `/api/menu-items/${id}` : null
  );
  const apiFood: FoodDetails | undefined = (rawFood as any)?.data || rawFood;
  const food = useMemo(() => {
    if (isStaticDish) return staticDishToFoodDetails(id);
    return apiFood;
  }, [apiFood, id, isStaticDish]);
  const { quantities, updatingId, updateQuantity, addAndCheckout } = useCartActions();
  const { itemIds, toggleItem } = useFavoriteActions();

  if (!isStaticDish && isLoading) {
    return (
      <main className="min-h-screen bg-white pt-[90px]">
        <Navbar />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-2">
          <div className="aspect-[4/3] animate-pulse rounded-3xl bg-[#F8FAFC]" />
          <div className="h-[520px] animate-pulse rounded-3xl bg-[#F8FAFC]" />
        </div>
      </main>
    );
  }

  if ((!isStaticDish && error) || !food) {
    return (
      <main className="min-h-screen bg-white pt-[90px]">
        <Navbar />
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="mb-3 text-3xl font-black text-[#111827]">Dish not found</h1>
          <p className="mb-8 text-[#6B7280]">This dish is unavailable or has been removed.</p>
          <Link href="/" className="rounded-xl bg-primary px-6 py-3 font-bold text-white">
            Browse categories
          </Link>
        </div>
      </main>
    );
  }

  const staticDish = getStaticCatalogDish(id);
  const backHref = staticDish
    ? "collection" in staticDish
      ? `/collections/${staticDish.collection}`
      : `/category/${staticDish.category}`
    : "/trending-dishes";
  const heroImage = getFoodImage(food.image_url);
  const gallery = isStaticDish
    ? [heroImage]
    : (food.gallery_urls?.filter(Boolean).length
        ? food.gallery_urls.filter(Boolean)
        : [food.image_url || FOOD_FALLBACK]
      ).map((url) => getFoodImage(url));
  const quantity = quantities.get(food.id) || 0;
  const price = Number(food.discount_price || food.price);
  const originalPrice = Number(food.price);
  const isFavorite = itemIds.has(food.id);

  const handleAddToCart = () => {
    const catalogDish = getStaticCatalogDish(food.id);
    if (catalogDish) {
      updateQuantity(food.id, 1, {
        restaurant_id: catalogDish.restaurantId,
        name: catalogDish.name,
        price: catalogDish.price,
        image: catalogDish.image,
        isVeg: catalogDish.isVeg,
      });
      showToast(`🛒 ${catalogDish.name} added to cart!`, "success");
      return;
    }
    updateQuantity(food.id, 1);
  };

  const shareFood = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: food.name, text: food.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Dish link copied", "success");
      }
    } catch {
      // The native share dialog may be cancelled without requiring an error toast.
    }
  };

  return (
    <main className="min-h-screen bg-white pt-[90px] text-[#111827]">
      <CatalogViewTracker
        type="menu_item"
        ready
        id={food.id}
        name={food.name}
        restaurantId={food.restaurant_id}
        price={price}
      />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-2 text-[#6B7280] hover:text-[#111827]"
        >
          <ChevronLeft className="h-4 w-4" /> {isStaticDish ? "Back to collection" : "Back to dishes"}
        </Link>

        <section className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-[#E5E7EB]">
              <SafeImage
                src={heroImage || FOOD_FALLBACK}
                fallback={FOOD_FALLBACK}
                alt={food.name}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            {!isStaticDish && gallery.length > 1 ? (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {gallery.slice(0, 3).map((image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#E5E7EB]"
                  >
                    <SafeImage
                      src={image || FOOD_FALLBACK}
                      fallback={FOOD_FALLBACK}
                      alt={`${food.name} gallery image ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 md:p-9">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className={`mb-3 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-bold ${
                  food.is_vegetarian ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${food.is_vegetarian ? "bg-green-400" : "bg-red-400"}`} />
                  {food.is_vegetarian ? "VEGETARIAN" : "NON-VEGETARIAN"}
                </div>
                <h1 className="text-3xl font-black md:text-5xl">{food.name}</h1>
                <Link href={`/restaurant/${food.restaurant_id}`} className="mt-2 block text-[#6B7280] hover:text-primary">
                  {food.restaurant_name}
                </Link>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleItem(food.id)}
                  className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] p-3 hover:bg-[#F8FAFC]"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                </button>
                <button onClick={shareFood} className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] p-3 hover:bg-[#F8FAFC]" aria-label="Share dish">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {Number(food.rating || 4.5).toFixed(1)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8FAFC] px-3 py-2 text-[#6B7280]">
                <Clock className="h-4 w-4 text-primary" /> {food.preparation_time || 20} min
              </span>
              {food.cuisines?.map((cuisine) => {
                const collectionDish = getCollectionDishById(food.id);
                const href = collectionDish
                  ? `/collections/${cuisine.slug}`
                  : isCategoryDishId(food.id)
                    ? `/category/${cuisine.slug}`
                    : `/cuisine/${cuisine.slug}`;
                return (
                  <Link
                    key={cuisine.slug}
                    href={href}
                    className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-[#6B7280] hover:text-[#111827]"
                  >
                    {cuisine.name}
                  </Link>
                );
              })}
            </div>

            <p className="mb-7 leading-7 text-[#6B7280]">{food.description}</p>

            <div className="mb-8">
              <h2 className="mb-3 text-lg font-bold">Ingredients</h2>
              <div className="flex flex-wrap gap-2">
                {(food.ingredients?.length ? food.ingredients : ["Chef-selected fresh ingredients"]).map((ingredient) => (
                  <span key={ingredient} className="rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-sm text-[#6B7280]">
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6 flex items-baseline gap-3">
              <span className="text-3xl font-black text-primary">₹{price}</span>
              {price < originalPrice && <span className="text-lg text-[#9CA3AF] line-through">₹{originalPrice}</span>}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {quantity > 0 ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-2 sm:w-40">
                  <button onClick={() => updateQuantity(food.id, -1)} disabled={updatingId === food.id} className="p-3" aria-label="Decrease quantity">
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="font-black">{quantity}</span>
                  <button onClick={() => updateQuantity(food.id, 1)} disabled={updatingId === food.id} className="p-3" aria-label="Increase quantity">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={updatingId === food.id}
                  className="rounded-xl border border-primary bg-primary/10 px-6 py-3 font-bold text-primary hover:bg-primary hover:text-[#111827]"
                >
                  Add to Cart
                </button>
              )}
              <button
                onClick={() => {
                  const catalogDish = getStaticCatalogDish(food.id);
                  addAndCheckout(
                    food.id,
                    router,
                    catalogDish
                      ? {
                          restaurant_id: catalogDish.restaurantId,
                          name: catalogDish.name,
                          price: catalogDish.price,
                          image: catalogDish.image,
                          isVeg: catalogDish.isVeg,
                        }
                      : undefined
                  );
                }}
                disabled={updatingId === food.id}
                className="flex-1 rounded-xl bg-primary px-8 py-3 font-black hover:bg-primary/90"
              >
                Buy Now
              </button>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-black">Customer Reviews</h2>
          {food.reviews?.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {food.reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold">{review.full_name}</span>
                    <span className="flex items-center gap-1 text-yellow-400"><Star className="h-4 w-4 fill-current" />{review.rating}</span>
                  </div>
                  <p className="text-sm leading-6 text-[#6B7280]">{review.comment || "Enjoyed this order."}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-[#6B7280]">
              No reviews yet. Order this dish and be the first to review it.
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-black">Related Foods</h2>
          {food.related_items?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {food.related_items.map((item) => (
                <Link key={item.id} href={`/food/${item.id}`} className="group overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
                  <div className="relative h-44 overflow-hidden">
                    <SafeImage
                      src={getFoodImage(item.image_url)}
                      fallback={FOOD_FALLBACK}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold group-hover:text-primary">{item.name}</h3>
                    <p className="mt-1 text-sm text-[#9CA3AF]">{item.restaurant_name}</p>
                    <p className="mt-3 font-black">₹{Number(item.discount_price || item.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-[#6B7280]">
              No related dishes available right now.
            </div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  );
}
