import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';

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
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    // maxAge: 30 * 24 * 60 * 60, // 30 days, example
    // updateAge: 24 * 60 * 60, // 24 hours, example
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
    async jwt({ token, user, account, trigger, session: clientSession }) {
      // Initial sign-in
      if (user && user.id) { // user object is available on initial sign in
        token.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { hasCompletedOnboarding: true },
        });
        token.hasCompletedOnboarding = !!dbUser?.hasCompletedOnboarding;
      }

      // If account is present (e.g., Google OAuth), store access token if needed
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      
      // Handle manual updates to the session (e.g., after onboarding completion)
      if (trigger === "update" && clientSession?.user?.hasCompletedOnboarding !== undefined) {
        const dbUser = await prisma.user.findUnique({
            where: { id: token.id }, // Ensure token.id is set
            select: { hasCompletedOnboarding: true },
        });
        if (dbUser) {
            token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like user id and onboarding status
      if (session.user) {
        if (token.id) session.user.id = token.id;
        if (token.hasCompletedOnboarding !== undefined) {
          session.user.hasCompletedOnboarding = token.hasCompletedOnboarding;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If the URL is relative, make it absolute using the baseUrl
      const absoluteUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;

      // Allow redirects to the base URL or onboarding page initially.
      // More complex logic for post-onboarding redirect can be handled client-side
      // based on session.user.hasCompletedOnboarding.
      if (absoluteUrl.startsWith(baseUrl) || absoluteUrl.startsWith(`${baseUrl}/onboarding`)) {
        return absoluteUrl;
      }
      // If not a safe URL, redirect to dashboard as a default authenticated landing page.
      // This prevents redirects to external sites specified in a callbackUrl, for example.
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page
    error: '/auth/error',   // Custom error page (e.g., for handling auth errors)
    // verifyRequest: '/auth/verify-request', // For email provider, if you add one
    // newUser: '/auth/new-user' // If you want a custom new user page (can be /onboarding)
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET as string,
}; 