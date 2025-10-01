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

        // Step 1: Check if the user is the Super Admin from .env
        if (email === process.env.SUPER_ADMIN_EMAIL) {
          if (password === process.env.SUPER_ADMIN_PASSWORD) {
            // For the super admin, we find or create them to have a DB record, but the role is supreme.
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  name: 'Super Admin',
                  // We don't store the plaintext password in the DB
                  // A hashed version could be stored, but for this logic, it's not used for auth.
                  password: await bcrypt.hash(password, 12),
                  role: ROLES.SUPER_ADMIN,
                }
              });
            } else if (user.role !== ROLES.SUPER_ADMIN) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { role: ROLES.SUPER_ADMIN }
              });
            }
             return { ...user, id: user.id, role: ROLES.SUPER_ADMIN };
          } else {
            // Email matches super admin, but password doesn't. Deny access immediately.
            return null;
          }
        }

        // Step 2: If not Super Admin, check the database for a regular user
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
        
        // Ensure regular users are not accidentally assigned SUPER_ADMIN role from DB
        const userRole = user.role === ROLES.SUPER_ADMIN ? ROLES.USER : user.role || ROLES.USER;

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
