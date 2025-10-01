import { auth } from '@/auth.config';

export default auth;

// Optionally, don't invoke Middleware on some paths
// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ['/((?!api/register|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
