import NextAuth, { type DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      role: string;
      empresaId?: number;
      mustChangePassword?: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    empresaId?: number | null;
    mustChangePassword?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    empresaId?: number;
    mustChangePassword?: number;
  }
}
