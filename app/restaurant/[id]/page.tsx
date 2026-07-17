"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RestaurantHeader from "@/components/restaurant/RestaurantHeader";
import RestaurantGallery from "@/components/restaurant/RestaurantGallery";
import SimilarRestaurants from "@/components/restaurant/SimilarRestaurants";
import RestaurantMenuNav from "@/components/restaurant/RestaurantMenuNav";
import MenuItemCard, { MenuItem } from "@/components/restaurant/MenuItemCard";
import RestaurantReviews from "@/components/restaurant/RestaurantReviews";
import RestaurantCart from "@/components/restaurant/RestaurantCart";
import { Star } from "lucide-react";
import useSWR, { mutate as globalMutate } from "swr";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import api from "@/services/api";
import { FOOD_FALLBACK, getFoodImage, getPriceForTwo, getRestaurantImage, getBrandFoodImage } from "@/lib/images";
import SafeImage from "@/components/ui/SafeImage";
import LiveDealBanner from "@/components/restaurant/LiveDealBanner";
import { setActiveOffer } from "@/lib/offers";
import { useFavoriteActions } from "@/hooks/useFavoriteActions";
import { shareContent } from "@/lib/share";

function computeDealDisplayPrice(
  basePrice: number,
  discountType?: string,
  discountAmount?: number
) {
  if (!discountType || discountAmount == null) {
    return { displayPrice: basePrice, originalPrice: undefined as number | undefined };
  }
  if (discountType === "percentage") {
    const displayPrice = Math.round(basePrice * (1 - Number(discountAmount) / 100));
    return { displayPrice, originalPrice: basePrice };
  }
  return { displayPrice: basePrice, originalPrice: basePrice };
}

export default function RestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const dealCode = searchParams.get("deal");
  const { showToast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { restaurantIds, toggleRestaurant } = useFavoriteActions();

  useEffect(() => {
    setIsLoggedIn(!!Cookies.get("token"));
  }, []);

  const isValidId = Boolean(id && id.length >= 8);

  const { data: restaurantResponse, isLoading: isLoadingRest, error: restaurantError } = useSWR(
    isValidId ? `/api/restaurants/${id}` : null
  );
  const { data: menuResponse, isLoading: isLoadingMenu } = useSWR(
    isValidId ? `/api/restaurants/${id}/menu` : null
  );
  const { data: liveDeal } = useSWR(
    isValidId && dealCode ? `/api/live-deals/restaurant/${id}?coupon=${dealCode}` : null
  );

  const { data: cartResponse, mutate: mutateCart } = useSWR(isLoggedIn ? "/api/cart" : null);
  const { data: favResponse, mutate: mutateFavs } = useSWR(isLoggedIn ? "/api/favorites" : null);

  const restaurant = restaurantResponse;
  const menuItems = menuResponse || [];
  const cartItems = cartResponse?.items || [];
  const cartTotals = cartResponse?.totals || { subtotal: 0, deliveryCharge: 0, tax: 0, discount: 0, grandTotal: 0 };
  const favoriteItemIds = new Set(
    (favResponse?.items || (Array.isArray(favResponse) ? favResponse : [])).map(
      (f: any) => f.id || f.menu_item_id
    )
  );


  // Map backend restaurant to component props
  const mappedRestaurant = useMemo(() => {
    if (!restaurant) return null;
    const brandLogo = liveDeal?.logo_url || restaurant.logo_url || getBrandFoodImage(restaurant.name, restaurant.logo_url);
    return {
      id: restaurant.id,
      name: restaurant.name,
      coverImage:
        liveDeal?.banner_url ||
        restaurant.banner_url ||
        getRestaurantImage(restaurant.image_url),
      logo: brandLogo,
      rating: String(restaurant.rating || "4.5"),
      reviewsCount: restaurant.review_count ? `${restaurant.review_count}+` : "100+",
      deliveryTime: liveDeal?.delivery_time_label || `${restaurant.estimated_delivery_time || 30} min`,
      priceForTwo: getPriceForTwo(restaurant.price_range),
      location: restaurant.address,
      tags: (restaurant.category_name || restaurant.description || "Various Cuisines")
        .split(",")
        .map((tag: string) => tag.trim())
        .filter(Boolean),
      isOpen: restaurant.is_active,
    };
  }, [restaurant, liveDeal]);

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
      const catName = item.category_name || "Others";
      categoriesSet.add(catName);

      const basePrice = item.discount_price
        ? parseFloat(item.discount_price)
        : parseFloat(item.price);
      const originalBase = parseFloat(item.price);
      const dealPricing = liveDeal
        ? computeDealDisplayPrice(
            basePrice,
            liveDeal.discount_type,
            liveDeal.discount_amount
          )
        : { displayPrice: basePrice, originalPrice: item.discount_price ? originalBase : undefined };

      if (!grouped[catName]) {
        grouped[catName] = [];
      }

      grouped[catName].push({
        id: item.id,
        name: item.name,
        description: item.description,
        image: getFoodImage(item.image_url),
        price: dealPricing.displayPrice,
        originalPrice: dealPricing.originalPrice,
        rating: "4.5",
        isVeg: item.is_vegetarian,
        prepTime: item.preparation_time || "15 min",
        calories: item.calories ? `${item.calories} kcal` : undefined,
        isFavorite: favoriteItemIds.has(item.id),
      });
    });

    return {
      groupedMenu: grouped,
      menuCategories: Array.from(categoriesSet)
    };
  }, [menuItems, favoriteItemIds, liveDeal]);

  const galleryImages = useMemo(() => {
    if (!mappedRestaurant) return [];
    const menuImages = menuItems
      .map((item: { image_url?: string }) => getFoodImage(item.image_url))
      .filter((img: string, index: number, arr: string[]) => arr.indexOf(img) === index);
    return [mappedRestaurant.coverImage, ...menuImages].slice(0, 5);
  }, [mappedRestaurant, menuItems]);

  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (menuCategories.length > 0 && !activeCategory) {
      setActiveCategory(menuCategories[0]);
    }
  }, [menuCategories, activeCategory]);

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for sticky header

      let currentActive = activeCategory;
      
      for (const category of menuCategories) {
        const section = sectionRefs.current[category];
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            currentActive = category;
          }
        }
      }

      if (currentActive !== activeCategory) {
        setActiveCategory(currentActive);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeCategory]);

  const handleCategoryClick = (category: string) => {
    const section = sectionRefs.current[category];
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 140, // Offset for sticky nav
        behavior: "smooth",
      });
    }
  };

  const handleUpdateQuantity = async (itemId: string, delta: number) => {
    if (!Cookies.get("token")) {
      showToast("Please login to add items to cart", "error");
      return false;
    }
    if (isUpdatingCart) return false;
    
    // Find if item is already in cart
    const cartItem = cartItems.find((i: any) => i.menu_item_id === itemId);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const newQty = currentQty + delta;
    
    try {
      setIsUpdatingCart(true);
      if (newQty <= 0) {
        if (cartItem) {
          await api.delete(`/api/cart/remove/${cartItem.cart_item_id}`);
        }
      } else if (!cartItem) {
        await api.post(`/api/cart/add`, { menu_item_id: itemId, quantity: newQty });
        showToast("Added to cart", "success");
      } else {
        await api.put(`/api/cart/update/${cartItem.cart_item_id}`, { quantity: newQty });
        if (delta > 0) showToast("Cart updated", "success");
      }
      mutateCart();
      globalMutate("/api/cart");
      return true;
    } catch (error: any) {
      console.error("Failed to update cart", error);
      showToast(error.response?.data?.message || "Failed to update cart", "error");
      return false;
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const handleOrderNow = async (itemId: string) => {
    const cartItem = cartItems.find((item: any) => item.menu_item_id === itemId);
    const canCheckout = cartItem ? true : await handleUpdateQuantity(itemId, 1);

    if (canCheckout) {
      router.push("/checkout");
    }
  };

  // Cart Calculations
  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const totalPrice = cartTotals.subtotal;

  // Filtered Menu
  const filteredMenu = useMemo(() => {
    if (!searchQuery) return groupedMenu;
    
    const filtered: Record<string, MenuItem[]> = {};
    const query = searchQuery.toLowerCase();

    Object.entries(groupedMenu).forEach(([category, items]) => {
      const matchingItems = items.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.description && item.description.toLowerCase().includes(query))
      );
      if (matchingItems.length > 0) {
        filtered[category] = matchingItems;
      }
    });

    return filtered;
  }, [searchQuery, groupedMenu]);

  if (isLoadingRest || isLoadingMenu) {
    return (
      <main className="min-h-screen bg-white pt-[90px]">
        <Navbar />
        {/* Header Skeleton */}
        <div className="w-full h-[300px] md:h-[400px] bg-[#F8FAFC] animate-pulse relative"></div>
        <div className="container mx-auto px-4 md:px-8 mt-4">
           <div className="w-1/2 h-10 bg-[#F8FAFC] animate-pulse rounded mb-2"></div>
           <div className="w-1/3 h-6 bg-[#F8FAFC] animate-pulse rounded"></div>
        </div>

        {/* Menu Skeleton */}
        <div className="container mx-auto px-4 md:px-8 py-12">
          <div className="restaurant-menu-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-[360px] w-full animate-pulse rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC]"></div>
              ))}
          </div>
        </div>
      </main>
    );
  }

  if (!isValidId || restaurantError) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 pt-[90px]">
        <Navbar />
        <div className="text-white text-xl">Restaurant not found.</div>
        <Link href="/restaurants" className="text-primary font-bold hover:underline">
          Browse restaurants
        </Link>
      </main>
    );
  }

  if (!mappedRestaurant) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-white text-xl">Restaurant not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
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
        categories={menuCategories.filter(cat => filteredMenu[cat])}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="container mx-auto max-w-[1600px] px-4 py-10 md:px-8">
        
        {/* Main Menu Area */}
        <div className="flex-1 w-full">
          {Object.entries(filteredMenu).map(([category, items]) => (
            <div 
              key={category} 
              id={category} 
              ref={(el) => { sectionRefs.current[category] = el; }}
              className="mb-10 pt-6" // pt-6 gives breathing room for scroll-spy offset
            >
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold tracking-tight text-[#111827]">
                {category}
                <span className="bg-[#F8FAFC] text-[#6B7280] text-sm px-3 py-1 rounded-full font-medium">
                  {items.length}
                </span>
              </h2>
              
              <div className="restaurant-menu-grid">
                {items.map(item => {
                  const cartItem = cartItems.find((ci: any) => ci.menu_item_id === item.id);
                  const qty = cartItem ? cartItem.quantity : 0;
                  return (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      quantity={qty}
                      isUpdating={isUpdatingCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onOrderNow={handleOrderNow}
                      onFavoriteToggle={mutateFavs}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(filteredMenu).length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-xl text-[#6B7280]">No dishes found for "{searchQuery}"</h3>
            </div>
          )}

          {Object.values(groupedMenu).flat().length > 0 && (
            <section className="mb-12 border-t border-white/[0.07] pt-10" aria-labelledby="recommended-menu-heading">
              <h3 id="recommended-menu-heading" className="mb-5 text-xl font-bold text-[#111827]">
                You May Also Like
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.values(groupedMenu).flat().slice(0, 3).map(item => (
                  <Link
                    key={item.id}
                    href={`/food/${item.id}`}
                    className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#FFFFFF] p-3 transition-all hover:-translate-y-0.5 hover:border-[#E5E7EB]"
                  >
                    <SafeImage
                      src={item.image}
                      fallback={FOOD_FALLBACK}
                      alt={item.name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="min-w-0">
                      <h4 className="line-clamp-1 text-sm font-semibold text-white transition-colors group-hover:text-primary">
                        {item.name}
                      </h4>
                      <div className="mb-1 text-xs text-[#9CA3AF]">₹{item.price}</div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-green-400">
                        <Star className="h-3 w-3 fill-current" /> {item.rating}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <RestaurantReviews restaurantId={id} />
        </div>

      </div>

      <RestaurantCart totalItems={totalItems} totalPrice={totalPrice} />

      <SimilarRestaurants currentRestaurantId={id} />
      
      <Footer />
    </main>
  );
}
