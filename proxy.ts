import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes require authentication
const protectedRoutes = ['/profile', '/checkout', '/payment', '/order-success', '/cart', '/my-orders', '/settings', '/notifications', '/saved-addresses', '/payment-methods', '/favorites', '/coupons-rewards', '/track-order'];

// Define which routes should redirect away if already authenticated
const authRoutes = ['/login', '/register', '/forgot-password'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtected && !token) {
    // Redirect unauthenticated users to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if it's an auth route (login/register)
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  
  if (isAuthRoute && token) {
    // Redirect authenticated users away from login/register to home
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all routes except api, _next/static, _next/image, favicon.ico
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
