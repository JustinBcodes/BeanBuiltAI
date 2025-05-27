import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import NextAuth from "next-auth";

// Define our custom user type
interface CustomUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  hasCompletedOnboarding?: boolean;
}

declare module 'next-auth' {
  interface Session {
    user: CustomUser;
  }
  interface User extends CustomUser {}
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string; // Or sub for subject
    hasCompletedOnboarding?: boolean;
    accessToken?: string; // If you store access tokens
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Basic check, can be expanded (e.g., allow only specific domains)
      if (!user.email) {
        return false;
      }
      // Potentially link account or perform other actions here if needed on first sign-in
      return true;
    },
    async jwt({ token, user, trigger, session: clientSession }) {
      // Initial sign-in - fetch hasCompletedOnboarding from database
      if (user && user.id) {
        token.id = user.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { hasCompletedOnboarding: true },
          });
          token.hasCompletedOnboarding = !!dbUser?.hasCompletedOnboarding;
        } catch (error) {
          console.error("Error fetching user onboarding status:", error);
          token.hasCompletedOnboarding = false;
        }
      }

      // Handle session updates (e.g., after onboarding completion)
      if (trigger === "update" && token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { hasCompletedOnboarding: true },
          });
          if (dbUser) {
            token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
          }
        } catch (error) {
          console.error("Error updating user onboarding status in JWT:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      session.user.hasCompletedOnboarding = token.hasCompletedOnboarding ?? false;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Let middleware handle routing decisions instead of forcing /dashboard
      // This prevents the redirect loop
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error',   // Custom error page (e.g., for handling auth errors)
    // verifyRequest: '/auth/verify-request', // For email provider, if you add one
    // newUser: '/auth/new-user' // If you want a custom new user page (can be /onboarding)
  },
  debug: true, // Enable debug logging to troubleshoot auth issues
  secret: process.env.NEXTAUTH_SECRET as string,
}; 