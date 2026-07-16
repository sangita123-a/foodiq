"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { useParams, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import api from "@/services/api";
import { getFoodImage, getPriceForTwo, getRestaurantImage, getBrandFoodImage } from "@/lib/images";
import LiveDealBanner from "@/components/restaurant/LiveDealBanner";
import { setActiveOffer } from "@/lib/offers";

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
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const dealCode = searchParams.get("deal");
  const { showToast } = useToast();

  const { data: restaurantResponse, isLoading: isLoadingRest } = useSWR(id ? `/api/restaurants/${id}` : null);
  const { data: menuResponse, isLoading: isLoadingMenu } = useSWR(id ? `/api/restaurants/${id}/menu` : null);
  const { data: liveDeal } = useSWR(
    id && dealCode ? `/api/live-deals/restaurant/${id}?coupon=${dealCode}` : null
  );
  
  const { data: cartResponse, mutate: mutateCart } = useSWR('/api/cart');
  const { data: favResponse, mutate: mutateFavs } = useSWR('/api/favorites');

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
    const brandLogo = liveDeal?.logo_url || getBrandFoodImage(restaurant.name);
    return {
      id: restaurant.id,
      name: restaurant.name,
      coverImage: liveDeal?.banner_url || getRestaurantImage(restaurant.image_url),
      logo: brandLogo,
      rating: String(restaurant.rating || "4.5"),
      reviewsCount: "100+",
      deliveryTime: liveDeal?.delivery_time_label || `${restaurant.estimated_delivery_time || 30} min`,
      priceForTwo: getPriceForTwo(restaurant.price_range),
      location: restaurant.address,
      tags: (restaurant.description || "Various Cuisines").split(","),
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
    if (isUpdatingCart) return;
    
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
    } catch (error) {
      console.error("Failed to update cart", error);
      showToast("Failed to update cart", "error");
    } finally {
      setIsUpdatingCart(false);
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
      <main className="min-h-screen bg-black pt-[90px]">
        <Navbar />
        {/* Header Skeleton */}
        <div className="w-full h-[300px] md:h-[400px] bg-white/5 animate-pulse relative"></div>
        <div className="container mx-auto px-4 md:px-8 mt-4">
           <div className="w-1/2 h-10 bg-white/5 animate-pulse rounded mb-2"></div>
           <div className="w-1/3 h-6 bg-white/5 animate-pulse rounded"></div>
        </div>

        {/* Menu Skeleton */}
        <div className="container mx-auto px-4 md:px-8 py-12 flex gap-8">
          <div className="flex-1 w-full max-w-4xl">
            <div className="flex flex-col gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full h-[160px] bg-white/5 animate-pulse rounded-2xl border border-white/10"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!mappedRestaurant) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Restaurant not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <RestaurantHeader restaurant={mappedRestaurant} />

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

      <div className="container mx-auto px-4 md:px-8 py-12 flex gap-8">
        
        {/* Main Menu Area */}
        <div className="flex-1 w-full max-w-4xl">
          {Object.entries(filteredMenu).map(([category, items]) => (
            <div 
              key={category} 
              id={category} 
              ref={(el) => { sectionRefs.current[category] = el; }}
              className="mb-12 pt-8" // pt-8 gives breathing room for scroll-spy offset
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                {category}
                <span className="bg-white/10 text-gray-400 text-sm px-3 py-1 rounded-full font-medium">
                  {items.length}
                </span>
              </h2>
              
              <div className="flex flex-col gap-6">
                {items.map(item => {
                  const cartItem = cartItems.find((ci: any) => ci.menu_item_id === item.id);
                  const qty = cartItem ? cartItem.quantity : 0;
                  return (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      quantity={qty}
                      onUpdateQuantity={handleUpdateQuantity}
                      onFavoriteToggle={mutateFavs}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(filteredMenu).length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-xl text-gray-400">No dishes found for "{searchQuery}"</h3>
            </div>
          )}

          <RestaurantReviews restaurantId={id} />
        </div>

        <div className="hidden lg:block w-[350px] relative">
          <div className="sticky top-[160px]">
            <div className="bg-[#121212] rounded-2xl p-6 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-6">You May Also Like</h3>
              <div className="flex flex-col gap-6">
                {Object.values(groupedMenu).flat().slice(0, 3).map(item => (
                  <div key={item.id} className="flex gap-4 group cursor-pointer">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover group-hover:scale-105 transition-transform" />
                    <div>
                      <h4 className="text-white text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">{item.name}</h4>
                      <div className="text-xs text-gray-500 mb-1">₹{item.price}</div>
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <Star className="w-3 h-3 fill-green-400" /> {item.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <RestaurantCart totalItems={totalItems} totalPrice={totalPrice} />

      <SimilarRestaurants currentRestaurantId={id} />
      
      <Footer />
    </main>
  );
}
