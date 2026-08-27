import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-key-trackops-authjs-123456789",
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/panel") || nextUrl.pathname.startsWith("/dashboard");
      const isOnChofer = nextUrl.pathname.startsWith("/chofer");

      if (isOnDashboard || isOnChofer) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Redirect to panel if trying to access auth pages while logged in
        if (nextUrl.pathname.startsWith("/auth")) {
          return Response.redirect(new URL("/panel", nextUrl));
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }: any) {
      if (user) {
        // user object is only passed on initial sign in
        token.role = user.role;
        token.empresaId = user.empresaId ?? undefined;
        token.id = user.id;
        token.mustChangePassword = user.mustChangePassword ?? 0;
      }
      if (trigger === "update" && session) {
        if (typeof session.mustChangePassword === "number") {
          token.mustChangePassword = session.mustChangePassword;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.empresaId = token.empresaId as number | undefined;
          session.user.mustChangePassword = typeof token.mustChangePassword === "number" ? token.mustChangePassword : 0;
        }
      }
      return session;
    },
  },
  providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
