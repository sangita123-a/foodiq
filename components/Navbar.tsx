"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import api from "@/services/api";
import NotificationBell from "@/components/notifications/NotificationBell";
import { clearClientAuth } from "@/lib/authSession";
import { useCartActions } from "@/hooks/useCartActions";

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
    clearClientAuth();
    setUser(null);
    router.push("/login");
  };

  const { totalQuantity: cartCount } = useCartActions();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 left-0 w-full h-[80px] z-50 flex items-center justify-between px-4 sm:px-8 lg:px-16 bg-white/90 backdrop-blur-xl border-b border-[#ECECEC]/90 shadow-[0_8px_30px_rgba(28,28,28,0.06)] supports-[backdrop-filter]:bg-white/80"
    >
      <Link href="/" className="flex items-center text-2xl sm:text-3xl font-extrabold tracking-[-0.045em] transition-opacity hover:opacity-80">
        <span className="text-[#1C1C1C]">Food</span>
        <span className="text-[var(--color-primary)]">iq</span>
      </Link>

      <div className="hidden md:flex items-center space-x-7">
        {NAV_LINKS.map((link) => {
          const active = link.isActive(pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`font-medium text-sm relative py-2 transition-colors ${
                active ? "text-[var(--color-primary)]" : "text-[#686B78] hover:text-[#1C1C1C]"
              }`}
            >
              {link.label}
              {active && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-[var(--color-primary)]" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="hidden md:flex items-center space-x-3">
        <Link
          href="/search"
          className="h-10 w-10 rounded-xl border border-[#ECECEC] bg-white hover:border-[#E23744]/30 hover:bg-[#F8F9FA] text-[#1C1C1C] flex items-center justify-center transition-all hover:-translate-y-0.5"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </Link>

        {isLoggedIn && (
          <>
            <Link
              href="/cart"
              className="relative h-10 w-10 rounded-xl border border-[#ECECEC] bg-white hover:border-[#E23744]/30 hover:bg-[#F8F9FA] text-[#1C1C1C] flex items-center justify-center transition-all hover:-translate-y-0.5"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <NotificationBell endpoint="/api/notifications" inboxHref="/notifications" />
          </>
        )}

        <Link
          href="/restaurants"
          className="h-10 px-5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm shadow-[0_6px_16px_rgba(226, 55, 68,0.2)] transition-all hover:-translate-y-0.5 hover:shadow-[0_9px_22px_rgba(226, 55, 68,0.28)] active:translate-y-0 inline-flex items-center"
        >
          Order Online
        </Link>

        <div className="h-6 w-px bg-[#ECECEC] mx-1" />

        {user ? (
          <div className="flex items-center space-x-3">
            <Link
              href="/profile"
              className="text-[#1C1C1C] hover:text-[var(--color-primary)] font-medium text-sm transition-colors max-w-[120px] truncate"
            >
              {user.full_name}
            </Link>
            <button
              onClick={handleLogout}
              className="h-10 px-5 rounded-xl border border-[#ECECEC] hover:border-[#E23744]/30 hover:bg-[#F8F9FA] text-[#1C1C1C] font-medium text-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="h-10 px-6 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm shadow-[0_6px_16px_rgba(226, 55, 68,0.2)] transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center"
          >
            Login
          </Link>
        )}
      </div>

      <button
        className="md:hidden text-[#1C1C1C] p-2.5 rounded-xl border border-[#ECECEC] bg-white hover:bg-[#F8F9FA] transition-colors"
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
            className="absolute top-[80px] left-0 w-full bg-white/95 backdrop-blur-xl border-b border-[#ECECEC] shadow-[0_20px_40px_rgba(28,28,28,0.1)] md:hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-xl font-medium ${
                    link.isActive(pathname) ? "bg-[#E23744]/10 text-[var(--color-primary)]" : "text-[#686B78] hover:bg-[#F8F9FA] hover:text-[#1C1C1C]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/search" className="px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium">
                Search
              </Link>
              {isLoggedIn && (
                <>
                  <Link href="/cart" className="px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium flex items-center justify-between">
                    Cart
                    {cartCount > 0 && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{cartCount}</span>
                    )}
                  </Link>
                  <Link href="/my-orders" className="px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium">
                    My Orders
                  </Link>
                  <Link href="/favorites" className="px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium">
                    Favorites
                  </Link>
                  <Link href="/profile" className="px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium">
                    Profile
                  </Link>
                </>
              )}
              <div className="border-t border-[#ECECEC] mt-2 pt-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#1C1C1C] font-medium"
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
