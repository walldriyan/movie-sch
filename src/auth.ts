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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        let user = await prisma.user.findUnique({
          where: { email },
        });

        // If user doesn't exist and it's the super admin email, create them
        if (!user && email === process.env.SUPER_ADMIN_EMAIL) {
          const hashedPassword = await bcrypt.hash(password, 12);
          user = await prisma.user.create({
            data: {
              email: process.env.SUPER_ADMIN_EMAIL,
              name: 'Super Admin',
              password: hashedPassword,
              role: ROLES.SUPER_ADMIN,
            },
          });
        }

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return null;
        }
        
        // Assign role based on email or existing role
        const userRole = email === process.env.SUPER_ADMIN_EMAIL 
          ? ROLES.SUPER_ADMIN 
          : user.role || ROLES.USER;

        // If the role in DB is different, update it.
        if (user.role !== userRole) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: userRole }
          });
        }

        return { ...user, id: user.id, role: userRole };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  cookies: {
     sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'none',
        secure: true,
      },
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true,
      },
    },
  },
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
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
