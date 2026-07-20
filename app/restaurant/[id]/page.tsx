"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RestaurantReviews from "@/components/restaurant/RestaurantReviews";
import RestaurantHeader from "@/components/restaurant/RestaurantHeader";
import RestaurantGallery from "@/components/restaurant/RestaurantGallery";
import RestaurantMenuNav from "@/components/restaurant/RestaurantMenuNav";
import MenuItemCard, { MenuItem } from "@/components/restaurant/MenuItemCard";
import useSWR from "swr";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { getPriceForTwo, getRestaurantImage, resolveBackendUrl, RESTAURANT_FALLBACK } from "@/lib/images";
import LiveDealBanner from "@/components/restaurant/LiveDealBanner";
import { setActiveOffer } from "@/lib/offers";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";
import { shareContent } from "@/lib/share";
import CatalogViewTracker from "@/components/analytics/CatalogViewTracker";
import { isClientAuthenticated } from "@/lib/authSession";
import { POPULAR_RESTAURANTS_30 } from "@/lib/data/30restaurantsData";
import { getMenuForRestaurant } from "@/lib/data/restaurantMenusData";
import { useCartActions } from "@/hooks/useCartActions";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = (params?.id as string) || "";
  const id = rawId.trim();
  const dealCode = searchParams.get("deal");
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { restaurantIds, toggleRestaurant } = useFavoriteActions();
  const { quantities, updateQuantity, addAndCheckout } = useCartActions();

  useEffect(() => {
    setIsLoggedIn(isClientAuthenticated());
    const onAuth = () => setIsLoggedIn(isClientAuthenticated());
    window.addEventListener("foodiq:auth", onAuth);
    return () => window.removeEventListener("foodiq:auth", onAuth);
  }, []);

  const isValidId = Boolean(id.length > 0);

  // Fetch API data with fallback
  const { data: restaurantResponse, isLoading: isLoadingRest } = useSWR(
    isValidId ? `/api/restaurants/${id}` : null
  );
  const { data: menuResponse, isLoading: isLoadingMenu } = useSWR(
    isValidId ? `/api/restaurants/${id}/menu` : null
  );
  const { data: liveDeal } = useSWR(
    isValidId && dealCode ? `/api/live-deals/restaurant/${id}?coupon=${dealCode}` : null
  );

  // Fallback restaurant object lookup
  const fallbackRest = useMemo(() => {
    if (!id) return POPULAR_RESTAURANTS_30[0];
    const cleanId = id.toLowerCase();
    
    // Direct match by ID
    let found = POPULAR_RESTAURANTS_30.find((r) => r.id.toLowerCase() === cleanId);
    
    // Keyword match
    if (!found) {
      if (cleanId.includes("pizza") || cleanId === "2") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Pizza");
      else if (cleanId.includes("cold-drinks") || cleanId === "1") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Cold Drinks");
      else if (cleanId.includes("burger") || cleanId === "3") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Burger");
      else if (cleanId.includes("biryani") || cleanId === "4") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Biryani");
      else if (cleanId.includes("south-indian") || cleanId === "5") found = POPULAR_RESTAURANTS_30.find(r => r.category === "South Indian");
      else if (cleanId.includes("chinese") || cleanId === "6") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Chinese");
      else if (cleanId.includes("momos") || cleanId === "7") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Momos");
      else if (cleanId.includes("cakes") || cleanId === "11") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Cakes");
      else if (cleanId.includes("icecream") || cleanId === "10") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Ice Cream");
      else if (cleanId.includes("coffee") || cleanId === "12") found = POPULAR_RESTAURANTS_30.find(r => r.category === "Coffee");
    }

    return found || POPULAR_RESTAURANTS_30[0];
  }, [id]);

  const restaurantData = restaurantResponse?.data || restaurantResponse;
  const restaurant = restaurantData?.name ? restaurantData : fallbackRest;

  const rawMenu = menuResponse?.data || menuResponse;
  const apiMenuItems = Array.isArray(rawMenu) ? rawMenu : [];

  // Guaranteed category-matched menu items
  const menuItems = useMemo(() => {
    if (apiMenuItems.length > 0) {
      const isValid = apiMenuItems.some((item: any) => {
        const itemCat = String(item.category_name || item.category || "").toLowerCase();
        const restCat = String(restaurant?.category || restaurant?.cuisine || "").toLowerCase();
        return itemCat && restCat && (itemCat.includes(restCat) || restCat.includes(itemCat));
      });
      if (isValid) return apiMenuItems;
    }
    return getMenuForRestaurant(id, restaurant?.category, restaurant?.name);
  }, [apiMenuItems, id, restaurant]);

  // Map restaurant to header props
  const mappedRestaurant = useMemo(() => {
    if (!restaurant) return null;
    return {
      id: restaurant.id || id,
      name: restaurant.name,
      coverImage:
        resolveBackendUrl(liveDeal?.banner_url) ||
        resolveBackendUrl(restaurant.banner_url) ||
        getRestaurantImage(restaurant.image),
      logo:
        resolveBackendUrl(liveDeal?.logo_url) ||
        resolveBackendUrl(restaurant.logo_url) ||
        getRestaurantImage(restaurant.logo),
      rating: String(restaurant.rating || "4.8"),
      reviewsCount: restaurant.reviewsCount ? `${restaurant.reviewsCount}+` : "200+",
      deliveryTime: liveDeal?.delivery_time_label || restaurant.time || "20-30 min",
      priceForTwo: restaurant.priceForTwo || getPriceForTwo(restaurant.price_range),
      location: restaurant.location || restaurant.address || "Hyderabad",
      tags: (restaurant.cuisine || restaurant.category || "Delicious Food")
        .split(",")
        .map((tag: string) => tag.trim())
        .filter(Boolean),
      isOpen: restaurant.isOpen !== false,
    };
  }, [restaurant, liveDeal, id]);

  useEffect(() => {
    if (liveDeal?.coupon_code && id) {
      setActiveOffer({
        couponCode: liveDeal.coupon_code,
        title: liveDeal.offer_title,
        restaurantId: id,
      });
    }
  }, [liveDeal, id]);

  // Group menu items by category
  const { groupedMenu, menuCategories } = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    const categoriesSet = new Set<string>();

    menuItems.forEach((item: any) => {
      const catName = item.category || item.category_name || restaurant?.category || "Menu";
      categoriesSet.add(catName);

      const basePrice = item.price ? Number(item.price) : 199;
      const originalBase = item.originalPrice ? Number(item.originalPrice) : undefined;

      if (!grouped[catName]) {
        grouped[catName] = [];
      }

      grouped[catName].push({
        id: String(item.id),
        name: item.name,
        description: item.description || "Freshly prepared with authentic ingredients.",
        image: item.image || item.image_url,
        price: basePrice,
        originalPrice: originalBase,
        rating: String(item.rating || "4.8"),
        isVeg: Boolean(item.isVeg ?? item.is_veg ?? true),
        prepTime: item.prepTime || "15 min",
        calories: item.calories || undefined,
        tags: item.isBestseller ? ["Bestseller"] : [],
      });
    });

    return {
      groupedMenu: grouped,
      menuCategories: Array.from(categoriesSet),
    };
  }, [menuItems, restaurant]);

  const galleryImages = useMemo(() => {
    if (!mappedRestaurant) return [];
    const menuImages = (menuItems || [])
      .map((item: any) => (item.image || item.image_url) as string)
      .filter((img): img is string => Boolean(img))
      .filter((img, index, arr) => arr.indexOf(img) === index);
    return [mappedRestaurant.coverImage, ...menuImages].slice(0, 5);
  }, [mappedRestaurant, menuItems]);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (menuCategories.length > 0 && !activeCategory) {
      setActiveCategory(menuCategories[0]);
    }
  }, [menuCategories, activeCategory]);

  const handleCategoryClick = (category: string) => {
    const section = sectionRefs.current[category];
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 140,
        behavior: "smooth",
      });
    }
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    const targetItem = menuItems.find((i: any) => String(i.id) === String(itemId));
    if (!targetItem) return;

    updateQuantity(itemId, delta, {
      restaurant_id: id,
      name: targetItem.name,
      price: Number(targetItem.price),
      image: targetItem.image || targetItem.image_url,
      isVeg: Boolean(targetItem.isVeg ?? targetItem.is_veg),
    });

    if (delta > 0) {
      showToast("Added to cart", "success");
    }
  };

  const handleOrderNow = (itemId: string) => {
    const targetItem = menuItems.find((i: any) => String(i.id) === String(itemId));
    if (!targetItem) return;

    addAndCheckout(itemId, router, {
      restaurant_id: id,
      name: targetItem.name,
      price: Number(targetItem.price),
      image: targetItem.image || targetItem.image_url,
      isVeg: Boolean(targetItem.isVeg ?? targetItem.is_veg),
    });
  };

  // Filtered Menu by Search Query
  const filteredMenu = useMemo(() => {
    if (!searchQuery) return groupedMenu;
    const filtered: Record<string, MenuItem[]> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(groupedMenu).forEach(([category, items]) => {
      const matchingItems = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
      if (matchingItems.length > 0) {
        filtered[category] = matchingItems;
      }
    });

    return filtered;
  }, [searchQuery, groupedMenu]);

  if (isLoadingRest && !restaurant) {
    return (
      <main className="min-h-screen bg-white pt-[90px]">
        <Navbar />
        <div className="w-full h-[300px] md:h-[400px] bg-[#F8F8F8] animate-pulse relative"></div>
        <div className="container mx-auto px-4 md:px-8 mt-4">
          <div className="w-1/2 h-10 bg-[#F8F8F8] animate-pulse rounded mb-2"></div>
          <div className="w-1/3 h-6 bg-[#F8F8F8] animate-pulse rounded"></div>
        </div>
      </main>
    );
  }

  if (!mappedRestaurant) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-[#1A1A1A] text-xl font-bold">Restaurant Details Unavailable</div>
        <Link href="/popular-restaurants" className="text-[#E23744] font-bold hover:underline">
          Explore Popular Restaurants
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white relative selection:bg-[#E23744] selection:text-white pt-[90px]">
      <CatalogViewTracker
        type="restaurant"
        ready={Boolean(mappedRestaurant.id)}
        id={mappedRestaurant.id}
        name={mappedRestaurant.name}
      />
      <Navbar />

      <RestaurantHeader
        restaurant={mappedRestaurant}
        isFavorite={restaurantIds.has(id)}
        onToggleFavorite={() => toggleRestaurant(id)}
        onShare={() =>
          shareContent({
            title: mappedRestaurant.name,
            text: mappedRestaurant.tags.join(", "),
            onCopied: () => showToast("Restaurant link copied", "success"),
          })
        }
      />

      {liveDeal && (
        <LiveDealBanner
          title={liveDeal.offer_title}
          description={liveDeal.description}
          couponCode={liveDeal.coupon_code}
          deliveryTime={liveDeal.delivery_time_label}
        />
      )}

      <RestaurantGallery images={galleryImages} />

      <RestaurantMenuNav
        categories={menuCategories.filter((cat) => filteredMenu[cat])}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="container mx-auto max-w-[1440px] px-4 py-10 md:px-8">
        <div className="flex-1 w-full">
          {Object.keys(filteredMenu).length === 0 ? (
            <div className="py-16 text-center bg-[#F8F8F8] rounded-2xl border border-[#ECECEC]">
              <ShoppingBag className="w-12 h-12 text-[#E23744] mx-auto mb-3 opacity-60" />
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-1">No Menu Available</h3>
              <p className="text-[#666666] text-sm mb-6">
                This restaurant currently has no active menu items.
              </p>
              <Link
                href="/popular-restaurants"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E23744] text-white font-bold text-sm hover:bg-[#C81E34] transition-all"
              >
                <span>Browse Other Restaurants</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            Object.entries(filteredMenu).map(([category, items]) => (
              <div
                key={category}
                id={category}
                ref={(el) => {
                  sectionRefs.current[category] = el;
                }}
                className="mb-10 pt-6"
              >
                <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-[#1A1A1A]">
                  {category}
                  <span className="bg-[#FFF5F6] text-[#E23744] text-xs px-3 py-1 rounded-full font-bold border border-[#E23744]/20">
                    {items.length} items
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item) => {
                    const qty = quantities.get(item.id) || 0;
                    return (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        quantity={qty}
                        onUpdateQuantity={(itemId, delta) => handleUpdateQuantity(itemId, delta)}
                        onOrderNow={(itemId) => handleOrderNow(itemId)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isValidId && <RestaurantReviews restaurantId={id} />}

      <Footer />
    </main>
  );
}
