"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings } from "lucide-react";
import ProfileSettings from "@/components/settings/sections/ProfileSettings";
import SecuritySettings from "@/components/settings/sections/SecuritySettings";
import NotificationSettings from "@/components/settings/sections/NotificationSettings";
import LanguageRegionSettings from "@/components/settings/sections/LanguageRegionSettings";
import AppearanceSettings from "@/components/settings/sections/AppearanceSettings";
import PrivacySettings from "@/components/settings/sections/PrivacySettings";
import ConnectedDevices from "@/components/settings/sections/ConnectedDevices";
import DeleteAccount from "@/components/settings/sections/DeleteAccount";

type Section =
  | "Profile Settings"
  | "Security"
  | "Notification Preferences"
  | "Language & Region"
  | "Appearance"
  | "Privacy"
  | "Connected Devices"
  | "Delete Account";

const SECTIONS: Section[] = [
  "Profile Settings",
  "Security",
  "Notification Preferences",
  "Language & Region",
  "Appearance",
  "Privacy",
  "Connected Devices",
  "Delete Account",
];

export default function ProfileSettingsPanel() {
  const [active, setActive] = useState<Section>("Profile Settings");

  const render = () => {
    switch (active) {
      case "Profile Settings":
        return <ProfileSettings key="profile" />;
      case "Security":
        return <SecuritySettings key="security" />;
      case "Notification Preferences":
        return <NotificationSettings key="notif" />;
      case "Language & Region":
        return <LanguageRegionSettings key="lang" />;
      case "Appearance":
        return <AppearanceSettings key="appear" />;
      case "Privacy":
        return <PrivacySettings key="privacy" />;
      case "Connected Devices":
        return <ConnectedDevices key="devices" />;
      case "Delete Account":
        return <DeleteAccount key="delete" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-[#171717] rounded-[24px] p-6 border border-white/5 flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-white">Settings</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 flex-shrink-0 bg-[#171717] rounded-2xl border border-white/5 p-3 space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setActive(s)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                active === s
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0 pb-24 relative">
          <AnimatePresence mode="wait">{render()}</AnimatePresence>

          {active !== "Delete Account" && active !== "Security" && active !== "Connected Devices" && (
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="submit"
                form="settings-form"
                className="bg-primary hover:bg-[#e02633] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-[0_0_20px_rgba(255,45,59,0.3)]"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
