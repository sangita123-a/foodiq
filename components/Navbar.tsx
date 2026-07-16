"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { Bell, ShoppingCart, Search, Menu, X } from "lucide-react";
import Cookies from "js-cookie";
import api from "@/services/api";

const NAV_LINKS = [
  { href: "/", label: "Home", isActive: (path: string) => path === "/" },
  { href: "/collections", label: "Collections", isActive: (path: string) => path.startsWith("/collections") },
  { href: "/restaurants", label: "Restaurants", isActive: (path: string) => path.startsWith("/restaurants") || path.startsWith("/restaurant/") },
  { href: "/offers", label: "Offers", isActive: (path: string) => path.startsWith("/offers") },
  { href: "/contact", label: "Contact", isActive: (path: string) => path.startsWith("/contact") },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoggedIn = !!user;

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (_) {}
    Cookies.remove("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const { data: notifData } = useSWR(isLoggedIn ? "/api/notifications" : null, { refreshInterval: 30000 });
  const { data: cartData } = useSWR(isLoggedIn ? "/api/cart" : null);
  const notifications = notifData || [];
  const unreadCount = notifications.filter((n: any) => !n.is_read).length;
  const cartCount = (cartData?.items || []).reduce(
    (sum: number, item: { quantity: number }) => sum + item.quantity,
    0
  );

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute top-0 left-0 w-full h-[90px] z-50 flex items-center justify-between px-4 sm:px-8 lg:px-16 bg-black/50 backdrop-blur-sm border-b border-white/10"
    >
      <Link href="/" className="flex items-center text-2xl sm:text-3xl font-bold tracking-tight">
        <span className="text-white">Food</span>
        <span className="text-[var(--color-primary)]">iq</span>
      </Link>

      <div className="hidden md:flex items-center space-x-8">
        {NAV_LINKS.map((link) => {
          const active = link.isActive(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium relative transition-colors ${
                active ? "text-white" : "text-gray-300 hover:text-white"
              }`}
            >
              {link.label}
              {active && (
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[var(--color-primary)]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="hidden md:flex items-center space-x-3">
        <Link
          href="/search"
          className="h-10 w-10 rounded-full border border-white/20 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </Link>

        {isLoggedIn && (
          <>
            <Link
              href="/cart"
              className="relative h-10 w-10 rounded-full border border-white/20 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/notifications"
              className="relative h-10 w-10 rounded-full border border-white/20 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          </>
        )}

        <Link
          href="/restaurants"
          className="h-10 px-5 rounded-full bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-transform hover:scale-105 active:scale-95 inline-flex items-center"
        >
          Order Online
        </Link>

        <div className="h-6 w-px bg-white/20 mx-1" />

        {user ? (
          <div className="flex items-center space-x-3">
            <Link
              href="/profile"
              className="text-white hover:text-[var(--color-primary)] font-medium text-sm transition-colors max-w-[120px] truncate"
            >
              {user.full_name}
            </Link>
            <button
              onClick={handleLogout}
              className="h-10 px-5 rounded-full border border-white/20 hover:bg-white/10 text-white font-medium text-sm transition-transform hover:scale-105 active:scale-95"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/login">
            <button className="h-10 px-6 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium text-sm transition-transform hover:scale-105 active:scale-95">
              Login
            </button>
          </Link>
        )}
      </div>

      <button
        className="md:hidden text-white p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[90px] left-0 w-full bg-black/95 backdrop-blur-md border-b border-white/10 md:hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl font-medium ${
                    link.isActive(pathname) ? "bg-white/10 text-white" : "text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/search" className="px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-medium">
                Search
              </Link>
              {isLoggedIn && (
                <>
                  <Link href="/cart" className="px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-medium flex items-center justify-between">
                    Cart
                    {cartCount > 0 && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
                    )}
                  </Link>
                  <Link href="/my-orders" className="px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-medium">
                    My Orders
                  </Link>
                  <Link href="/favorites" className="px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-medium">
                    Favorites
                  </Link>
                  <Link href="/profile" className="px-4 py-3 rounded-xl text-gray-300 hover:bg-white/5 font-medium">
                    Profile
                  </Link>
                </>
              )}
              <div className="border-t border-white/10 mt-2 pt-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white font-medium"
                  >
                    Logout
                  </button>
                ) : (
                  <Link href="/login" className="block px-4 py-3 rounded-xl bg-primary text-white font-medium text-center">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
