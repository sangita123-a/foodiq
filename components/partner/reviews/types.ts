export interface RestaurantReply {
  text: string;
  date: string;
}

export interface Review {
  id: string;
  customerName: string;
  customerImage?: string;
  orderId: string;
  orderedDish: string;
  rating: number; // 1 to 5
  title: string;
  description: string;
  date: string;
  photos?: string[];
  reply?: RestaurantReply;
  isFeatured?: boolean;
  isHidden?: boolean;
}

export interface ReviewsAnalyticsData {
  averageRating: number;
  totalReviews: number;
  positiveReviews: number; // 4-5 stars
  neutralReviews: number;  // 3 stars
  negativeReviews: number; // 1-2 stars
  satisfaction: {
    foodQuality: number;
    deliveryExperience: number;
    packaging: number;
    restaurantService: number;
  };
}
