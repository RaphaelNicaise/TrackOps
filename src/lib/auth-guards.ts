import { auth } from "@/auth";
import { db } from "@/db";
import { vehicles, choferes, sitios, viajes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/api-error";
import { getEffectiveTenantContext } from "@/lib/impersonation";

export interface SessionUser {
  id: string;
  role?: string;
  empresaId?: number;
  email?: string;
  name?: string;
}

export async function requireAuthUser(customSession?: any): Promise<SessionUser> {
  const session = customSession !== undefined ? customSession : await auth();
  if (!session?.user?.id) {
    throw new AppError("UNAUTHORIZED", "No autorizado: iniciá sesión", 401);
  }
  return session.user as SessionUser;
}

export async function getEffectiveEmpresaId(customSession?: any): Promise<number> {
  const session = customSession !== undefined ? customSession : await auth();
  if (!session?.user) {
    throw new AppError("UNAUTHORIZED", "No autorizado: iniciá sesión", 401);
  }

  // 1. Direct tenant id in session
  if (typeof session.user.empresaId === "number" && session.user.empresaId > 0) {
    return session.user.empresaId;
  }

  // 2. Superadmin impersonation context
  const isSuperAdmin =
    session.user.role === "SUPER_ADMIN" ||
    session.user.email === "superadmin@trackops.com" ||
    session.user.email === "admin@test.com";

  if (isSuperAdmin) {
    try {
      const tenantContext = await getEffectiveTenantContext();
      if (tenantContext?.empresaId && tenantContext.empresaId > 0) {
        return tenantContext.empresaId;
      }
    } catch {
      // Ignorar error al leer cookies si corre en entorno sin headers
    }
  }

  throw new AppError(
    "UNAUTHORIZED",
    "No autorizado: falta especificar o ingresar a una empresa válida",
    401
  );
}

export async function requireVehicleOwnership(vehicleId: number, empresaId: number) {
  if (!vehicleId || isNaN(vehicleId) || vehicleId <= 0) {
    throw new AppError("VALIDATION_ERROR", "ID de vehículo inválido", 400);
  }

  const [vehicle] = await db
    .select()
    .from(vehicles)
    .where(and(eq(vehicles.id, vehicleId), eq(vehicles.empresaId, empresaId)))
    .limit(1);

  if (!vehicle) {
    throw new AppError("NOT_FOUND", "Vehículo no encontrado o no pertenece a tu empresa", 404);
  }

  return vehicle;
}

export async function requireChoferOwnership(choferId: number, empresaId: number) {
  if (!choferId || isNaN(choferId) || choferId <= 0) {
    throw new AppError("VALIDATION_ERROR", "ID de chofer inválido", 400);
  }

  const [chofer] = await db
    .select()
    .from(choferes)
    .where(and(eq(choferes.id, choferId), eq(choferes.empresaId, empresaId)))
    .limit(1);

  if (!chofer) {
    throw new AppError("NOT_FOUND", "Chofer no encontrado o no pertenece a tu empresa", 404);
  }

  return chofer;
}

export async function requireSitioOwnership(sitioId: number, empresaId: number) {
  if (!sitioId || isNaN(sitioId) || sitioId <= 0) {
    throw new AppError("VALIDATION_ERROR", "ID de sitio inválido", 400);
  }

  const [sitio] = await db
    .select()
    .from(sitios)
    .where(and(eq(sitios.id, sitioId), eq(sitios.empresaId, empresaId)))
    .limit(1);

  if (!sitio) {
    throw new AppError("NOT_FOUND", "Sitio no encontrado o no pertenece a tu empresa", 404);
  }

  return sitio;
}

export async function requireViajeOwnership(viajeId: number, empresaId: number) {
  if (!viajeId || isNaN(viajeId) || viajeId <= 0) {
    throw new AppError("VALIDATION_ERROR", "ID de viaje inválido", 400);
  }

  const [viaje] = await db
    .select()
    .from(viajes)
    .where(and(eq(viajes.id, viajeId), eq(viajes.empresaId, empresaId)))
    .limit(1);

  if (!viaje) {
    throw new AppError("NOT_FOUND", "Viaje no encontrado o no pertenece a tu empresa", 404);
  }

  return viaje;
}
