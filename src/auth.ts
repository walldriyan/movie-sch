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

        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
        
        const debugInfo = {
            step: 'Start Authorization',
            userInput: {
                email,
                password: password ? '******' : 'Not Provided',
            },
            envValues: {
                SUPER_ADMIN_EMAIL: superAdminEmail || 'Not Found in .env',
                SUPER_ADMIN_PASSWORD: superAdminPassword ? '******' : 'Not Found in .env',
            },
            isSuperAdminCheck: {},
            databaseCheck: {},
            result: ''
        };

        if (email === superAdminEmail) {
            debugInfo.step = 'Super Admin Email Match';
            const isPasswordMatch = password === superAdminPassword;
            debugInfo.isSuperAdminCheck = {
                emailMatch: true,
                passwordMatch: isPasswordMatch,
            };
            if (isPasswordMatch) {
              debugInfo.result = 'Success: Super Admin Login';
              return { 
                  id: email, 
                  email: email, 
                  name: 'Super Admin', 
                  role: ROLES.SUPER_ADMIN 
              };
            } else {
              debugInfo.result = 'Failure: Super Admin Password Mismatch';
              throw new Error(JSON.stringify(debugInfo));
            }
        }
        
        debugInfo.step = 'Not Super Admin, Checking Database';
        const user = await prisma.user.findUnique({
          where: { email },
        });
        
        debugInfo.databaseCheck = {
            userFound: !!user,
        };

        if (!user || !user.password) {
          debugInfo.result = 'Failure: User not found in DB or no password set.';
          throw new Error(JSON.stringify(debugInfo));
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        debugInfo.databaseCheck = { ...debugInfo.databaseCheck, passwordMatch: isValidPassword };

        if (!isValidPassword) {
          debugInfo.result = 'Failure: DB user password mismatch.';
          throw new Error(JSON.stringify(debugInfo));
        }
        
        const userRole = user.role === ROLES.SUPER_ADMIN ? ROLES.USER : user.role || ROLES.USER;
        debugInfo.result = 'Success: Database User Login';
        
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
        sameSite: 'none',
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
