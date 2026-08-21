import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { users, empresas } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

const DEMO_USERS: Record<string, { id: string; name: string; role: string; empresaId?: number }> = {
  "admin@test.com": { id: "admin-id", name: "Admin Demo", role: "SUPER_ADMIN" },
  "empresa@test.com": { id: "empresa-id", name: "Admin Empresa Demo", role: "ADMIN_EMPRESA", empresaId: 1 },
  "chofer@test.com": { id: "chofer-id", name: "Chofer Demo", role: "CHOFER", empresaId: 1 },
  "vendedor@test.com": { id: "vendedor-id", name: "Vendedor/Instalador Demo", role: "VENDEDOR_INSTALADOR", empresaId: 1 },
};

// Los usuarios demo deben existir en la tabla "users" para que las FK
// (ej: shift_logs.user_id -> users.id) no fallen al hacer check-in.
async function getOrCreateDemoUser(email: string) {
  const demo = DEMO_USERS[email];
  if (!demo) return null;

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email));

    if (existing) {
      return {
        id: existing.id,
        email: existing.email,
        name: existing.name ?? demo.name,
        role: existing.role,
        empresaId: existing.empresaId ?? demo.empresaId,
        mustChangePassword: existing.mustChangePassword ?? 0,
      };
    }

    let empresaId = demo.empresaId;
    if (empresaId != null) {
      const [empresa] = await db.select({ id: empresas.id }).from(empresas).where(eq(empresas.id, empresaId));
      if (!empresa) empresaId = undefined;
    }

    await db.insert(users).values({
      id: demo.id,
      email,
      name: demo.name,
      role: demo.role,
      empresaId,
    });

    return {
      ...demo,
      mustChangePassword: 0,
    };
  } catch (e) {
    // Si la BD no está disponible, igual permitimos el login demo
    return {
      ...demo,
      mustChangePassword: 0,
    };
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let user = null;
        try {
          const [foundUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string));
          user = foundUser;
        } catch (e) {
          console.warn("Base de datos no inicializada o tabla 'users' no existe aún. Usando fallback de demostración.");
        }

        if (!user || !user.passwordHash) {
          // Si el usuario no existe o la tabla aún no se creó, permitimos los logins demo de la Fase 1
          return getOrCreateDemoUser(credentials.email as string);
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (passwordsMatch) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            empresaId: user.empresaId,
            mustChangePassword: user.mustChangePassword ?? 0,
          };
        }

        return null;
      },
    }),
  ],
});
