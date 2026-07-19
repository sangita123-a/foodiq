"use client";

import {
  Home,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Ticket,
  Bell,
  Settings,
  LogOut,
  Shield,
  Lock,
  Award,
} from "lucide-react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import SafeImage from "@/components/ui/SafeImage";
import { AVATAR_FALLBACK } from "@/lib/images";
import { clearClientAuth } from "@/lib/authSession";

export type ProfileTab =
  | "Overview"
  | "My Orders"
  | "Wishlist"
  | "Saved Addresses"
  | "Payment Methods"
  | "Coupons"
  | "Notifications"
  | "Account Settings"
  | "Privacy"
  | "Security";

type Props = {
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
};

const menuItems: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: "Overview", label: "Overview", icon: <Home className="w-5 h-5" /> },
  { id: "My Orders", label: "My Orders", icon: <Package className="w-5 h-5" /> },
  { id: "Wishlist", label: "Wishlist", icon: <Heart className="w-5 h-5" /> },
  { id: "Saved Addresses", label: "Saved Addresses", icon: <MapPin className="w-5 h-5" /> },
  { id: "Payment Methods", label: "Payment Methods", icon: <CreditCard className="w-5 h-5" /> },
  { id: "Coupons", label: "Coupons", icon: <Ticket className="w-5 h-5" /> },
  { id: "Notifications", label: "Notifications", icon: <Bell className="w-5 h-5" /> },
  { id: "Account Settings", label: "Account Settings", icon: <Settings className="w-5 h-5" /> },
  { id: "Privacy", label: "Privacy", icon: <Shield className="w-5 h-5" /> },
  { id: "Security", label: "Security", icon: <Lock className="w-5 h-5" /> },
];

export default function ProfileSidebar({ activeTab, setActiveTab }: Props) {
  const router = useRouter();
  const { data: user } = useSWR("/api/profile");
  const profile = user?.data ?? user;

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (_) {}
    clearClientAuth();
    router.push("/login");
  };

  return (
    <div className="sticky top-[100px] overflow-hidden rounded-[24px] border border-[#E5E7EB] bg-white shadow-sm">
      <div className="relative overflow-hidden border-b border-[#E5E7EB] p-6 md:p-8">
        {profile?.profile_banner_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url('${profile.profile_banner_url}')` }}
          />
        )}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-[#E23744] shadow-md">
            <SafeImage
              src={profile?.profile_image_url}
              fallback={AVATAR_FALLBACK}
              alt={profile?.full_name || "User"}
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="mb-1 text-xl font-bold text-[#222222]">
            {profile?.full_name || "Loading..."}
          </h2>
          <p className="mb-4 text-sm text-[#555555]">{profile?.email || ""}</p>
          <div className="mb-4 flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-600">
            <Award className="h-4 w-4 fill-yellow-500" />
            Premium Member
          </div>
          <button
            onClick={() => setActiveTab("Account Settings")}
            className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] py-2 text-sm font-bold text-[#222222] transition hover:bg-[#ECECEC]"
          >
            Edit Profile
          </button>
        </div>
      </div>

      <div className="flex flex-col py-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-3 px-6 py-3.5 text-left transition-colors md:px-8 ${
                isActive
                  ? "bg-[#FFF5F6] font-bold text-[#E23744]"
                  : "font-medium text-[#555555] hover:bg-[#F8F9FA] hover:text-[#222222]"
              }`}
            >
              {isActive && (
                <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-md bg-[#E23744]" />
              )}
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="border-t border-[#E5E7EB] p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 font-bold text-red-500 transition hover:bg-red-50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
