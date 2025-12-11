import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { permissions, ROLES } from '@/lib/permissions';
import type { NextAuthConfig, Session, User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import prisma from '@/lib/prisma';

// Extend the built-in types for session and user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      permissions: string[];
      isPro: boolean;
      subscription?: {
        planName?: string;
        endDate?: Date | null;
      };
    } & PrismaUser;
  }

  interface User {
    role: string;
    permissions: string[];
    isPro: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    isPro: boolean;
    subscription?: {
      planName?: string;
      endDate?: Date | null;
    };
  }
}

// Helper to determine if we're running in production
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = !!process.env.VERCEL;

// Get the correct URL for callbacks
const getAuthUrl = () => {
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:9002';
};

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Email/Password credentials
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email as string;
          const password = credentials?.password as string;

          if (!email || !password) {
            console.error('[Auth] Missing email or password');
            return null;
          }

          // =============================================
          // SUPERUSER AUTHENTICATION FROM ENV FILE
          // =============================================
          const superuserEmail = process.env.SUPERUSER_EMAIL;
          const superuserPassword = process.env.SUPERUSER_PASSWORD;

          if (
            superuserEmail &&
            superuserPassword &&
            email === superuserEmail &&
            password === superuserPassword
          ) {
            let dbSuperuser = await prisma.user.findUnique({
              where: { email: superuserEmail },
            });

            if (!dbSuperuser) {
              const hashedPassword = await bcrypt.hash(superuserPassword, 10);
              dbSuperuser = await prisma.user.create({
                data: {
                  email: superuserEmail,
                  name: 'Super Admin',
                  username: 'superadmin',
                  password: hashedPassword,
                  role: 'SUPER_ADMIN',
                  status: 'ACTIVE',
                  emailVerified: new Date(),
                  dailyPostLimit: 1000,
                  bio: 'System Administrator',
                },
              });
            } else if (dbSuperuser.role !== 'SUPER_ADMIN') {
              dbSuperuser = await prisma.user.update({
                where: { email: superuserEmail },
                data: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
              });
            }

            return {
              id: dbSuperuser.id,
              name: dbSuperuser.name || 'Super Admin',
              email: dbSuperuser.email,
              image: dbSuperuser.image,
              role: ROLES.SUPER_ADMIN,
              permissions: permissions[ROLES.SUPER_ADMIN] || [],
              isPro: true
            } as User;
          }

          // =============================================
          // REGULAR USER AUTHENTICATION FROM DATABASE
          // =============================================
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            console.error('[Auth] User not found or no password set');
            return null;
          }

          if (user.status === 'DISABLED' || user.status === 'DELETED') {
            console.error('[Auth] User account is disabled or deleted');
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            console.error('[Auth] Invalid password');
            return null;
          }

          // We fetch subscription later in JWT callback, but can verify basic 'isPro' logic if needed here
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            permissions: permissions[user.role] || [],
            isPro: false // Will be updated in jwt callback
          } as User;
        } catch (error) {
          console.error('[Auth] Authorize error:', error);
          return null;
        }
      },
    }),

    // Google OAuth (Supabase compatible)
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
        GoogleProvider({
          clientId: process.env.AUTH_GOOGLE_ID!,
          clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          authorization: {
            params: {
              prompt: "consent",
              access_type: "offline",
              response_type: "code",
            },
          },
          profile(profile) {
            return {
              id: profile.sub,
              name: profile.name,
              email: profile.email,
              image: profile.picture,
              role: 'USER',
              permissions: permissions['USER'] || [],
              isPro: false,
            };
          },
        }),
      ]
      : []),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.AUTH_SECRET,

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            if (existingUser.status === 'DISABLED' || existingUser.status === 'DELETED') {
              return false;
            }
            user.role = existingUser.role;
            user.permissions = permissions[existingUser.role] || [];
          } else {
            let role = 'USER';
            if (
              process.env.SUPER_ADMIN_EMAIL &&
              user.email === process.env.SUPER_ADMIN_EMAIL
            ) {
              const existingSuperAdmin = await prisma.user.findFirst({
                where: { role: 'SUPER_ADMIN' },
              });
              if (!existingSuperAdmin) {
                role = 'SUPER_ADMIN';
              }
            }
            user.role = role;
            user.permissions = permissions[role] || [];
          }
        }
        return true;
      } catch (error) {
        console.error('[Auth] SignIn callback error:', error);
        return true;
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role || 'USER';
        token.permissions = user.permissions || [];

        try {
          const sub = await prisma.userSubscription.findFirst({
            where: {
              userId: user.id!,
              status: 'ACTIVE',
              endDate: { gt: new Date() }
            },
            include: { plan: true },
            orderBy: { endDate: 'desc' }
          });

          token.isPro = !!sub;
          if (sub) {
            token.subscription = {
              planName: (sub as any).plan?.name,
              endDate: sub.endDate
            };
          }
        } catch (e) {
          token.isPro = false;
        }
      }

      if (trigger === "update" && session) {
        token.role = session.user?.role || token.role;
        token.permissions = session.user?.permissions || token.permissions;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role as any;
        session.user.permissions = token.permissions;
        session.user.isPro = token.isPro;
        session.user.subscription = token.subscription;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/auth',
    error: '/auth',
    newUser: '/',
  },

  events: {
    async signIn({ user, account }) {
      console.log(`[Auth] User signed in: ${user.email}`);
    },
    async signOut(message) {
      console.log(`[Auth] User signed out`);
    },
    async createUser({ user }) {
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE' },
        }).catch(console.error);
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
