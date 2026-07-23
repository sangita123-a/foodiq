import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applySecurityHeaders, getSecurityHeadersOptions } from "@/lib/security/headers";
import { normalizePath } from "@/lib/seo/urls";

export const runtime = "experimental-edge";

// Define which routes require authentication
const protectedRoutes = [
  "/profile",
  "/checkout",
  "/payment",
  "/order-success",
  "/cart",
  "/my-orders",
  "/settings",
  "/notifications",
  "/saved-addresses",
  "/payment-methods",
  "/coupons-rewards",
  "/coupons",
  "/my-rewards",
  "/my-wallet",
  "/help-and-support",
  "/help-support",
  "/track-order",
  "/payment-support",
  "/report-problem",
  "/email-support",
  "/partner/dashboard",
  "/partner/menu",
  "/partner/orders",
  "/partner/kitchen",
  "/partner/inventory",
  "/partner/recipes",
  "/partner/suppliers",
  "/partner/inventory-reports",
  "/partner/order-history",
  "/partner/earnings",
  "/partner/analytics",
  "/partner/customers",
  "/partner/reviews",
  "/partner/support",
  "/partner/offers",
  "/partner/settings",
  "/admin/dashboard",
  "/admin/restaurants",
  "/admin/users",
  "/admin/delivery-partners",
  "/admin/orders",
  "/admin/menu",
  "/admin/coupons",
  "/admin/payments",
  "/admin/wallet",
  "/admin/analytics",
  "/admin/notifications",
  "/admin/push-notifications",
  "/admin/settings",
  "/admin/contact-settings",
  "/admin/live",
  "/admin/monitoring",
  "/admin/bi",
  "/admin/ai",
  "/admin/fleet",
  "/admin/feedback",
  "/admin/bugs",
  "/admin/maintenance",
  "/admin/media",
  "/admin/marketing",
  "/admin/cms",
  "/admin/reports",
  "/admin/security",
  "/admin/loyalty",
  "/admin/support",
  "/admin/tickets",
  "/admin/inventory",
  "/rewards",
  "/payment/failed",
  "/delivery/dashboard",
  "/delivery/orders",
  "/delivery/map",
  "/delivery/earnings",
  "/delivery/wallet",
  "/delivery/profile",
  "/delivery/history",
  "/delivery/documents",
  "/delivery/reviews",
  "/delivery/analytics",
  "/delivery/notifications",
];

// Define which routes should redirect away if already authenticated
const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/partner/login",
  "/admin/login",
  "/delivery/login",
  "/delivery/register",
  "/delivery/forgot-password",
];

function applySeoHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const { pathname, searchParams } = request.nextUrl;

  applySecurityHeaders(response.headers, getSecurityHeadersOptions());

  if (pathname === "/search" && searchParams.has("q")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const normalizedPath = normalizePath(pathname);
  if (pathname !== normalizedPath) {
    const url = request.nextUrl.clone();
    url.pathname = normalizedPath;
    return applySeoHeaders(request, NextResponse.redirect(url, 308));
  }

  const token =
    request.cookies.get("token")?.value ||
    request.cookies.get("foodiq_session")?.value;

  // Check if it's a protected route
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginPath = pathname.startsWith("/admin")
      ? "/admin/login"
      : pathname.startsWith("/delivery")
        ? "/delivery/login"
        : pathname.startsWith("/partner")
          ? "/partner/login"
          : "/login";
    const loginUrl = new URL(loginPath, request.url);
    // Preserve destination so users return to Help & Support flows after login
    if (loginPath === "/login") {
      const redirectTarget = `${pathname}${request.nextUrl.search || ""}`;
      loginUrl.searchParams.set("redirect", redirectTarget);
    }
    return applySeoHeaders(request, NextResponse.redirect(loginUrl));
  }

  // Check if it's an auth route (login/register)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && token) {
    const homePath = pathname.startsWith("/admin")
      ? "/admin/dashboard"
      : pathname.startsWith("/delivery")
        ? "/delivery/dashboard"
        : pathname.startsWith("/partner")
          ? "/partner/dashboard"
          : "/";
    return applySeoHeaders(
      request,
      NextResponse.redirect(new URL(homePath, request.url))
    );
  }

  return applySeoHeaders(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
