"use client";

import { useEffect, useState } from "react";
import DeliveryShell from "@/components/delivery/DeliveryShell";
import api from "@/services/api";
import { useToast } from "@/contexts/ToastContext";
import { updateDeliveryProfile } from "@/services/deliveryApi";
import {
  Bell,
  Navigation,
  Shield,
  Bike,
  Save,
  Loader2,
  Lock,
} from "lucide-react";

export default function DeliverySettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "app" | "vehicle" | "security">("notifications");

  // Form states
  const [notifications, setNotifications] = useState({
    orderAlerts: true,
    soundEnabled: true,
    smsUpdates: true,
    emailSummaries: false,
  });

  const [appPreferences, setAppPreferences] = useState({
    mapProvider: "google" as "google" | "osm",
    autoAcceptOrders: false,
    darkMode: false,
    soundVolume: 80,
  });

  const [vehicleInfo, setVehicleInfo] = useState({
    vehicle_type: "bike",
    license_number: "",
    delivery_radius_km: 10,
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await api.get("/api/delivery/me");
        const partner = res.data?.data?.partner || res.data?.data || {};
        if (partner) {
          setVehicleInfo({
            vehicle_type: partner.vehicle_type || "bike",
            license_number: partner.license_number || "",
            delivery_radius_km: partner.delivery_radius_km || 10,
          });
        }
      } catch (err: unknown) {
        console.error("Failed to load settings profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateDeliveryProfile(vehicleInfo);
      showToast("Vehicle settings updated successfully!", "success");
    } catch (err: unknown) {
      console.error("Failed to update settings:", err);
      showToast("Failed to save settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      // Persist preferences in localStorage
      localStorage.setItem("foodiq_delivery_notifications", JSON.stringify(notifications));
      localStorage.setItem("foodiq_delivery_app_prefs", JSON.stringify(appPreferences));
      showToast("App preferences saved successfully!", "success");
    } catch (err: unknown) {
      console.error("Failed to save preferences:", err);
      showToast("Failed to save preferences.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showToast("Please enter current and new password.", "error");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New passwords do not match.", "error");
      return;
    }
    try {
      setPasswordSaving(true);
      await api.post("/api/delivery/reset-password", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      showToast("Password updated successfully!", "success");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Failed to change password.";
      showToast(errorMsg, "error");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <DeliveryShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-border shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Delivery Settings</h1>
            <p className="text-sm text-gray-text mt-1">
              Manage your delivery notifications, navigation preferences, vehicle options, and security.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {[
            { id: "notifications", label: "Notifications & Alerts", icon: Bell },
            { id: "app", label: "App & Navigation", icon: Navigation },
            { id: "vehicle", label: "Vehicle & Radius", icon: Bike },
            { id: "security", label: "Security & Password", icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-button"
                  : "bg-white text-gray-text hover:text-foreground hover:bg-section border border-border"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-border">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="ml-3 font-semibold text-gray-text">Loading settings...</span>
          </div>
        ) : (
          <div>
            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <form onSubmit={handleSavePreferences} className="bg-white p-6 rounded-2xl border border-border space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" /> Notification Settings
                </h2>

                <div className="space-y-4 divide-y divide-border">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="font-bold text-foreground">New Order Push Alerts</p>
                      <p className="text-xs text-gray-text">Receive real-time push notifications when new orders are assigned.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.orderAlerts}
                      onChange={(e) => setNotifications({ ...notifications, orderAlerts: e.target.checked })}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <p className="font-bold text-foreground">Loud Sound Alerts</p>
                      <p className="text-xs text-gray-text">Play sound notification when an incoming delivery request arrives.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.soundEnabled}
                      onChange={(e) => setNotifications({ ...notifications, soundEnabled: e.target.checked })}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <p className="font-bold text-foreground">SMS Shift & Earnings Alerts</p>
                      <p className="text-xs text-gray-text">Receive daily earnings summaries and shift reminders via SMS.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications.smsUpdates}
                      onChange={(e) => setNotifications({ ...notifications, smsUpdates: e.target.checked })}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-button hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Notification Settings
                  </button>
                </div>
              </form>
            )}

            {/* App Preferences Tab */}
            {activeTab === "app" && (
              <form onSubmit={handleSavePreferences} className="bg-white p-6 rounded-2xl border border-border space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" /> App & Navigation Preferences
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">Preferred Map Provider</label>
                    <select
                      value={appPreferences.mapProvider}
                      onChange={(e) => setAppPreferences({ ...appPreferences, mapProvider: e.target.value as "google" | "osm" })}
                      className="w-full p-3 rounded-xl border border-border bg-white font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="google">Google Maps (Live Traffic & Turn-by-Turn)</option>
                      <option value="osm">OpenStreetMap (Lite Map Mode)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="font-bold text-foreground">Auto-Accept Orders (Beta)</p>
                      <p className="text-xs text-gray-text">Automatically accept order offers matching your preferred delivery zone.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={appPreferences.autoAcceptOrders}
                      onChange={(e) => setAppPreferences({ ...appPreferences, autoAcceptOrders: e.target.checked })}
                      className="w-5 h-5 accent-primary rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-button hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save App Preferences
                  </button>
                </div>
              </form>
            )}

            {/* Vehicle & Radius Tab */}
            {activeTab === "vehicle" && (
              <form onSubmit={handleSaveVehicle} className="bg-white p-6 rounded-2xl border border-border space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Bike className="w-5 h-5 text-primary" /> Vehicle & Delivery Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">Vehicle Type</label>
                    <select
                      value={vehicleInfo.vehicle_type}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, vehicle_type: e.target.value })}
                      className="w-full p-3 rounded-xl border border-border bg-white font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="bike">Motorcycle / Scooter</option>
                      <option value="electric_bike">EV Bike / E-Scooter</option>
                      <option value="bicycle">Bicycle</option>
                      <option value="car">Car / Four-wheeler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">Driving License Number</label>
                    <input
                      type="text"
                      value={vehicleInfo.license_number}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, license_number: e.target.value })}
                      placeholder="e.g. KA012023000999"
                      className="w-full p-3 rounded-xl border border-border bg-white font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-1">
                      Max Preferred Delivery Radius (km): {vehicleInfo.delivery_radius_km} km
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="25"
                      value={vehicleInfo.delivery_radius_km}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, delivery_radius_km: Number(e.target.value) })}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-text mt-1">
                      <span>2 km</span>
                      <span>10 km</span>
                      <span>25 km</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-button hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Vehicle Settings
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-border space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" /> Change Password
                </h2>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full p-3 rounded-xl border border-border bg-white font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="w-full p-3 rounded-xl border border-border bg-white font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full p-3 rounded-xl border border-border bg-white font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-button hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </DeliveryShell>
  );
}
