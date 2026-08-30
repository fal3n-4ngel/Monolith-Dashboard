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
  callbacks: {
    // Only identities registered in DASHBOARD_CLIENTS (or the ALLOWED_EMAIL
    // solo-owner fallback) may sign in. `profile.email` comes from Google's
    // signed ID token, so it cannot be spoofed. The proxy re-checks this on
    // every data request and derives the caller's scope there.
    async signIn({ profile }) {
      const registered = clientForEmail(profile?.email);
      if (!registered) {
        console.warn("[auth] denied sign-in for a non-registered identity");
        return false;
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
});
