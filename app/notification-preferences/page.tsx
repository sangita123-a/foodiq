"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NotificationSettings from "@/components/settings/sections/NotificationSettings";

/**
 * Dedicated notification preferences page.
 * Also available under Settings → Notification Preferences.
 */
export default function NotificationPreferencesPage() {
  return (
    <main className="min-h-screen bg-[#FFFFFF] relative selection:bg-[var(--color-primary)] selection:text-white pt-[90px]">
      <Navbar />
      <div className="container mx-auto px-4 md:px-8 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827]">Notification Preferences</h1>
          <p className="text-[#6B7280] mt-2">
            Manage email, SMS, push, and marketing preferences for your Foodiq account.
          </p>
        </div>
        <NotificationSettings />
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            form="settings-form"
            className="bg-primary hover:bg-[#E76F0B] text-white px-8 py-3 rounded-xl font-bold transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
