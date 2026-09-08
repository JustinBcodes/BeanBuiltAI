import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import './env-validation'; // Validate environment variables on load

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
      // Ensure callback URL includes www subdomain for production
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  // Enhanced cookie configuration for cross-device compatibility
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax", // Critical for mobile and cross-site compatibility
        path: "/",
        secure: process.env.NODE_ENV === 'production', // Only secure in production
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.callback-url`
        : `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Host-next-auth.csrf-token`
        : `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Basic check, can be expanded (e.g., allow only specific domains)
      if (!user.email || (account?.provider === 'google' && !(profile as { email_verified?: boolean } | undefined)?.email_verified)) {
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
      const origin = new URL(process.env.NEXTAUTH_URL || baseUrl).origin;
      try {
        const destination = new URL(url, origin);
        if (destination.origin === origin && !destination.username && !destination.password) return destination.href;
      } catch { /* Invalid callback URLs fall back to the application. */ }
      return origin;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error',   // Custom error page (e.g., for handling auth errors)
    // verifyRequest: '/auth/verify-request', // For email provider, if you add one
    // newUser: '/auth/new-user' // If you want a custom new user page (can be /onboarding)
  },
  // Enhanced debug logging for production troubleshooting
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET as string,
};