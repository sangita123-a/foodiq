"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Shield, Search, MessageSquare, ChevronDown, Settings, LogOut, User } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import MobileDrawer from "@/components/ui/MobileDrawer";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { clearClientAuth } from "@/lib/authSession";

type AdminHeaderProps = {
  title?: string;
};

const QUICK_NAV: Array<{ match: string[]; href: string }> = [
  { match: ["order", "orders"], href: "/admin/orders" },
  { match: ["restaurant", "restaurants"], href: "/admin/restaurants" },
  { match: ["customer", "customers", "user", "users"], href: "/admin/users" },
  { match: ["delivery partner", "delivery partners", "rider", "riders"], href: "/admin/delivery-partners" },
  { match: ["coupon", "coupons"], href: "/admin/coupons" },
  { match: ["review", "reviews"], href: "/admin/reviews" },
  { match: ["zone", "zones", "delivery zone"], href: "/admin/delivery-zones" },
  { match: ["shift", "shifts"], href: "/admin/shifts" },
  { match: ["support", "ticket", "tickets"], href: "/admin/support-center" },
  { match: ["report", "reports"], href: "/admin/reports" },
  { match: ["setting", "settings"], href: "/admin/settings" },
];

export default function AdminHeader({ title = "Admin Console" }: AdminHeaderProps) {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setAdminName(user.full_name || user.email || "Admin");
      setAdminEmail(user.email || "");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const initial = useMemo(() => adminName.charAt(0).toUpperCase() || "A", [adminName]);

  const handleLogout = () => {
    clearClientAuth();
    router.push("/admin/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    const lower = q.toLowerCase();
    const hit = QUICK_NAV.find((entry) => entry.match.some((m) => lower.includes(m)));
    router.push(hit ? hit.href : `/admin/orders?search=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <div className="h-16 sm:h-20 bg-white/85 backdrop-blur-xl border-b border-border flex items-center justify-between gap-3 px-3 sm:px-4 lg:px-8 sticky top-0 z-30 safe-top">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden touch-target flex items-center justify-center text-gray-text hover:text-foreground p-2 -ml-1 rounded-lg hover:bg-section transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="min-w-0 hidden sm:block">
            <h2 className="text-foreground font-black leading-none text-base sm:text-lg tracking-tight truncate">{title}</h2>
            <p className="text-[#9CA3AF] text-[10px] sm:text-xs mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3 shrink-0" /> Platform administration
            </p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="Search orders, restaurants, customers…"
              className="w-full bg-section border border-transparent rounded-full pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all"
            />
          </div>
        </form>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/admin/support-center"
            className="touch-target hidden sm:flex items-center justify-center text-gray-text hover:text-foreground p-2.5 rounded-full hover:bg-section transition-colors"
            aria-label="Messages"
            title="Support messages"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
          <NotificationBell endpoint="/api/notifications" inboxHref="/admin/notifications" />

          <div className="relative ml-1" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 bg-section rounded-full pl-1.5 pr-2 sm:pr-3 py-1.5 hover:bg-[var(--surface-hover)] transition-colors"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shrink-0 shadow-[var(--shadow-admin-glow)]">
                {initial}
              </div>
              <span className="text-sm font-bold text-foreground hidden sm:block max-w-[100px] truncate">{adminName}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform duration-200 hidden sm:block ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 bg-white border border-border rounded-2xl shadow-[var(--shadow-admin-lifted)] py-2 z-50"
              >
                <div className="px-4 py-2.5 border-b border-border mb-1">
                  <p className="text-sm font-black text-foreground truncate">{adminName}</p>
                  {adminEmail && <p className="text-xs text-gray-text truncate">{adminEmail}</p>}
                </div>
                <Link
                  href="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-foreground hover:bg-section transition-colors"
                  role="menuitem"
                >
                  <Settings className="w-4 h-4 text-[#9CA3AF]" /> Settings
                </Link>
                <Link
                  href="/admin/staff"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-foreground hover:bg-section transition-colors"
                  role="menuitem"
                >
                  <User className="w-4 h-4 text-[#9CA3AF]" /> My Profile
                </Link>
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <MobileDrawer open={sidebarOpen} onClose={() => setSidebarOpen(false)} side="left" width="w-[min(280px,88vw)]">
        <AdminSidebar variant="drawer" onNavigate={() => setSidebarOpen(false)} />
      </MobileDrawer>
    </>
  );
}
