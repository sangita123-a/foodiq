"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SettingsHeader from "@/components/settings/SettingsHeader";
import SettingsSidebar, { SettingsSection } from "@/components/settings/SettingsSidebar";

import ProfileSettings from "@/components/settings/sections/ProfileSettings";
import SecuritySettings from "@/components/settings/sections/SecuritySettings";
import NotificationSettings from "@/components/settings/sections/NotificationSettings";
import LanguageRegionSettings from "@/components/settings/sections/LanguageRegionSettings";
import AppearanceSettings from "@/components/settings/sections/AppearanceSettings";
import PrivacySettings from "@/components/settings/sections/PrivacySettings";
import ConnectedDevices from "@/components/settings/sections/ConnectedDevices";
import DeleteAccount from "@/components/settings/sections/DeleteAccount";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("Profile Settings");

  const renderActiveSection = () => {
    switch (activeSection) {
      case "Profile Settings": return <ProfileSettings key="Profile Settings" />;
      case "Security": return <SecuritySettings key="Security" />;
      case "Notification Preferences": return <NotificationSettings key="Notification Preferences" />;
      case "Language & Region": return <LanguageRegionSettings key="Language & Region" />;
      case "Appearance": return <AppearanceSettings key="Appearance" />;
      case "Privacy": return <PrivacySettings key="Privacy" />;
      case "Connected Devices": return <ConnectedDevices key="Connected Devices" />;
      case "Delete Account": return <DeleteAccount key="Delete Account" />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0B0B] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />

      <div className="container mx-auto px-4 md:px-8 py-12 max-w-6xl">
        <SettingsHeader />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          
          <SettingsSidebar 
            activeSection={activeSection} 
            setActiveSection={setActiveSection} 
          />

          <div className="flex-1 min-w-0 pb-32">
            <AnimatePresence mode="wait">
              {renderActiveSection()}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Sticky Save Changes Banner */}
      {activeSection !== "Delete Account" && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#111]/90 backdrop-blur-md border-t border-white/10 p-4 z-50 transform translate-y-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="container mx-auto max-w-6xl px-4 md:px-8 flex items-center justify-between">
            <p className="text-gray-400 font-bold hidden md:block">You have unsaved changes.</p>
            <div className="flex gap-4 w-full md:w-auto">
              <button className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-colors">
                Cancel
              </button>
              <button type="submit" form="settings-form" className="flex-1 md:flex-none bg-primary hover:bg-[#e02633] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)]">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
