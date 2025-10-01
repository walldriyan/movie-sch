import NextAuth from 'next-auth';
import { authOptions } from './app/api/auth/[...nextauth]/route';

const { auth } = NextAuth(authOptions as any);

export default auth;

export const config = {
  matcher: ['/manage/:path*', '/profile/:path*'],
};
