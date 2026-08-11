"use server";
import { db } from "@/db";
import { vehicles, shiftLogs } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, isNull, and } from "drizzle-orm";

export async function checkInVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No User ID");

  const vId = parseInt(formData.get("vehicleId") as string);
  const startKm = parseInt(formData.get("startKm") as string);

  // Check if vehicle is already in use
  const activeShifts = await db.select().from(shiftLogs).where(and(eq(shiftLogs.vehicleId, vId), isNull(shiftLogs.endTime)));
  
  if (activeShifts.length > 0) {
    throw new Error("El vehículo ya está en uso");
  }

  await db.insert(shiftLogs).values({
    vehicleId: vId,
    userId: session.user.id,
    startKm,
    startTime: new Date(),
  } as any); // Using 'as any' here because endTime is omitted

  revalidatePath("/dashboard/chofer");
}

export async function checkOutVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No User ID");

  const shiftLogId = parseInt(formData.get("shiftLogId") as string);
  const vId = parseInt(formData.get("vehicleId") as string);
  const endKm = parseInt(formData.get("endKm") as string);

  await db.update(shiftLogs)
    .set({ endKm, endTime: new Date() })
    .where(eq(shiftLogs.id, shiftLogId));

  await db.update(vehicles)
    .set({ kilometrajeActual: endKm })
    .where(eq(vehicles.id, vId));

  revalidatePath("/dashboard/chofer");
}
