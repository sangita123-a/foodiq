"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PartnerSidebar from "@/components/partner/PartnerSidebar";
import PartnerHeader from "@/components/partner/PartnerHeader";

import { SettingsState, WorkingDay } from "@/components/partner/settings/types";
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
import { usePartnerProfile } from "@/hooks/usePartnerData";
import { updatePartnerProfile } from "@/services/partnerApi";
import { mutate } from "swr";
import { RESTAURANT_FALLBACK } from "@/lib/images";

const DEFAULT_HOURS: WorkingDay[] = [
  { day: "Monday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
  { day: "Tuesday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
  { day: "Wednesday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
  { day: "Thursday", isOpen: true, openTime: "11:00", closeTime: "23:00" },
  { day: "Friday", isOpen: true, openTime: "11:00", closeTime: "23:30" },
  { day: "Saturday", isOpen: true, openTime: "11:00", closeTime: "23:30" },
  { day: "Sunday", isOpen: true, openTime: "11:00", closeTime: "23:30" },
];

const EMPTY_SETTINGS: SettingsState = {
  profile: {
    logo: RESTAURANT_FALLBACK,
    cover: RESTAURANT_FALLBACK,
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    description: "",
    cuisineType: "",
  },
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
  },
  workingHours: DEFAULT_HOURS,
  delivery: {
    radius: 5,
    minOrderAmount: 200,
    estimatedTime: 30,
    acceptOnlineOrders: true,
    acceptPickupOrders: true,
  },
  bank: {
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upi: "",
  },
  tax: {
    gst: "",
    pan: "",
    regNumber: "",
  },
  notifications: {
    newOrders: true,
    orderCancellation: true,
    customerReviews: false,
    paymentAlerts: true,
    marketingUpdates: false,
  },
  security: {
    twoFactorAuth: false,
  },
  branding: {
    themeColor: "#C81E34",
    primaryBanner: "",
    promoBanner: "",
  },
};

function parseAddress(address?: string) {
  if (!address) return { street: "", city: "", state: "", pincode: "" };
  const parts = address.split(",").map((p) => p.trim());
  return {
    street: parts[0] || address,
    city: parts[1] || "",
    state: parts[2] || "",
    pincode: parts[3] || "",
  };
}

function mapProfileToSettings(profile: Record<string, unknown>, user?: { full_name?: string; email?: string }): SettingsState {
  const hours = profile.opening_hours;
  const cuisine = profile.cuisine_types;
  let cuisineType = "";
  if (Array.isArray(cuisine)) cuisineType = cuisine.join(", ");
  else if (typeof cuisine === "string") cuisineType = cuisine;

  let workingHours = DEFAULT_HOURS;
  if (Array.isArray(hours) && hours.length) {
    workingHours = hours as WorkingDay[];
  }

  const addr = parseAddress(profile.address as string | undefined);

  return {
    ...EMPTY_SETTINGS,
    profile: {
      logo: (profile.logo_url as string) || (profile.image_url as string) || RESTAURANT_FALLBACK,
      cover: (profile.banner_url as string) || RESTAURANT_FALLBACK,
      restaurantName: (profile.name as string) || "",
      ownerName: user?.full_name || "",
      email: user?.email || "",
      phone: (profile.phone as string) || "",
      description: (profile.description as string) || "",
      cuisineType,
    },
    address: addr,
    workingHours,
    delivery: {
      radius: Number(profile.delivery_radius_km || 5),
      minOrderAmount: Number(profile.min_order_amount || 200),
      estimatedTime: Number(profile.estimated_delivery_time || 30),
      acceptOnlineOrders: profile.is_active !== false,
      acceptPickupOrders: true,
    },
  };
}

export default function PartnerSettingsPage() {
  const { data: profile } = usePartnerProfile();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [settings, setSettings] = useState<SettingsState>(EMPTY_SETTINGS);
  const [baseline, setBaseline] = useState<SettingsState>(EMPTY_SETTINGS);
  const [saving, setSaving] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    if (!profile || loaded.current) return;
    let user: { full_name?: string; email?: string } | undefined;
    try {
      user = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      user = undefined;
    }
    const mapped = mapProfileToSettings(profile as Record<string, unknown>, user);
    setSettings(mapped);
    setBaseline(mapped);
    loaded.current = true;
  }, [profile]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(baseline);
  }, [settings, baseline]);

  const updateSection = (section: keyof SettingsState, data: Partial<SettingsState[keyof SettingsState]>) => {
    setSettings((prev) => ({ ...prev, [section]: { ...(prev[section] as object), ...data } }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const address = [
        settings.address.street,
        settings.address.city,
        settings.address.state,
        settings.address.pincode,
      ]
        .filter(Boolean)
        .join(", ");

      await updatePartnerProfile({
        name: settings.profile.restaurantName,
        description: settings.profile.description,
        phone: settings.profile.phone,
        address,
        logo_url: settings.profile.logo,
        banner_url: settings.profile.cover,
        image_url: settings.profile.logo,
        estimated_delivery_time: settings.delivery.estimatedTime,
        delivery_radius_km: settings.delivery.radius,
        opening_hours: settings.workingHours,
        cuisine_types: settings.profile.cuisineType
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        is_active: settings.delivery.acceptOnlineOrders,
        min_order_amount: settings.delivery.minOrderAmount,
      });
      setBaseline(settings);
      mutate("/api/partner/profile");
      mutate("/api/partner/dashboard");
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(baseline);
  };

  const renderSection = () => {
    switch (activeTab) {
      case "profile":
        return <RestaurantProfile data={settings.profile} onChange={(d) => updateSection("profile", d)} />;
      case "address":
        return <BusinessAddress data={settings.address} onChange={(d) => updateSection("address", d)} />;
      case "hours":
        return (
          <WorkingHours
            data={settings.workingHours}
            onChange={(d) =>
              setSettings((prev) => ({
                ...prev,
                workingHours: d.workingHours || prev.workingHours,
              }))
            }
          />
        );
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
    <div className="min-h-screen bg-[#F8FAFC] flex selection:bg-[#E23744] selection:text-white">
      
      <div className="hidden lg:block w-64 flex-shrink-0">
        <PartnerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        <PartnerHeader />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-6xl mx-auto pb-32">
            
            <SettingsHeader />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              <div className="w-full md:w-auto md:sticky top-4">
                <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>

              <div className="flex-1 w-full bg-[#FFFFFF] rounded-3xl p-6 md:p-8 border border-[#E5E7EB] shadow-2xl relative overflow-hidden min-h-[600px]">
                
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E23744]/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

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

      <SettingsActionBar 
        isVisible={hasChanges} 
        onSave={saving ? () => undefined : handleSave} 
        onReset={handleReset} 
        onCancel={handleReset} 
      />

    </div>
  );
}
