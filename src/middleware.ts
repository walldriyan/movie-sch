import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit";
import { redis, redisAvailable } from "@/lib/redis";
import { auth } from "@/auth";

// Rate limiter configuration
// Different limits for different route types
const rateLimiters = {
  // General API rate limit
  api: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 requests per minute
    analytics: true,
    prefix: "ratelimit:api",
  }) : null,

  // Stricter limit for auth endpoints
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
    analytics: true,
    prefix: "ratelimit:auth",
  }) : null,

  // General page limit
  page: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "60 s"), // 100 requests per minute
    analytics: true,
    prefix: "ratelimit:page",
  }) : null,
};

// Check if rate limiting is enabled
const isRateLimitingEnabled = () => {
  // Disable in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development') {
    return process.env.ENABLE_RATE_LIMITING === 'true';
  }
  // Enable in production by default unless explicitly disabled
  return process.env.ENABLE_RATE_LIMITING !== 'false';
};

// Get client IP address
function getClientIp(request: NextRequest): string {
  // Vercel specific headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Real IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback
  return request.ip ?? '127.0.0.1';
}

// Determine which rate limiter to use based on path
function getRateLimiter(pathname: string): Ratelimit | null {
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return rateLimiters.auth;
  }
  if (pathname.startsWith('/api')) {
    return rateLimiters.api;
  }
  return rateLimiters.page;
}

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
  '/admin',
  '/manage',
  '/profile/edit',
  '/favorites',
];

// Public routes that don't need auth
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/auth',
  '/movies',
  '/series',
];

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
  let response = NextResponse.next();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Rate limiting (with graceful degradation)
  if (isRateLimitingEnabled() && redisAvailable) {
    const rateLimiter = getRateLimiter(pathname);

    if (rateLimiter) {
      try {
        const ip = getClientIp(request);
        const { success, limit, reset, remaining } = await rateLimiter.limit(ip);

        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', reset.toString());

        if (!success) {
          console.warn(`[Rate Limit] IP ${ip} exceeded limit for ${pathname}`);
          return new NextResponse(
            JSON.stringify({
              error: 'Too Many Requests',
              message: 'Please slow down and try again later.',
              retryAfter: Math.ceil((reset - Date.now()) / 1000),
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
                ...securityHeaders,
              },
            }
          );
        }
      } catch (error) {
        // Log error but don't block the request
        console.error('[Rate Limit] Error:', error);
      }
    }
  }

  // Authentication check for protected routes
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      const session = await auth();

      if (!session?.user) {
        // Redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check admin access
      if (pathname.startsWith('/admin')) {
        const userRole = session.user.role;
        if (!['SUPER_ADMIN', 'USER_ADMIN'].includes(userRole)) {
          console.warn(`[Auth] User ${session.user.email} attempted to access admin route`);
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    } catch (error) {
      console.error('[Middleware] Auth check error:', error);
      // Allow the request but log the error
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
