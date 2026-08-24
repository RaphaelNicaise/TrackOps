"use server";
import { db } from "@/db";
import { vehicles, shiftLogs } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";
import { getEffectiveEmpresaId, requireVehicleOwnership } from "./auth-guards";

export async function checkInVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No User ID");
  const empresaId = await getEffectiveEmpresaId(session);

  const vId = parseInt(formData.get("vehicleId") as string);
  const startKm = parseInt(formData.get("startKm") as string);

  // Enforce vehicle ownership by user's company
  await requireVehicleOwnership(vId, empresaId);

  // Check if vehicle is already in use
  const activeShifts = await db
    .select()
    .from(shiftLogs)
    .where(
      and(
        eq(shiftLogs.vehicleId, vId),
        eq(shiftLogs.empresaId, empresaId),
        isNull(shiftLogs.endTime)
      )
    );
  
  if (activeShifts.length > 0) {
    throw new Error("El vehículo ya está en uso");
  }

  await db.insert(shiftLogs).values({
    empresaId,
    vehicleId: vId,
    userId: session.user.id,
    startKm,
    startTime: new Date(),
  } as any);

  revalidatePath("/panel/chofer");
}

export async function checkOutVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No User ID");
  const empresaId = await getEffectiveEmpresaId(session);

  const shiftLogId = parseInt(formData.get("shiftLogId") as string);
  const vId = parseInt(formData.get("vehicleId") as string);
  const endKm = parseInt(formData.get("endKm") as string);

  // Validate shift ownership
  const [shift] = await db
    .select()
    .from(shiftLogs)
    .where(
      and(
        eq(shiftLogs.id, shiftLogId),
        eq(shiftLogs.empresaId, empresaId)
      )
    )
    .limit(1);

  if (!shift) {
    throw new Error("Turno no encontrado o no pertenece a tu empresa");
  }

  // Validate vehicle ownership
  await requireVehicleOwnership(vId, empresaId);

  await db.update(shiftLogs)
    .set({ endKm, endTime: new Date() })
    .where(and(eq(shiftLogs.id, shiftLogId), eq(shiftLogs.empresaId, empresaId)));

  await db.update(vehicles)
    .set({ kilometrajeActual: endKm })
    .where(and(eq(vehicles.id, vId), eq(vehicles.empresaId, empresaId)));

  revalidatePath("/panel/chofer");
}
