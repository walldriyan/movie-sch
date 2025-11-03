
import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

export async function middleware(request: NextRequest) {
    if (process.env.NODE_ENV === 'development') {
        return NextResponse.next();
    }
    
    const ip = request.ip ?? "127.0.0.1";
    const { success, pending, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
        return new Response("Too Many Requests", { status: 429 });
    }
    
    return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
