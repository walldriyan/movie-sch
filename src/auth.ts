import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { permissions, ROLES } from '@/lib/permissions';
import type { NextAuthConfig } from 'next-auth';

const prisma = new PrismaClient();

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) {
            return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return null;
        }
        
        return user;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const userRole = (user as any).role || ROLES.USER;
        token.role = userRole;
        token.permissions = permissions[userRole] || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
     // The authorized callback is used to protect pages
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
      const isProtectedPage = nextUrl.pathname.startsWith('/manage') || nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/favorites');

      if (isAuthPage) {
        if (isLoggedIn) {
          // If a logged-in user tries to access login/register, redirect them to the home page.
          return Response.redirect(new URL('/', nextUrl));
        }
        // Allow unauthenticated users to access auth pages
        return true;
      }

      if (isProtectedPage) {
         // If the user is not logged in, redirect them to the login page.
        return isLoggedIn;
      }
      
      // Allow access to all other pages by default
      return true;
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
