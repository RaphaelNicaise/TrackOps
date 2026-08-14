"use server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { updateMockVehiculo, deleteMockVehiculo } from "./mock-vehicles";

const VEHICULOS_PATH = "/dashboard/control-flota/vehiculos";

export async function updateVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const id = parseInt(formData.get("id") as string);
  const data = {
    patente: formData.get("patente") as string,
    marca: formData.get("marca") as string,
    modelo: formData.get("modelo") as string,
    anio: formData.get("anio") ? parseInt(formData.get("anio") as string) : null,
    tipo: (formData.get("tipo") as string) || null,
    chasis: (formData.get("chasis") as string) || null,
    kilometrajeActual: parseInt(formData.get("kilometrajeActual") as string) || 0,
    rto: formData.get("rto") ? new Date(formData.get("rto") as string) : null,
  };

  try {
    await db.update(vehicles).set(data).where(eq(vehicles.id, id));
  } catch {
    updateMockVehiculo(id, data);
  }

  revalidatePath(VEHICULOS_PATH);
  revalidatePath(`${VEHICULOS_PATH}/${id}`);
}

export async function deleteVehicle(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autorizado");

  const id = parseInt(formData.get("id") as string);

  try {
    await db.delete(vehicles).where(eq(vehicles.id, id));
  } catch {
    deleteMockVehiculo(id);
  }

  revalidatePath(VEHICULOS_PATH);
  revalidatePath(`${VEHICULOS_PATH}/${id}`);
}