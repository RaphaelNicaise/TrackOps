"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { empresas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";

export const IMPERSONATE_COOKIE = "trackops_impersonate_tenant_id";

export interface EffectiveTenantContext {
  empresaId: number | null;
  empresaNombre: string | null;
  isImpersonating: boolean;
  superadminUser: any | null;
}

/**
 * Retrieves the effective tenant context.
 * If current user has SUPER_ADMIN role and the impersonation cookie is present,
 * returns the impersonated company context.
 */
export async function getEffectiveTenantContext(): Promise<EffectiveTenantContext> {
  const session = await auth();
  const cookieStore = cookies();
  const impersonateCookie = cookieStore.get(IMPERSONATE_COOKIE)?.value;

  if (session?.user?.role === "SUPER_ADMIN" && impersonateCookie) {
    const impersonateId = parseInt(impersonateCookie, 10);
    if (!isNaN(impersonateId) && impersonateId > 0) {
      const [empresa] = await db
        .select()
        .from(empresas)
        .where(eq(empresas.id, impersonateId));

      if (empresa) {
        return {
          empresaId: empresa.id,
          empresaNombre: empresa.nombre,
          isImpersonating: true,
          superadminUser: session.user,
        };
      }
    }
  }

  return {
    empresaId: session?.user?.empresaId || null,
    empresaNombre: null,
    isImpersonating: false,
    superadminUser: null,
  };
}

/**
 * Enters a tenant as SuperAdmin in Modo Superpoderes.
 * Sets the impersonation cookie and logs audit action.
 */
export async function enterTenantAsSuperadmin(empresaId: number) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requiere rol SUPER_ADMIN");
  }

  const [empresa] = await db
    .select()
    .from(empresas)
    .where(eq(empresas.id, empresaId));

  if (!empresa) {
    throw new Error(`Empresa con ID ${empresaId} no encontrada`);
  }

  cookies().set(IMPERSONATE_COOKIE, empresa.id.toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  await logAudit("IMPERSONATE", "empresa", empresaId, {
    empresaNombre: empresa.nombre,
    action: "enter_superpoderes",
  });

  revalidatePath("/", "layout");

  return {
    success: true,
    empresaId: empresa.id,
    empresaNombre: empresa.nombre,
  };
}

/**
 * Exits SuperAdmin impersonation mode and clears the cookie.
 */
export async function exitSuperadminImpersonation() {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requiere rol SUPER_ADMIN");
  }

  cookies().delete(IMPERSONATE_COOKIE);

  await logAudit("IMPERSONATE", "empresa", null, {
    action: "exit_superpoderes",
  });

  revalidatePath("/", "layout");

  return { success: true };
}
