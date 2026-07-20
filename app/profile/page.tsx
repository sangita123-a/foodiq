"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfileSidebar, { ProfileTab } from "@/components/profile/ProfileSidebar";
import DashboardOverview from "@/components/profile/DashboardOverview";
import MyOrdersList from "@/components/profile/MyOrdersList";
import SavedAddresses from "@/components/profile/SavedAddresses";
import CouponsList from "@/components/profile/CouponsList";
import FavoritesPanel from "@/components/profile/FavoritesPanel";
import PaymentMethodsPanel from "@/components/profile/PaymentMethodsPanel";
import NotificationsPanel from "@/components/profile/NotificationsPanel";
import WishlistPanel from "@/components/profile/WishlistPanel";
import AccountSettingsPanel from "@/components/profile/AccountSettingsPanel";
import PrivacyPanel from "@/components/profile/PrivacyPanel";
import SecurityPanel from "@/components/profile/SecurityPanel";
import { AnimatePresence } from "framer-motion";

const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: "Overview", label: "Overview" },
  { id: "My Orders", label: "Orders" },
  { id: "Wishlist", label: "Wishlist" },
  { id: "Saved Addresses", label: "Addresses" },
  { id: "Payment Methods", label: "Payments" },
  { id: "Coupons", label: "Coupons" },
  { id: "Notifications", label: "Alerts" },
  { id: "Account Settings", label: "Settings" },
  { id: "Privacy", label: "Privacy" },
  { id: "Security", label: "Security" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Overview");

  const renderContent = () => {
    switch (activeTab) {
      case "Overview":
        return <DashboardOverview onNavigate={(tab) => setActiveTab(tab as ProfileTab)} />;
      case "My Orders":
        return <MyOrdersList />;
      case "Wishlist":
        return <WishlistPanel />;
      case "Saved Addresses":
        return <SavedAddresses />;
      case "Payment Methods":
        return <PaymentMethodsPanel />;
      case "Coupons":
        return <CouponsList />;
      case "Notifications":
        return <NotificationsPanel />;
      case "Account Settings":
        return <AccountSettingsPanel />;
      case "Privacy":
        return <PrivacyPanel />;
      case "Security":
        return <SecurityPanel />;
      default:
        return <DashboardOverview onNavigate={(tab) => setActiveTab(tab as ProfileTab)} />;
    }
  };

  return (
    <main className="relative min-h-screen bg-[#FFFFFF] pt-[72px] sm:pt-[80px] md:pt-[90px] selection:bg-[#E23744]/20 overflow-x-hidden">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 md:px-8 md:py-12">
        {/* Mobile tab navigation */}
        <div className="lg:hidden scroll-row mb-6 -mx-1 px-1">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`touch-target whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? "bg-[#E23744] text-white shadow-md"
                  : "border border-[#ECECEC] bg-white text-[#686B78]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6 lg:gap-8 lg:flex-row">
          <div className="hidden lg:block w-full lg:w-[30%] xl:w-[25%]">
            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className="w-full min-w-0 lg:w-[70%] xl:w-[75%]">
            <AnimatePresence mode="wait">
              <div key={activeTab}>{renderContent()}</div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
