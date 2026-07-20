import { AnalyticsEvents, trackEvent } from "./events";

export type RestaurantClickParams = {
  restaurant_id: string;
  restaurant_name?: string;
  source?: string;
};

export type CategoryClickParams = {
  category_slug: string;
  category_name?: string;
  source?: string;
};

export type SearchParams = {
  search_term: string;
  results_count?: number;
  source?: string;
};

export type OfferClickParams = {
  offer_id: string;
  offer_name?: string;
  source?: string;
};

export type FoodClickParams = {
  food_id: string;
  food_name?: string;
  restaurant_id?: string;
  price?: number;
  source?: string;
};

export type AddToCartParams = {
  item_id: string;
  item_name?: string;
  restaurant_id?: string;
  price?: number;
  quantity?: number;
  currency?: string;
};

export type CheckoutParams = {
  value?: number;
  currency?: string;
  item_count?: number;
};

export type OrderPlacedParams = {
  order_id: string;
  value?: number;
  currency?: string;
  item_count?: number;
  restaurant_id?: string;
};

export type PaymentSuccessParams = {
  order_id?: string;
  value?: number;
  currency?: string;
  payment_method?: string;
};

export type LoginParams = {
  method?: string;
};

export type RegisterParams = {
  method?: string;
};

export type ContactParams = {
  subject?: string;
  source?: string;
};

export function trackRestaurantClick(params: RestaurantClickParams): void {
  trackEvent("restaurant_click", params);
}

export function trackCategoryClick(params: CategoryClickParams): void {
  trackEvent("category_click", params);
}

export function trackSearch(params: SearchParams): void {
  trackEvent("search", params);
}

export function trackOfferClick(params: OfferClickParams): void {
  trackEvent("offer_click", params);
}

export function trackFoodClick(params: FoodClickParams): void {
  trackEvent("food_click", params);
}

export function trackAddToCart(params: AddToCartParams): void {
  trackEvent(AnalyticsEvents.addToCart, params);
}

export function trackCheckout(params: CheckoutParams = {}): void {
  trackEvent(AnalyticsEvents.beginCheckout, params);
}

export function trackOrderPlaced(params: OrderPlacedParams): void {
  trackEvent(AnalyticsEvents.purchase, params);
}

export function trackPaymentSuccess(params: PaymentSuccessParams = {}): void {
  trackEvent(AnalyticsEvents.paymentSuccess, params);
}

export function trackLogin(params: LoginParams = {}): void {
  trackEvent(AnalyticsEvents.login, params);
}

export function trackRegister(params: RegisterParams = {}): void {
  trackEvent(AnalyticsEvents.signUp, params);
}

export function trackContact(params: ContactParams = {}): void {
  trackEvent("contact", params);
}
