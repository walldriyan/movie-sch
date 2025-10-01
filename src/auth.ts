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

        // Check if the user is the Super Admin from .env
        if (
          process.env.SUPER_ADMIN_EMAIL &&
          email === process.env.SUPER_ADMIN_EMAIL
        ) {
          if (password === process.env.SUPER_ADMIN_PASSWORD) {
            // For the super admin, we can return a user object without hitting the DB
            // Or ensure the super admin exists in the DB
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              // Create the super admin in the database if they don't exist
              user = await prisma.user.create({
                data: {
                  email: process.env.SUPER_ADMIN_EMAIL,
                  name: 'Super Admin',
                  role: ROLES.SUPER_ADMIN,
                  // We don't store the plain password, but a hash.
                  // For simplicity here, but in a real app you might want to hash it
                  // or handle this initial seeding differently.
                  password: await bcrypt.hash(password, 12),
                },
              });
            }
             // We're creating a user object on the fly for the session
            return { ...user, id: user.id, role: ROLES.SUPER_ADMIN };
          }
          return null; // Invalid password for super admin
        }

        // For regular users, check the database
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
        
        // Ensure regular users have a role, default to USER if not set
        const userRole = user.role || ROLES.USER;

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
