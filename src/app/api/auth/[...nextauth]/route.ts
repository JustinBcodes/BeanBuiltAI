import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

// Force this route to be dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
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
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
};

// Export authOptions for use in other API routes
export { authOptions }

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 