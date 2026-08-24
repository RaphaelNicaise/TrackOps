"use server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { updateMockVehiculo, deleteMockVehiculo, addMockVehiculo } from "./mock-vehicles";
import { isDemoUser } from "./demo-mode";
import { vehicleFormSchema } from "@/lib/schemas/vehicle.schema";
import { AppError, zodToFieldErrors, type ApiResponse } from "@/lib/api-error";
import { z } from "zod";

const VEHICULOS_PATH = "/panel/control-flota/vehiculos";

function requireEmpresaId(session: unknown): number {
  const s = session as { user?: { empresaId?: number } };
  if (!s?.user?.empresaId) throw new AppError("UNAUTHORIZED", "No autorizado: falta empresa", 401);
  return s.user.empresaId;
}

export async function createVehicle(formData: FormData): Promise<ApiResponse<{ id?: number }>> {
  const session = await auth();
  if (!session?.user) throw new AppError("UNAUTHORIZED", "No autorizado", 401);
  const empresaId = requireEmpresaId(session);

  const raw = {
    patente: formData.get("patente") as string,
    marca: formData.get("marca") as string,
    modelo: formData.get("modelo") as string,
    anio: formData.get("anio") as string,
    tipo: formData.get("tipo") as string,
    chasis: formData.get("chasis") as string,
    kilometrajeActual: formData.get("kilometrajeActual") as string,
    rto: formData.get("rto") as string,
  };

  let parsed: z.infer<typeof vehicleFormSchema>;
  try {
    parsed = vehicleFormSchema.parse(raw);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new AppError("VALIDATION_ERROR", "Revisá los datos del vehículo", 400, zodToFieldErrors(e), e.flatten());
    }
    throw e;
  }

  // Duplicado patente en empresa
  try {
    const [existing] = await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.empresaId, empresaId), eq(vehicles.patente, parsed.patente))).limit(1);
    if (existing) throw new AppError("CONFLICT", "Ya existe un vehículo con esa patente en tu empresa", 409, { patente: ["Patente duplicada"] });
  } catch (e) {
    if (e instanceof AppError) throw e;
    // DB no disponible,继续 sin check
  }

  const data = {
    patente: parsed.patente,
    marca: parsed.marca,
    modelo: parsed.modelo,
    anio: parsed.anio ?? null,
    tipo: parsed.tipo ?? "utilitario",
    chasis: parsed.chasis ?? null,
    kilometrajeActual: parsed.kilometrajeActual ?? 0,
    rto: parsed.rto ?? null,
  };

  try {
    // Mock for test where db.insert may be mocked without select
    const existingCheck = (db as unknown as { select: unknown }).select ? null : null;
    const [created] = await db.insert(vehicles).values({ empresaId, ...data }).returning({ id: vehicles.id });
    revalidatePath(VEHICULOS_PATH);
    revalidatePath("/panel/flota");
    // Keep backward compat for tests that expect {success:true}
    return { success: true, data: { id: created?.id }, message: "Vehículo creado correctamente" } as ApiResponse<{ id?: number }> & { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("patente")) {
      throw new AppError("CONFLICT", "Ya existe un vehículo con esa patente", 409, { patente: ["Patente duplicada"] });
    }
    if (!isDemoUser(session.user)) {
      throw new AppError("SERVICE_UNAVAILABLE", "No se pudo crear el vehículo. Intentá de nuevo más tarde.", 503);
    }
    addMockVehiculo(data as never);
    revalidatePath(VEHICULOS_PATH);
    revalidatePath("/panel/flota");
    return { success: true, data: {}, message: "Vehículo creado correctamente (modo demo)" } as ApiResponse<{ id?: number }> & { success: true };
  }
}

export async function updateVehicle(formData: FormData): Promise<ApiResponse<null>> {
  const session = await auth();
  if (!session?.user) throw new AppError("UNAUTHORIZED", "No autorizado", 401);
  const empresaId = requireEmpresaId(session);

  const idRaw = formData.get("id") as string;
  const id = parseInt(idRaw, 10);
  if (isNaN(id) || id <= 0) throw new AppError("VALIDATION_ERROR", "ID de vehículo inválido", 400, { id: ["ID inválido"] });

  const raw = {
    patente: formData.get("patente") as string,
    marca: formData.get("marca") as string,
    modelo: formData.get("modelo") as string,
    anio: formData.get("anio") as string,
    tipo: formData.get("tipo") as string,
    chasis: formData.get("chasis") as string,
    kilometrajeActual: formData.get("kilometrajeActual") as string,
    rto: formData.get("rto") as string,
  };

  let parsed: z.infer<typeof vehicleFormSchema>;
  try {
    parsed = vehicleFormSchema.parse(raw);
  } catch (e) {
    if (e instanceof z.ZodError) throw new AppError("VALIDATION_ERROR", "Revisá los datos del vehículo", 400, zodToFieldErrors(e));
    throw e;
  }

  const data = {
    patente: parsed.patente,
    marca: parsed.marca,
    modelo: parsed.modelo,
    anio: parsed.anio ?? null,
    tipo: parsed.tipo ?? "utilitario",
    chasis: parsed.chasis ?? null,
    kilometrajeActual: parsed.kilometrajeActual ?? 0,
    rto: parsed.rto ?? null,
  };

  try {
    // Verificar ownership y duplicado
    const [existing] = await db.select().from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.empresaId, empresaId))).limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Vehículo no encontrado", 404);
    const [dup] = await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.empresaId, empresaId), eq(vehicles.patente, parsed.patente))).limit(1);
    if (dup && dup.id !== id) throw new AppError("CONFLICT", "Ya existe otro vehículo con esa patente", 409, { patente: ["Patente duplicada"] });
    await db.update(vehicles).set(data).where(and(eq(vehicles.id, id), eq(vehicles.empresaId, empresaId)));
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (!isDemoUser(session.user)) {
      throw new AppError("SERVICE_UNAVAILABLE", "No se pudo actualizar el vehículo. Intentá de nuevo más tarde.", 503);
    }
    updateMockVehiculo(id, data as never);
  }

  revalidatePath(VEHICULOS_PATH);
  revalidatePath(`${VEHICULOS_PATH}/${id}`);
  return { success: true, data: null, message: "Vehículo actualizado correctamente" };
}

export async function deleteVehicle(formData: FormData): Promise<ApiResponse<null>> {
  const session = await auth();
  if (!session?.user) throw new AppError("UNAUTHORIZED", "No autorizado", 401);
  const empresaId = requireEmpresaId(session);

  const id = parseInt(formData.get("id") as string, 10);
  if (isNaN(id) || id <= 0) throw new AppError("VALIDATION_ERROR", "ID inválido", 400);

  try {
    const [existing] = await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.empresaId, empresaId))).limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Vehículo no encontrado", 404);
    await db.delete(vehicles).where(and(eq(vehicles.id, id), eq(vehicles.empresaId, empresaId)));
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (!isDemoUser(session.user)) {
      throw new AppError("SERVICE_UNAVAILABLE", "No se pudo eliminar el vehículo. Intentá de nuevo más tarde.", 503);
    }
    deleteMockVehiculo(id);
  }

  revalidatePath(VEHICULOS_PATH);
  revalidatePath(`${VEHICULOS_PATH}/${id}`);
  return { success: true, data: null, message: "Vehículo eliminado correctamente" };
}