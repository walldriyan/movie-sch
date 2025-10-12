import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

// By annotating the request object with the NextAuthRequest type,
// we can get type safety for the `auth` property.
// However, since we are not modifying the auth setup, we can't import NextAuthRequest.
// We'll proceed by using request.auth and letting TypeScript infer its type.

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

  // The problematic redirection logic for the home page has been removed.
  // Default search params are now handled directly in the `src/app/page.tsx` component.

  return NextResponse.next();
}

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!api/register|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
