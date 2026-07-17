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
import ProfileSettingsPanel from "@/components/profile/ProfileSettingsPanel";
import { AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("Dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <DashboardOverview onNavigate={setActiveTab} />;
      case "My Orders":
        return <MyOrdersList />;
      case "Favorites":
        return <FavoritesPanel />;
      case "Saved Addresses":
        return <SavedAddresses />;
      case "Payment Methods":
        return <PaymentMethodsPanel />;
      case "Coupons":
        return <CouponsList />;
      case "Notifications":
        return <NotificationsPanel />;
      case "Settings":
        return <ProfileSettingsPanel />;
      default:
        return <DashboardOverview onNavigate={setActiveTab} />;
    }
  };

  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
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
