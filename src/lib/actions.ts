"use server";
import { db } from "@/db";
import { vehicles, maintenanceLogs, fuelTickets, documents, shiftLogs } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { uploadFile } from "./s3";
import { logAudit } from "./audit";

export async function createVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  await db.insert(vehicles).values({
    empresaId: session.user.empresaId,
    patente: formData.get("patente") as string,
    marca: formData.get("marca") as string,
    modelo: formData.get("modelo") as string,
    anio: parseInt(formData.get("anio") as string),
    tipo: formData.get("tipo") as string,
    kilometrajeActual: parseInt(formData.get("kilometrajeActual") as string),
  });

  await logAudit("CREATE", "vehicle", null, { patente: formData.get("patente") });
  revalidatePath("/dashboard/flota");
}

export async function createMaintenanceLog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  const vId = parseInt(formData.get("vehicleId") as string);
  const km = parseInt(formData.get("kilometraje") as string);

  await db.insert(maintenanceLogs).values({
    vehicleId: vId,
    fecha: new Date(formData.get("fecha") as string),
    kilometraje: km,
    costo: parseFloat(formData.get("costo") as string),
    taller: formData.get("taller") as string,
    descripcion: formData.get("descripcion") as string,
  });

  // Actualizar kilometraje del vehículo si es mayor
  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vId));
  if (vehicle && km > vehicle.kilometrajeActual) {
    await db.update(vehicles).set({ kilometrajeActual: km }).where(eq(vehicles.id, vId));
  }

  await logAudit("CREATE", "maintenanceLog", null, { vehicleId: vId, descripcion: formData.get("descripcion") });
  revalidatePath("/dashboard/mantenimiento");
  revalidatePath("/dashboard/flota");
}

export async function createFuelTicket(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  const vId = parseInt(formData.get("vehicleId") as string);
  const file = formData.get("ticketFile") as File;
  
  let ticketUrl = null;
  if (file && file.size > 0) {
    ticketUrl = await uploadFile(file, `empresa-${session.user.empresaId}/tickets`);
  }

  const km = parseInt(formData.get("kilometraje") as string);

  await db.insert(fuelTickets).values({
    vehicleId: vId,
    fecha: new Date(formData.get("fecha") as string),
    litros: parseFloat(formData.get("litros") as string),
    costoTotal: parseFloat(formData.get("costoTotal") as string),
    kilometraje: km,
    ticketUrl,
  });

  const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vId));
  if (vehicle && km > vehicle.kilometrajeActual) {
    await db.update(vehicles).set({ kilometrajeActual: km }).where(eq(vehicles.id, vId));
  }

  await logAudit("CREATE", "fuelTicket", null, { vehicleId: vId, litros: formData.get("litros") });
  revalidatePath("/dashboard/combustible");
}

export async function createDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  const vId = parseInt(formData.get("vehicleId") as string);
  const file = formData.get("documentFile") as File;
  
  let fileUrl = null;
  if (file && file.size > 0) {
    fileUrl = await uploadFile(file, `empresa-${session.user.empresaId}/docs`);
  }

  await db.insert(documents).values({
    vehicleId: vId,
    tipoDocumento: formData.get("tipoDocumento") as string,
    fechaVencimiento: new Date(formData.get("fechaVencimiento") as string),
    fileUrl,
  });

  await logAudit("CREATE", "document", null, { vehicleId: vId, tipo: formData.get("tipoDocumento") });
  revalidatePath("/dashboard/documentacion");
}


export async function startShift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const vId = parseInt(formData.get("vehicleId") as string);
  const startKm = parseInt(formData.get("startKm") as string);

  await db.insert(shiftLogs).values({
    userId: session.user.id,
    vehicleId: vId,
    startKm,
    startTime: new Date(),
  });

  await logAudit("CREATE", "shiftLog", null, { vehicleId: vId, startKm });
  revalidatePath("/dashboard/chofer");
}

export async function endShift(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autorizado");

  const shiftId = parseInt(formData.get("shiftId") as string);
  const endKm = parseInt(formData.get("endKm") as string);

  await db.update(shiftLogs).set({
    endTime: new Date(),
    endKm,
  }).where(eq(shiftLogs.id, shiftId));

  await logAudit("UPDATE", "shiftLog", shiftId, { endKm });
  revalidatePath("/dashboard/chofer");
}
