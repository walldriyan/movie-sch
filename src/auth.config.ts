import type { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

import { permissions, ROLES } from "@/lib/permissions"

const prisma = new PrismaClient()

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)

        if (!isValidPassword) {
          return null
        }

        return user
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }: { session: any, token: any }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.permissions = token.permissions
      }
      return session
    },
    async jwt({ token, user }: { token: any, user?: any }) {
      if (user) {
        token.id = user.id
        const userRole = user.role || ROLES.USER;
        token.role = userRole;
        token.permissions = permissions[userRole] || [];
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Custom error page
  },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig;
