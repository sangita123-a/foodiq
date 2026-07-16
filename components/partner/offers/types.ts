export type DiscountType = "Flat Discount" | "Percentage Discount" | "Free Delivery" | "Buy One Get One (BOGO)";
export type OfferStatus = "Active" | "Scheduled" | "Expired" | "Paused";

export interface Offer {
  id: string;
  name: string;
  code: string;
  type: DiscountType;
  value: number; // e.g., 50 for Rs.50 or 20 for 20%
  minOrderValue: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usageCount: number;
  applicableCategories: string[];
  applicableDishes: string[];
  description: string;
  status: OfferStatus;
  bannerImage?: string;
}

export interface OffersAnalyticsData {
  activeOffers: number;
  scheduledOffers: number;
  expiredOffers: number;
  totalRedemptions: number;
  revenueFromPromotions: number;
}
