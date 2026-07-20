import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes require authentication
const protectedRoutes = [
  '/profile',
  '/checkout',
  '/payment',
  '/order-success',
  '/cart',
  '/my-orders',
  '/settings',
  '/notifications',
  '/saved-addresses',
  '/payment-methods',
  '/favorites',
  '/coupons-rewards',
  '/coupons',
  '/my-rewards',
  '/track-order',
  '/partner/dashboard',
  '/partner/menu',
  '/partner/orders',
  '/partner/kitchen',
  '/partner/inventory',
  '/partner/recipes',
  '/partner/suppliers',
  '/partner/inventory-reports',
  '/partner/order-history',
  '/partner/earnings',
  '/partner/analytics',
  '/partner/customers',
  '/partner/reviews',
  '/partner/offers',
  '/partner/settings',
  '/admin/dashboard',
  '/admin/restaurants',
  '/admin/users',
  '/admin/delivery-partners',
  '/admin/orders',
  '/admin/menu',
  '/admin/coupons',
  '/admin/payments',
  '/admin/analytics',
  '/admin/notifications',
  '/admin/settings',
  '/admin/live',
  '/admin/monitoring',
  '/admin/bi',
  '/admin/ai',
  '/admin/fleet',
  '/admin/feedback',
  '/admin/bugs',
  '/admin/maintenance',
  '/admin/media',
  '/admin/marketing',
  '/admin/cms',
  '/admin/reports',
  '/admin/security',
  '/admin/loyalty',
  '/admin/support',
  '/admin/inventory',
  '/rewards',
  '/payment/failed',
  '/delivery/dashboard',
  '/delivery/orders',
  '/delivery/map',
  '/delivery/earnings',
  '/delivery/wallet',
  '/delivery/profile',
  '/delivery/history',
  '/delivery/documents',
  '/delivery/reviews',
  '/delivery/analytics',
  '/delivery/notifications',
];

// Define which routes should redirect away if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password', '/partner/login', '/admin/login', '/delivery/login', '/delivery/register', '/delivery/forgot-password'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value || request.cookies.get('foodiq_session')?.value;
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtected && !token) {
    const loginPath = pathname.startsWith('/admin')
      ? '/admin/login'
      : pathname.startsWith('/delivery')
        ? '/delivery/login'
        : pathname.startsWith('/partner')
          ? '/partner/login'
          : '/login';
    return NextResponse.redirect(new URL(loginPath, request.url));
  }

  // Check if it's an auth route (login/register)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  if (isAuthRoute && token) {
    const homePath = pathname.startsWith('/admin')
      ? '/admin/dashboard'
      : pathname.startsWith('/delivery')
        ? '/delivery/dashboard'
        : pathname.startsWith('/partner')
          ? '/partner/dashboard'
          : '/';
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
