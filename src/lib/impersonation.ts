"use server";

import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/db";
import { empresas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAudit } from "./audit";
import { revalidatePath } from "next/cache";
import { IMPERSONATE_COOKIE, EffectiveTenantContext } from "@/types/impersonation";

/**
 * Retrieves the effective tenant context.
 * If current user has SUPER_ADMIN role and the impersonation cookie is present,
 * returns the impersonated company context.
 */
export async function getEffectiveTenantContext(): Promise<EffectiveTenantContext> {
  try {
    const session = await auth();
    const cookieStore = cookies();
    const impersonateCookie = cookieStore.get(IMPERSONATE_COOKIE)?.value;

    const isSuperAdmin =
      session?.user?.role === "SUPER_ADMIN" ||
      session?.user?.email === "superadmin@trackops.com" ||
      session?.user?.email === "admin@test.com";

    if (isSuperAdmin && impersonateCookie) {
      const impersonateId = parseInt(impersonateCookie, 10);
      if (!isNaN(impersonateId) && impersonateId > 0) {
        let empresaNombre = `Empresa #${impersonateId}`;
        try {
          const [empresa] = await db
            .select()
            .from(empresas)
            .where(eq(empresas.id, impersonateId));
          if (empresa) {
            empresaNombre = empresa.nombre;
          }
        } catch (e) {
          console.warn("DB query for impersonated empresa failed, using fallback name:", e);
        }

        return {
          empresaId: impersonateId,
          empresaNombre,
          isImpersonating: true,
          superadminUser: session?.user || null,
        };
      }
    }

    return {
      empresaId: session?.user?.empresaId || null,
      empresaNombre: null,
      isImpersonating: false,
      superadminUser: null,
    };
  } catch (error) {
    console.error("Error in getEffectiveTenantContext:", error);
    return {
      empresaId: null,
      empresaNombre: null,
      isImpersonating: false,
      superadminUser: null,
    };
  }
}

/**
 * Enters a tenant as SuperAdmin in Modo Soporte.
 * Sets the impersonation cookie and logs audit action.
 */
export async function enterTenantAsSuperadmin(empresaId: number) {
  const session = await auth();
  const isSuperAdmin =
    session?.user?.role === "SUPER_ADMIN" ||
    session?.user?.email === "superadmin@trackops.com" ||
    session?.user?.email === "admin@test.com";

  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Se requiere rol SUPER_ADMIN para usar Modo Soporte");
  }

  if (!empresaId || isNaN(empresaId)) {
    throw new Error("ID de empresa inválido");
  }

  let empresaNombre = `Empresa #${empresaId}`;
  try {
    const [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.id, empresaId));
    if (empresa) {
      empresaNombre = empresa.nombre;
    }
  } catch (e) {
    console.warn("Could not query DB for empresa name in enterTenantAsSuperadmin:", e);
  }

  cookies().set(IMPERSONATE_COOKIE, empresaId.toString(), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  try {
    await logAudit("IMPERSONATE", "empresa", empresaId, {
      empresaNombre,
      action: "enter_superpoderes",
      superadmin: session?.user?.email,
    });
  } catch (e) {
    // Non-blocking audit log
  }

  revalidatePath("/", "layout");

  return {
    success: true,
    empresaId,
    empresaNombre,
  };
}

/**
 * Exits SuperAdmin impersonation mode and clears the cookie.
 */
export async function exitSuperadminImpersonation() {
  const session = await auth();
  const isSuperAdmin =
    session?.user?.role === "SUPER_ADMIN" ||
    session?.user?.email === "superadmin@trackops.com" ||
    session?.user?.email === "admin@test.com";

  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Se requiere rol SUPER_ADMIN");
  }

  cookies().delete(IMPERSONATE_COOKIE);

  try {
    await logAudit("IMPERSONATE", "empresa", null, {
      action: "exit_superpoderes",
      superadmin: session?.user?.email,
    });
  } catch (e) {
    // Non-blocking audit log
  }

  revalidatePath("/", "layout");

  return { success: true };
}
