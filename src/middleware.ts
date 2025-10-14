
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  
  // Use `request.auth` to get the session in middleware
  const session = (request as any).auth;
  const isLoggedIn = !!session?.user;

  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');

  // If logged in and trying to access login/register, redirect to home
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
}

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/login', '/register', '/manage/:path*', '/admin/:path*', '/favorites/:path*'],
};
