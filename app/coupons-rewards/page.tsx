"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RewardsHeader from "@/components/rewards/RewardsHeader";
import RewardPointsCard from "@/components/rewards/RewardPointsCard";
import CouponCard, { CouponType } from "@/components/rewards/CouponCard";
import RewardHistory, { RewardHistoryType } from "@/components/rewards/RewardHistory";
import EarnPointsGuide from "@/components/rewards/EarnPointsGuide";
import ReferBanner from "@/components/rewards/ReferBanner";

import useSWR from "swr";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuthToken } from "@/hooks/useAuthToken";

const expiredCoupons: CouponType[] = [
  { id: "c5", code: "DIWALI500", title: "Festive Special", discountValue: "₹500", minOrder: "₹999", expiry: "Expired", terms: "Valid only during Diwali week.", isExpired: true },
  { id: "c6", code: "BOGO", title: "Buy 1 Get 1 Free", discountValue: "BOGO", minOrder: "2 items", expiry: "Expired", terms: "Valid only on select pizzas.", isExpired: true },
];

const historyData: RewardHistoryType[] = [
  { id: "h1", date: "Today, 12:30 PM", title: "Order #892134 Delivered", pointsAdded: 45 },
  { id: "h2", date: "Yesterday, 08:15 PM", title: "Redeemed 'SAVE20' Coupon", pointsUsed: 100 },
  { id: "h3", date: "12 Oct 2026", title: "Referral Bonus (Rahul)", pointsAdded: 500 },
  { id: "h4", date: "10 Oct 2026", title: "Review for Paradise Biryani", pointsAdded: 50 },
];

export default function CouponsRewardsPage() {
  const { showToast } = useToast();
  const hasToken = useAuthToken();
  
  const { data: couponsData, isLoading: isLoadingCoupons } = useSWR(hasToken ? '/api/coupons' : null);
  const backendCoupons = couponsData || [];

  const { data: rewardsData, isLoading: isLoadingRewards, mutate: mutateRewards } = useSWR(hasToken ? '/api/rewards' : null);
  const rewards = rewardsData || {};
  const pointsBalance = rewards.points_balance || 0;
  const totalRedeemed = rewards.total_redeemed || 0;
  const backendHistory = rewards.history || [];

  const mappedHistory = backendHistory.map((h: any) => ({
    id: h.id,
    date: new Date(h.created_at).toLocaleString(),
    title: h.transaction_type === 'earned' ? 'Points Earned' : 'Points Redeemed',
    pointsAdded: h.transaction_type === 'earned' ? h.points : undefined,
    pointsUsed: h.transaction_type === 'redeemed' ? h.points : undefined,
  }));

  const activeCoupons: CouponType[] = backendCoupons.map((c: any) => ({
    id: c.id,
    code: c.code,
    title: c.discount_type === 'percentage' ? `${c.discount_amount}% OFF` : `Flat ₹${c.discount_amount} OFF`,
    discountValue: c.discount_type === 'percentage' ? `${c.discount_amount}%` : `₹${c.discount_amount}`,
    minOrder: `₹${c.min_order_amount}`,
    expiry: c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "No expiry",
    terms: "Valid on select orders.",
    isExpired: false
  }));

  const handleRedeem = async () => {
    try {
      const res = await api.post('/api/rewards/claim', { points_to_claim: 100 });
      showToast(`Redeemed 100 points! Coupon: ${res.data.data.coupon.code}`, "success");
      mutateRewards();
    } catch (e: any) {
      console.error(e);
      showToast(e.response?.data?.message || "Failed to redeem points", "error");
    }
  };

  if (isLoadingCoupons || isLoadingRewards) {
    return (
      <main className="min-h-screen bg-background relative pt-[90px]">
        <Navbar />
        <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
          <div className="w-full h-64 bg-section animate-pulse rounded-3xl border border-border mb-12"></div>
          <div className="w-full h-48 bg-section animate-pulse rounded-3xl border border-border mb-12"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        
        <RewardsHeader />

        <RewardPointsCard 
          totalPoints={pointsBalance}
          level={pointsBalance >= 2000 ? "Platinum" : pointsBalance >= 1000 ? "Gold" : "Silver"}
          pointsToNextLevel={pointsBalance >= 2000 ? 0 : pointsBalance >= 1000 ? 2000 - pointsBalance : 1000 - pointsBalance}
          progressPercent={pointsBalance >= 2000 ? 100 : pointsBalance >= 1000 ? (pointsBalance - 1000) / 10 : pointsBalance / 10}
          totalSavings={totalRedeemed}
          expiryDate="31 Mar 2027"
          onRedeem={handleRedeem}
        />

        <EarnPointsGuide />

        <div className="flex flex-col lg:flex-row gap-12 mb-12">
          
          <div className="flex-1">
            
            {/* Active Coupons */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Available Coupons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeCoupons.map(coupon => (
                  <CouponCard key={coupon.id} coupon={coupon} />
                ))}
              </div>
            </section>

            {/* Expired Coupons */}
            <section>
              <h2 className="text-2xl font-bold text-[#9CA3AF] mb-6">Expired Coupons</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {expiredCoupons.map(coupon => (
                  <CouponCard key={coupon.id} coupon={coupon} />
                ))}
              </div>
            </section>

          </div>

          <div className="lg:w-[400px]">
            <RewardHistory history={mappedHistory} />
          </div>

        </div>

        <ReferBanner />

      </div>

      <Footer />
    </main>
  );
}
