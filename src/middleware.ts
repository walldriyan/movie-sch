import NextAuth from 'next-auth';
import { authConfig } from '@/auth';

const { auth } = NextAuth(authConfig);

export default auth;

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!api/register|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
