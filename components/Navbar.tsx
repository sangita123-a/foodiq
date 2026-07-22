"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { ShoppingCart, Search, Menu } from "lucide-react";
import api from "@/services/api";
import InstallAppButton from "@/components/pwa/InstallAppButton";
import { clearClientAuth } from "@/lib/authSession";
import { useCartActions } from "@/hooks/useCartActions";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

const NotificationBell = dynamic(
  () => import("@/components/notifications/NotificationBell"),
  { ssr: false, loading: () => null }
);

const MobileDrawer = dynamic(() => import("@/components/ui/MobileDrawer"), {
  ssr: false,
  loading: () => null,
});

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

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={`sticky top-0 left-0 w-full z-50 flex items-center justify-between bg-white/95 backdrop-blur-xl border-b border-border shadow-nav supports-[backdrop-filter]:bg-white/90 safe-top max-md:h-14 max-md:px-3 md:h-[72px] md:px-6 lg:h-[80px] lg:px-16 ${
          reducedMotion ? "" : "nav-enter-motion"
        }`}
      >
        <Link href="/" className="touch-target flex items-center font-extrabold tracking-[-0.045em] text-foreground transition-opacity hover:opacity-80 truncate py-1 min-w-0 shrink max-md:text-base md:text-2xl lg:text-3xl">
          Foodiq
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center space-x-7">
          {NAV_LINKS.map((link) => {
            const active = link.isActive(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`font-medium text-sm relative py-2 transition-colors ${
                  active ? "text-foreground font-semibold" : "text-gray-text hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 rounded-full bg-foreground" />
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
                aria-current={active ? "page" : undefined}
                className={`font-medium text-sm relative py-2.5 px-1 touch-target inline-flex items-center transition-colors ${
                  active ? "text-foreground font-semibold" : "text-gray-text hover:text-foreground"
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
            className="touch-target h-10 w-10 rounded-xl border border-border bg-white hover:border-border hover:bg-section text-foreground flex items-center justify-center transition-all"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Link>

          {isLoggedIn && (
            <>
              <Link
                href="/cart"
                className="relative touch-target h-10 w-10 rounded-xl border border-border bg-white hover:border-border hover:bg-section text-foreground flex items-center justify-center transition-all"
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
            className="hidden lg:inline-flex h-9 px-4 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all items-center"
          >
            Order Online
          </Link>

          <div className="hidden lg:block h-6 w-px bg-border mx-1" />

          {user ? (
            <div className="flex items-center space-x-2 lg:space-x-3">
              <Link
                href="/profile"
                className="text-foreground hover:text-foreground font-medium text-sm transition-colors max-w-[100px] lg:max-w-[120px] truncate"
              >
                {user.full_name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="h-10 px-4 lg:px-5 rounded-xl border border-border hover:border-border hover:bg-section text-foreground font-medium text-sm transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="h-10 px-3.5 lg:px-5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold text-sm transition-all inline-flex items-center"
            >
              Login
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-1 shrink-0">
          <Link
            href="/search"
            className="touch-target flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Link>
          <Link
            href="/cart"
            className="relative touch-target flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--color-primary)] text-white text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-0.5">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="touch-target flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-white text-foreground"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Mobile slide drawer */}
      {mobileOpen ? (
        <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} title="Menu" side="left" width="w-[min(300px,88vw)]">
          <div className="flex flex-col p-3 gap-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={link.isActive(pathname) ? "page" : undefined}
                className={`touch-target flex items-center px-4 py-3 rounded-xl font-medium text-sm ${
                  link.isActive(pathname) ? "bg-section text-foreground font-semibold" : "text-gray-text hover:bg-section hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isLoggedIn && (
              <>
                <Link href="/my-orders" onClick={() => setMobileOpen(false)} className="touch-target flex items-center px-4 py-3 rounded-xl text-gray-text hover:bg-section font-medium text-sm">
                  My Orders
                </Link>
                <Link href="/favorites" onClick={() => setMobileOpen(false)} className="touch-target flex items-center px-4 py-3 rounded-xl text-gray-text hover:bg-section font-medium text-sm">
                  Favorites
                </Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="touch-target flex items-center px-4 py-3 rounded-xl text-gray-text hover:bg-section font-medium text-sm">
                  Profile
                </Link>
              </>
            )}

            <div className="border-t border-border mt-3 pt-3 space-y-2">
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
                  className="w-full touch-target px-4 py-3 rounded-xl bg-section text-foreground font-medium text-sm"
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
      ) : null}
    </>
  );
}
