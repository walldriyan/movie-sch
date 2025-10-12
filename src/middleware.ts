import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
  const isHomePage = nextUrl.pathname === '/';

  // If logged in and trying to access login/register, redirect to home
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  // If on the home page without filters, rewrite to the URL with default filters.
  // Using rewrite() keeps the URL clean ('/') in the user's address bar.
  if (isHomePage && (!nextUrl.searchParams.has('timeFilter') || !nextUrl.searchParams.has('sortBy'))) {
     const url = nextUrl.clone();
     url.searchParams.set('timeFilter', 'all');
     url.searchParams.set('sortBy', 'updatedAt-desc');
     return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!api/register|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
