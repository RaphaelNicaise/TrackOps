"use server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";

export async function importVehiclesCSV(formData: FormData) {
  const session = await auth();
  if (!session?.user?.empresaId) throw new Error("No empresa ID");

  const file = formData.get("csvFile") as File;
  if (!file || file.size === 0) {
    throw new Error("No se encontró archivo CSV");
  }

  const text = await file.text();
  
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error("Error procesando CSV: " + parsed.errors[0].message);
  }

  const empresaId = session.user.empresaId as number;

  const dataToInsert = parsed.data.map((row: any) => ({
    empresaId: empresaId,
    patente: row.patente,
    marca: row.marca,
    modelo: row.modelo,
    anio: parseInt(row.anio),
    tipo: row.tipo || "utilitario",
    kilometrajeActual: parseInt(row.kilometrajeActual) || 0,
  }));

  if (dataToInsert.length === 0) return;

  await db.transaction(async (tx) => {
    await tx.insert(vehicles).values(dataToInsert);
  });

  revalidatePath("/dashboard/flota");
}
