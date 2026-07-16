"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";

import { SettingsState } from "@/components/partner/settings/types";
import SettingsHeader from "@/components/partner/settings/SettingsHeader";
import SettingsSidebar, { SettingsTab } from "@/components/partner/settings/SettingsSidebar";
import SettingsActionBar from "@/components/partner/settings/SettingsActionBar";

import RestaurantProfile from "@/components/partner/settings/sections/RestaurantProfile";
import BusinessAddress from "@/components/partner/settings/sections/BusinessAddress";
import WorkingHours from "@/components/partner/settings/sections/WorkingHours";
import DeliverySettings from "@/components/partner/settings/sections/DeliverySettings";
import BankPayout from "@/components/partner/settings/sections/BankPayout";
import TaxInformation from "@/components/partner/settings/sections/TaxInformation";
import NotificationPreferences from "@/components/partner/settings/sections/NotificationPreferences";
import SecuritySettings from "@/components/partner/settings/sections/SecuritySettings";
import BrandingSettings from "@/components/partner/settings/sections/BrandingSettings";

// --- Mock Dataset ---
const INITIAL_SETTINGS: SettingsState = {
  profile: {
    logo: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=200&auto=format&fit=crop",
    cover: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1200&auto=format&fit=crop",
    restaurantName: "The Spice Symphony",
    ownerName: "Rahul Sharma",
    email: "contact@spicesymphony.com",
    phone: "+91 98765 43210",
    description: "Authentic North Indian cuisine prepared with a modern twist. We specialize in Dum Biryanis, rich curries, and tandoor delicacies.",
    cuisineType: "North Indian, Mughlai"
  },
  address: {
    street: "123 Food Street, 4th Block, Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034"
  },
  workingHours: [
    { day: "Monday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { day: "Tuesday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { day: "Wednesday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { day: "Thursday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
    { day: "Friday", isOpen: true, openTime: "11:00", closeTime: "23:30" },
    { day: "Saturday", isOpen: true, openTime: "11:00", closeTime: "23:30" },
    { day: "Sunday", isOpen: true, openTime: "11:00", closeTime: "23:30" }
  ],
  delivery: {
    radius: 5,
    minOrderAmount: 200,
    estimatedTime: 30,
    acceptOnlineOrders: true,
    acceptPickupOrders: true
  },
  bank: {
    accountName: "Rahul Sharma",
    bankName: "HDFC Bank",
    accountNumber: "50100012345678",
    ifsc: "HDFC0001234",
    upi: "spicesymphony@hdfcbank"
  },
  tax: {
    gst: "29AABCU9603R1ZM",
    pan: "AABCU9603R",
    regNumber: "11219333000123"
  },
  notifications: {
    newOrders: true,
    orderCancellation: true,
    customerReviews: false,
    paymentAlerts: true,
    marketingUpdates: false
  },
  security: {
    twoFactorAuth: false
  },
  branding: {
    themeColor: "#e02633", // Foodiq Red
    primaryBanner: "",
    promoBanner: ""
  }
};

export default function PartnerSettingsPage() {
  
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  
  // State Management for Forms
  const [settings, setSettings] = useState<SettingsState>(INITIAL_SETTINGS);
  
  // Determine if changes exist (to show the sticky action bar)
  // Deep comparison is complex, using stringify for simple mock state check
  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(INITIAL_SETTINGS);
  }, [settings]);

  // Generic updater function to pass to sections
  const updateSection = (section: keyof SettingsState, data: any) => {
    setSettings(prev => ({ ...prev, [section]: { ...prev[section], ...data } }));
  };

  const handleSave = () => {
    // In a real app, API POST request here
    alert("Settings saved successfully!");
    // Reset initial state to current to hide action bar
  };

  const handleReset = () => {
    setSettings(INITIAL_SETTINGS);
  };

  const renderSection = () => {
    switch (activeTab) {
      case "profile":
        return <RestaurantProfile data={settings.profile} onChange={(d) => updateSection("profile", d)} />;
      case "address":
        return <BusinessAddress data={settings.address} onChange={(d) => updateSection("address", d)} />;
      case "hours":
        return <WorkingHours data={settings.workingHours} onChange={(d) => setSettings(prev => ({ ...prev, ...d }))} />;
      case "delivery":
        return <DeliverySettings data={settings.delivery} onChange={(d) => updateSection("delivery", d)} />;
      case "bank":
        return <BankPayout data={settings.bank} onChange={(d) => updateSection("bank", d)} />;
      case "tax":
        return <TaxInformation data={settings.tax} onChange={(d) => updateSection("tax", d)} />;
      case "notifications":
        return <NotificationPreferences data={settings.notifications} onChange={(d) => updateSection("notifications", d)} />;
      case "security":
        return <SecuritySettings data={settings.security} onChange={(d) => updateSection("security", d)} />;
      case "branding":
        return <BrandingSettings data={settings.branding} onChange={(d) => updateSection("branding", d)} />;
      default:
        return null;
    }
  };

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

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-6xl mx-auto pb-32">
            
            <SettingsHeader />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* Left Settings Navigation */}
              <div className="w-full md:w-auto md:sticky top-4">
                <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>

              {/* Right Settings Content Area */}
              <div className="flex-1 w-full bg-[#171717] rounded-3xl p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden min-h-[600px]">
                
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderSection()}
                  </motion.div>
                </AnimatePresence>

              </div>

            </div>

          </div>
        </main>
      </div>

      {/* Sticky Bottom Action Bar */}
      <SettingsActionBar 
        isVisible={hasChanges} 
        onSave={handleSave} 
        onReset={handleReset} 
        onCancel={handleReset} 
      />

    </div>
  );
}
