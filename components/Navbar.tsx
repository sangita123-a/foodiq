"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu } from "lucide-react";
import api from "@/services/api";
import NotificationBell from "@/components/notifications/NotificationBell";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import MobileDrawer from "@/components/ui/MobileDrawer";
import { clearClientAuth } from "@/lib/authSession";
import { useCartActions } from "@/hooks/useCartActions";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const NAV_LINKS = [
  { href: "/", label: "Home", isActive: (path: string) => path === "/" },
  { href: "/collections", label: "Collections", isActive: (path: string) => path.startsWith("/collections") },
  { href: "/order-online", label: "Restaurants", isActive: (path: string) => path.startsWith("/order-online") || path.startsWith("/restaurant/") || path.startsWith("/restaurants") },
  { href: "/offers", label: "Offers", isActive: (path: string) => path.startsWith("/offers") },
  { href: "/contact", label: "Contact", isActive: (path: string) => path.startsWith("/contact") },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
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
    setMobileOpen(false);
    router.push("/login");
  };

  const { totalQuantity: cartCount } = useCartActions();

  const navMotion = reducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } };

  return (
    <>
      <motion.nav
        {...navMotion}
        className="sticky top-0 left-0 w-full h-[64px] md:h-[72px] lg:h-[80px] z-50 flex items-center justify-between px-3 sm:px-6 lg:px-16 bg-white/90 backdrop-blur-xl border-b border-[#ECECEC]/90 shadow-[0_8px_30px_rgba(28,28,28,0.06)] supports-[backdrop-filter]:bg-white/80 safe-top"
      >
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button
            type="button"
            className="md:hidden touch-target flex items-center justify-center text-[#1C1C1C] p-2 rounded-xl border border-[#ECECEC] bg-white hover:bg-[#F8F9FA] transition-colors shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-[-0.045em] transition-opacity hover:opacity-80 truncate">
            <span className="text-[#1C1C1C]">Food</span>
            <span className="text-[var(--color-primary)]">iq</span>
          </Link>
        </div>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center space-x-7">
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

        {/* Tablet compact nav */}
        <div className="hidden md:flex lg:hidden items-center space-x-4">
          {NAV_LINKS.slice(0, 3).map((link) => {
            const active = link.isActive(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium text-xs relative py-1.5 transition-colors ${
                  active ? "text-[var(--color-primary)]" : "text-[#686B78] hover:text-[#1C1C1C]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Desktop / tablet actions */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-3 shrink-0">
          <Link
            href="/search"
            className="touch-target h-10 w-10 rounded-xl border border-[#ECECEC] bg-white hover:border-[#E23744]/30 hover:bg-[#F8F9FA] text-[#1C1C1C] flex items-center justify-center transition-all"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Link>

          {isLoggedIn && (
            <>
              <Link
                href="/cart"
                className="relative touch-target h-10 w-10 rounded-xl border border-[#ECECEC] bg-white hover:border-[#E23744]/30 hover:bg-[#F8F9FA] text-[#1C1C1C] flex items-center justify-center transition-all"
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

          <InstallAppButton />

          <Link
            href="/order-online"
            className="hidden lg:inline-flex h-9 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm shadow-[0_6px_16px_rgba(226,55,68,0.2)] transition-all items-center"
          >
            Order Online
          </Link>

          <div className="hidden lg:block h-6 w-px bg-[#ECECEC] mx-1" />

          {user ? (
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link
                href="/profile"
                className="text-[#1C1C1C] hover:text-[var(--color-primary)] font-medium text-sm transition-colors max-w-[100px] lg:max-w-[120px] truncate"
              >
                {user.full_name}
              </Link>
              <button
                onClick={handleLogout}
                className="h-10 px-4 lg:px-5 rounded-xl border border-[#ECECEC] hover:border-[#E23744]/30 hover:bg-[#F8F9FA] text-[#1C1C1C] font-medium text-sm transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="h-9 px-3.5 lg:px-5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm transition-all inline-flex items-center"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile quick actions */}
        <div className="flex md:hidden items-center gap-1.5 shrink-0">
          <Link
            href="/search"
            className="touch-target flex h-10 w-10 items-center justify-center rounded-xl border border-[#ECECEC] bg-white text-[#1C1C1C]"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Link>
          {isLoggedIn && (
            <Link
              href="/cart"
              className="relative touch-target flex h-10 w-10 items-center justify-center rounded-xl border border-[#ECECEC] bg-white text-[#1C1C1C]"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </motion.nav>

      {/* Mobile slide drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" side="left" width="w-[min(300px,88vw)]">
        <div className="flex flex-col p-3 gap-0.5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`touch-target flex items-center px-4 py-3 rounded-xl font-medium text-sm ${
                link.isActive(pathname) ? "bg-[#E23744]/10 text-[var(--color-primary)]" : "text-[#686B78] hover:bg-[#F8F9FA] hover:text-[#1C1C1C]"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn && (
            <>
              <Link href="/my-orders" onClick={() => setMobileOpen(false)} className="touch-target flex items-center px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium text-sm">
                My Orders
              </Link>
              <Link href="/favorites" onClick={() => setMobileOpen(false)} className="touch-target flex items-center px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium text-sm">
                Favorites
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="touch-target flex items-center px-4 py-3 rounded-xl text-[#686B78] hover:bg-[#F8F9FA] font-medium text-sm">
                Profile
              </Link>
            </>
          )}

          <div className="border-t border-[#ECECEC] mt-3 pt-3 space-y-2">
            <Link
              href="/order-online"
              onClick={() => setMobileOpen(false)}
              className="touch-target flex items-center justify-center px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm"
            >
              Order Online
            </Link>
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full touch-target px-4 py-3 rounded-xl bg-[#F8F9FA] text-[#1C1C1C] font-medium text-sm"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="block touch-target px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm text-center"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </MobileDrawer>
    </>
  );
}
