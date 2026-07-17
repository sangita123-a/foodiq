"use client";

import { Home, Package, Heart, MapPin, CreditCard, Ticket, Bell, Settings, LogOut, Award } from "lucide-react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/services/api";
import SafeImage from "@/components/ui/SafeImage";
import { AVATAR_FALLBACK } from "@/lib/images";

export type ProfileTab =
  | "Dashboard"
  | "My Orders"
  | "Favorites"
  | "Saved Addresses"
  | "Payment Methods"
  | "Coupons"
  | "Notifications"
  | "Settings";

type Props = {
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
};

const menuItems: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: "Dashboard", label: "Dashboard", icon: <Home className="w-5 h-5" /> },
  { id: "My Orders", label: "My Orders", icon: <Package className="w-5 h-5" /> },
  { id: "Favorites", label: "Favorites", icon: <Heart className="w-5 h-5" /> },
  { id: "Saved Addresses", label: "Saved Addresses", icon: <MapPin className="w-5 h-5" /> },
  { id: "Payment Methods", label: "Payment Methods", icon: <CreditCard className="w-5 h-5" /> },
  { id: "Coupons", label: "Coupons", icon: <Ticket className="w-5 h-5" /> },
  { id: "Notifications", label: "Notifications", icon: <Bell className="w-5 h-5" /> },
  { id: "Settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
];

const DEFAULT_AVATAR = AVATAR_FALLBACK;

export default function ProfileSidebar({ activeTab, setActiveTab }: Props) {
  const router = useRouter();
  const { data: user } = useSWR("/api/profile");

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (_) {}
    Cookies.remove("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="bg-[#F8FAFC] rounded-[24px] border border-[#E5E7EB] overflow-hidden sticky top-[100px]">
      <div className="p-6 md:p-8 flex flex-col items-center border-b border-[#E5E7EB] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FC8019]/5 blur-3xl pointer-events-none"></div>

        <div className="w-24 h-24 rounded-full border-2 border-primary overflow-hidden relative z-10 mb-4 shadow-[0_0_20px_rgba(252,128,25,0.2)]">
          <SafeImage
            src={user?.profile_image_url}
            fallback={DEFAULT_AVATAR}
            alt={user?.full_name || "User"}
            className="w-full h-full object-cover"
          />
        </div>

        <h2 className="text-xl font-bold text-white relative z-10 mb-1">
          {user?.full_name || "Loading..."}
        </h2>
        <p className="text-sm text-[#6B7280] relative z-10 mb-4">{user?.email || ""}</p>

        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-xs font-bold px-3 py-1.5 rounded-full relative z-10 mb-4">
          <Award className="w-4 h-4 fill-yellow-500" />
          Premium Member
        </div>

        <button
          onClick={() => setActiveTab("Settings")}
          className="relative z-10 w-full bg-[#F8FAFC] hover:bg-[#F8FAFC] text-white text-sm font-bold py-2 rounded-xl border border-[#E5E7EB] transition-colors"
        >
          Edit Profile
        </button>
      </div>

      <div className="flex flex-col py-4">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-6 md:px-8 py-3.5 transition-colors relative ${
                isActive
                  ? "text-white font-bold bg-[#F8FAFC]"
                  : "text-[#6B7280] font-medium hover:text-[#111827] hover:bg-[#F8FAFC]"
              }`}
            >
              {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md"></div>}
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-[#E5E7EB]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 md:px-4 py-3.5 w-full text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
