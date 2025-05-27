import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

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
    async session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      session.user.hasCompletedOnboarding = token.hasCompletedOnboarding ?? false;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.hasCompletedOnboarding = user.hasCompletedOnboarding ?? false;
      }
      return token;
    },
    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },
  debug: true,
};

// ✅ Correct export format (no export of `authOptions`)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 