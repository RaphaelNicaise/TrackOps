"use server";
import { db } from "@/db";
import { vehicles, maintenanceLogs, fuelTickets, documents, shiftLogs } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { uploadFile } from "./s3";
import { logAudit } from "./audit";
import { getEffectiveEmpresaId, requireVehicleOwnership } from "./auth-guards";

export async function createVehicle(formData: FormData) {
  const session = await auth();
  const empresaId = await getEffectiveEmpresaId(session);

  const patente = formData.get("patente") as string;
  const marca = formData.get("marca") as string;
  const modelo = formData.get("modelo") as string;
  const anio = parseInt(formData.get("anio") as string);
  const tipo = formData.get("tipo") as string;
  const kilometrajeActual = parseInt(formData.get("kilometrajeActual") as string) || 0;

  await db.insert(vehicles).values({
    empresaId,
    patente,
    marca,
    modelo,
    anio,
    tipo,
    kilometrajeActual,
  });

  await logAudit("CREATE", "vehicle", null, { patente });
  revalidatePath("/panel/flota");
}

export async function createMaintenanceLog(formData: FormData) {
  const session = await auth();
  const empresaId = await getEffectiveEmpresaId(session);

  const vId = parseInt(formData.get("vehicleId") as string);
  const km = parseInt(formData.get("kilometraje") as string);
  const fecha = new Date(formData.get("fecha") as string);
  const costo = parseFloat(formData.get("costo") as string) || 0;
  const taller = formData.get("taller") as string;
  const descripcion = formData.get("descripcion") as string;

  // Enforce vehicle ownership by current tenant
  const vehicle = await requireVehicleOwnership(vId, empresaId);

  await db.insert(maintenanceLogs).values({
    empresaId,
    vehicleId: vId,
    fecha,
    kilometraje: km,
    costo,
    taller,
    descripcion,
  });

  // Actualizar kilometraje del vehículo si es mayor
  if (vehicle && km > vehicle.kilometrajeActual) {
    await db.update(vehicles).set({ kilometrajeActual: km }).where(and(eq(vehicles.id, vId), eq(vehicles.empresaId, empresaId)));
  }

  await logAudit("CREATE", "maintenanceLog", null, { vehicleId: vId, descripcion });
  revalidatePath("/panel/mantenimiento");
  revalidatePath("/panel/flota");
}

export async function createFuelTicket(formData: FormData) {
  const session = await auth();
  const empresaId = await getEffectiveEmpresaId(session);

  const vId = parseInt(formData.get("vehicleId") as string);
  const file = formData.get("ticketFile") as File;
  
  let ticketUrl = null;
  if (file && file.size > 0) {
    ticketUrl = await uploadFile(file, `empresa-${empresaId}/tickets`);
  }

  const km = parseInt(formData.get("kilometraje") as string);
  const fecha = new Date(formData.get("fecha") as string);
  const litros = parseFloat(formData.get("litros") as string);
  const costoTotal = parseFloat(formData.get("costoTotal") as string);

  // Enforce vehicle ownership by current tenant
  const vehicle = await requireVehicleOwnership(vId, empresaId);

  await db.insert(fuelTickets).values({
    empresaId,
    vehicleId: vId,
    fecha,
    litros,
    costoTotal,
    kilometraje: km,
    ticketUrl,
  });

  if (vehicle && km > vehicle.kilometrajeActual) {
    await db.update(vehicles).set({ kilometrajeActual: km }).where(and(eq(vehicles.id, vId), eq(vehicles.empresaId, empresaId)));
  }

  await logAudit("CREATE", "fuelTicket", null, { vehicleId: vId, litros });
  revalidatePath("/panel/combustible");
}

export async function createDocument(formData: FormData) {
  const session = await auth();
  const empresaId = await getEffectiveEmpresaId(session);

  const vId = parseInt(formData.get("vehicleId") as string);
  const file = formData.get("documentFile") as File;
  
  let fileUrl = null;
  if (file && file.size > 0) {
    fileUrl = await uploadFile(file, `empresa-${empresaId}/docs`);
  }

  // Enforce vehicle ownership by current tenant
  await requireVehicleOwnership(vId, empresaId);

  await db.insert(documents).values({
    empresaId,
    vehicleId: vId,
    tipoDocumento: formData.get("tipoDocumento") as string,
    fechaVencimiento: new Date(formData.get("fechaVencimiento") as string),
    fileUrl,
  });

  await logAudit("CREATE", "document", null, { vehicleId: vId, tipo: formData.get("tipoDocumento") });
  revalidatePath("/panel/documentacion");
}

export async function startShift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const empresaId = await getEffectiveEmpresaId(session);

  const vId = parseInt(formData.get("vehicleId") as string);
  const startKm = parseInt(formData.get("startKm") as string);

  // Enforce vehicle ownership
  await requireVehicleOwnership(vId, empresaId);

  await db.insert(shiftLogs).values({
    empresaId,
    userId: session.user.id,
    vehicleId: vId,
    startKm,
    startTime: new Date(),
  });

  await logAudit("CREATE", "shiftLog", null, { vehicleId: vId, startKm });
  revalidatePath("/panel/chofer");
}

export async function endShift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");
  const empresaId = await getEffectiveEmpresaId(session);

  const shiftId = parseInt(formData.get("shiftId") as string);
  const endKm = parseInt(formData.get("endKm") as string);

  const [shift] = await db.select().from(shiftLogs).where(and(eq(shiftLogs.id, shiftId), eq(shiftLogs.empresaId, empresaId))).limit(1);
  if (!shift) throw new Error("Turno no encontrado o sin permisos");

  await db.update(shiftLogs).set({
    endTime: new Date(),
    endKm,
  }).where(and(eq(shiftLogs.id, shiftId), eq(shiftLogs.empresaId, empresaId)));

  await logAudit("UPDATE", "shiftLog", shiftId, { endKm });
  revalidatePath("/panel/chofer");
}

export async function createFine(formData: FormData) {
  const session = await auth();
  const empresaId = await getEffectiveEmpresaId(session);

  const vId = parseInt(formData.get("vehicleId") as string);
  const estado = (formData.get("estado") as string) || "pendiente";

  await requireVehicleOwnership(vId, empresaId);

  await (db as any).insert({}).values({
    empresaId,
    vehicleId: vId,
    fecha: formData.get("fecha") as string,
    jurisdiccion: formData.get("jurisdiccion") as string,
    motivo: formData.get("motivo") as string,
    monto: parseFloat(formData.get("monto") as string),
    estado,
  });
}
