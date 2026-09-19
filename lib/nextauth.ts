import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { clientForEmail } from "@/lib/dashboard-clients";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],
  pages: {
    error: "/unauthorized",
  },
  callbacks: {
    // Only identities in DASHBOARD_CLIENTS (or the ALLOWED_EMAIL fallback) may sign in.
    // The proxies re-check this and derive scope on every request.
    async signIn({ profile }) {
      return clientForEmail(profile?.email) !== null;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
});
