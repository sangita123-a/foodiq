"use client";

import { useState, useMemo } from "react";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";
import ReviewsHeader from "@/components/partner/reviews/ReviewsHeader";
import ReviewsSummary from "@/components/partner/reviews/ReviewsSummary";
import ReviewsFilterBar from "@/components/partner/reviews/ReviewsFilterBar";
import ReviewsList from "@/components/partner/reviews/ReviewsList";
import ReviewsEmptyState from "@/components/partner/reviews/ReviewsEmptyState";
import ReviewsAnalytics from "@/components/partner/reviews/ReviewsAnalytics";
import { Review, ReviewsAnalyticsData } from "@/components/partner/reviews/types";

// --- Mock Dataset ---
const INITIAL_REVIEWS: Review[] = [
  {
    id: "REV-001",
    customerName: "Rahul Sharma",
    orderId: "#ORD-9021",
    orderedDish: "Hyderabadi Chicken Dum Biryani",
    rating: 5,
    title: "Absolutely delicious!",
    description: "The biryani was perfectly cooked. The chicken was tender and the spices were spot on. Will definitely order again.",
    date: "2 days ago",
    isFeatured: true
  },
  {
    id: "REV-002",
    customerName: "Priya Patel",
    orderId: "#ORD-9022",
    orderedDish: "Paneer Butter Masala",
    rating: 4,
    title: "Great taste, slightly oily",
    description: "The paneer was very soft and the gravy was rich. However, it felt a bit too oily for my liking. Good overall.",
    date: "3 days ago",
    reply: {
      text: "Hi Priya, thank you for your feedback! We are glad you liked the taste. We have noted your feedback regarding the oil and will inform our chefs.",
      date: "2 days ago"
    }
  },
  {
    id: "REV-003",
    customerName: "Amit Kumar",
    orderId: "#ORD-9023",
    orderedDish: "Cold Coffee with Ice Cream",
    rating: 2,
    title: "Disappointed",
    description: "The coffee was warm and the ice cream had completely melted by the time it reached me. Very poor packaging.",
    date: "1 week ago",
    photos: ["https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?q=80&w=200&auto=format&fit=crop"]
  },
  {
    id: "REV-004",
    customerName: "Sneha Reddy",
    orderId: "#ORD-9024",
    orderedDish: "Veg Hakka Noodles",
    rating: 5,
    title: "Best Chinese in town",
    description: "Perfectly seasoned noodles with lots of fresh veggies. The portion size was also very generous. Loved it!",
    date: "2 weeks ago"
  }
];

const ANALYTICS_DATA: ReviewsAnalyticsData = {
  averageRating: 4.2,
  totalReviews: 1254,
  positiveReviews: 890,
  neutralReviews: 210,
  negativeReviews: 154,
  satisfaction: {
    foodQuality: 92,
    deliveryExperience: 78,
    packaging: 85,
    restaurantService: 95
  }
};

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  
  // Filter States
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [sortBy, setSortBy] = useState("Newest First");

  // Handlers
  const handleUpdateReply = (id: string, text: string | null) => {
    setReviews(prev => prev.map(rev => {
      if (rev.id === id) {
        if (text === null) {
          const { reply, ...rest } = rev;
          return rest;
        } else {
          return { ...rev, reply: { text, date: "Just now" } };
        }
      }
      return rev;
    }));
  };

  const handleUpdateStatus = (id: string, field: "isFeatured" | "isHidden", value: boolean) => {
    setReviews(prev => prev.map(rev => rev.id === id ? { ...rev, [field]: value } : rev));
  };

  // Derived Data
  const filteredReviews = useMemo(() => {
    const result = reviews.filter(rev => {
      const matchesSearch = rev.customerName.toLowerCase().includes(search.toLowerCase()) || 
                            rev.orderedDish.toLowerCase().includes(search.toLowerCase());
      const matchesRating = ratingFilter === "All" || rev.rating.toString() === ratingFilter;
      return matchesSearch && matchesRating;
    });

    // Sort Logic (Simplified for mock data)
    result.sort((a, b) => {
      if (sortBy === "Highest Rated") {
        return b.rating - a.rating;
      } else if (sortBy === "Lowest Rated") {
        return a.rating - b.rating;
      }
      return 0; // Keeping default mock order for newest/oldest for demo
    });

    return result;
  }, [reviews, search, ratingFilter, sortBy]);

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex selection:bg-[var(--color-primary)] selection:text-white">
      
      {/* Sidebar - Fixed on left for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Sticky Header */}
        <PartnerHeader />

        {/* Scrollable Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            
            <ReviewsHeader />
            
            <ReviewsSummary data={ANALYTICS_DATA} />

            <ReviewsFilterBar 
              search={search} setSearch={setSearch}
              ratingFilter={ratingFilter} setRatingFilter={setRatingFilter}
              dateRange={dateRange} setDateRange={setDateRange}
              sortBy={sortBy} setSortBy={setSortBy}
            />

            {filteredReviews.length > 0 ? (
              <ReviewsList 
                reviews={filteredReviews} 
                onUpdateReply={handleUpdateReply}
                onUpdateStatus={handleUpdateStatus}
              />
            ) : (
              <ReviewsEmptyState />
            )}

            <ReviewsAnalytics data={ANALYTICS_DATA} />

          </div>
        </main>
      </div>
    </div>
  );
}
