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
    <main className="relative min-h-screen bg-[#FFFFFF] pt-[90px] selection:bg-[#E23744]/20">
      <Navbar />

      <div className="container mx-auto px-4 py-12 md:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="w-full lg:w-[30%] xl:w-[25%]">
            <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className="w-full lg:w-[70%] xl:w-[75%]">
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
