import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Protected routes that require authentication
const protectedRoutes = [
  '/manage',
  '/profile/edit',
  '/favorites',
];

// Admin routes - SUPER_ADMIN only
const superAdminRoutes = [
  '/admin',
];

// Get client IP address
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return '127.0.0.1';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Has file extension
  ) {
    return NextResponse.next();
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Simple rate limiting using headers (Edge-compatible)
  const ip = getClientIp(request);
  response.headers.set('X-Client-IP', ip);

  // Check for session cookie
  const sessionCookie = request.cookies.get('authjs.session-token') ||
    request.cookies.get('__Secure-authjs.session-token');

  // Check if route requires SUPER_ADMIN
  const isSuperAdminRoute = superAdminRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isSuperAdminRoute) {
    if (!sessionCookie) {
      // Not logged in - redirect to auth
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get token and check role
    try {
      const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET
      });

      if (!token || token.role !== 'SUPER_ADMIN') {
        // Not authorized - redirect to home
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // Token error - redirect to home
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Check for auth cookie for other protected routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!sessionCookie) {
      // Redirect to login
      const loginUrl = new URL('/auth', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (with extensions)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
