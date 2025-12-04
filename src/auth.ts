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
    } & PrismaUser;
  }

  interface User {
    role: string;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
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
  adapter: PrismaAdapter(prisma),
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

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user || !user.password) {
            console.error('[Auth] User not found or no password set');
            return null;
          }

          // Check user status
          if (user.status === 'DISABLED' || user.status === 'DELETED') {
            console.error('[Auth] User account is disabled or deleted');
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);

          if (!isValidPassword) {
            console.error('[Auth] Invalid password');
            return null;
          }

          console.log(`[Auth] User ${email} authenticated successfully`);

          // Add permissions to the user object
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            permissions: permissions[user.role] || [],
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
            };
          },
        }),
      ]
      : []),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session every day
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.AUTH_SECRET,

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // For OAuth providers, check/create user with proper role
        if (account?.provider === 'google' && user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (existingUser) {
            // Check if user is disabled
            if (existingUser.status === 'DISABLED' || existingUser.status === 'DELETED') {
              console.error('[Auth] OAuth user is disabled or deleted');
              return false;
            }

            // Update user's role and permissions
            user.role = existingUser.role;
            user.permissions = permissions[existingUser.role] || [];
          } else {
            // New user - check if should be super admin
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
        return true; // Allow sign-in but log the error
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id!;
        token.role = user.role || 'USER';
        token.permissions = user.permissions || [];
      }

      // Handle session update
      if (trigger === "update" && session) {
        token.role = session.user?.role || token.role;
        token.permissions = session.user?.permissions || token.permissions;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login', // Error page
    newUser: '/', // New users will be redirected here
  },

  events: {
    async signIn({ user, account }) {
      console.log(`[Auth] User signed in: ${user.email} via ${account?.provider}`);
    },
    async signOut({ token }) {
      console.log(`[Auth] User signed out: ${token?.email}`);
    },
    async createUser({ user }) {
      console.log(`[Auth] New user created: ${user.email}`);

      // Set user status to ACTIVE for OAuth users
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE' },
        }).catch(err => console.error('[Auth] Failed to update new user status:', err));
      }
    },
  },



  debug: process.env.NODE_ENV === 'development',

  trustHost: true, // Important for Vercel deployment
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
