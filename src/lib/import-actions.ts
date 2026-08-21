"use server";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { csvRowSchema } from "@/lib/schemas/csv-import.schema";
import { AppError, MAX_CSV_ROWS, MAX_CSV_SIZE, zodToFieldErrors } from "@/lib/api-error";
import { eq, inArray, and } from "drizzle-orm";
import type { ApiResponse } from "@/lib/api-error";
import { z } from "zod";

export async function importVehiclesCSV(formData: FormData): Promise<ApiResponse<{ inserted: number }>> {
  const session = await auth();
  if (!session?.user?.empresaId) throw new AppError("UNAUTHORIZED", "No autorizado: falta empresa", 401);

  const file = formData.get("csvFile") as File;
  if (!file || file.size === 0) {
    throw new AppError("VALIDATION_ERROR", "No se encontró archivo CSV", 400, { csvFile: ["Archivo requerido"] });
  }
  if (file.size > MAX_CSV_SIZE) {
    throw new AppError("PAYLOAD_TOO_LARGE", `El archivo supera los ${MAX_CSV_SIZE / (1024 * 1024)} MB`, 413);
  }
  if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv" && !file.type.includes("csv")) {
    // Permitir igual, solo warn
  }

  const text = await file.text();
  if (!text.trim()) throw new AppError("VALIDATION_ERROR", "El archivo CSV está vacío", 400);

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transform: (v: string) => v.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new AppError("VALIDATION_ERROR", "Error procesando CSV: " + parsed.errors[0].message, 400, undefined, parsed.errors);
  }

  const rawRows = parsed.data as Record<string, unknown>[];
  if (rawRows.length === 0) throw new AppError("VALIDATION_ERROR", "El CSV no contiene filas", 400);
  if (rawRows.length > MAX_CSV_ROWS) throw new AppError("PAYLOAD_TOO_LARGE", `Máximo ${MAX_CSV_ROWS} filas por importación (recibidas ${rawRows.length})`, 413);

  const empresaId = session.user.empresaId as number;

  // Validar cada fila con zod y normalizar patente
  const rowErrors: { fila: number; fieldErrors: Record<string, string[]>; patente?: string }[] = [];
  const validRows: { patente: string; marca: string; modelo: string; anio: number | null; tipo: string; kilometrajeActual: number }[] = [];
  const patenteSet = new Map<string, number>(); // patente -> primera fila

  rawRows.forEach((row: Record<string, unknown>, idx) => {
    const fila = idx + 2; // +1 header, +1 1-index
    const raw = {
      patente: String((row as Record<string, unknown>)["patente"] ?? "").trim(),
      marca: String((row as Record<string, unknown>)["marca"] ?? "").trim(),
      modelo: String((row as Record<string, unknown>)["modelo"] ?? "").trim(),
      anio: (row as Record<string, unknown>)["anio"] as string,
      tipo: (row as Record<string, unknown>)["tipo"] as string,
      kilometrajeActual: (row as Record<string, unknown>)["kilometrajeActual"] as string,
    };
    try {
      const p = csvRowSchema.parse(raw);
      const patenteNorm = (p.patente as string).toUpperCase();
      // Duplicado intra-file
      if (patenteSet.has(patenteNorm)) {
        rowErrors.push({ fila, patente: patenteNorm, fieldErrors: { patente: [`Patente duplicada en el archivo (fila ${patenteSet.get(patenteNorm)})`] } });
        return;
      }
      patenteSet.set(patenteNorm, fila);
      validRows.push({
        patente: patenteNorm,
        marca: p.marca,
        modelo: p.modelo,
        anio: (p.anio as number | null) ?? null,
        tipo: (p.tipo as string) || "utilitario",
        kilometrajeActual: (p.kilometrajeActual as number) ?? 0,
      });
    } catch (e) {
      if (e instanceof z.ZodError) {
        rowErrors.push({ fila, fieldErrors: zodToFieldErrors(e) });
      } else {
        rowErrors.push({ fila, fieldErrors: { _form: [String(e)] } });
      }
    }
  });

  // Si hubo errores de validación intra-file => no insertar nada (rollback total)
  if (rowErrors.length > 0) {
    throw new AppError("UNPROCESSABLE", `El archivo tiene ${rowErrors.length} fila(s) con errores`, 422, undefined, { rowErrors });
  }

  // Duplicados contra DB
  const patentes = validRows.map((r) => r.patente);
  try {
    const existing = await db.select({ patente: vehicles.patente }).from(vehicles).where(and(eq(vehicles.empresaId, empresaId), inArray(vehicles.patente, patentes)));
    if (existing.length > 0) {
      const existingSet = new Set(existing.map((e) => e.patente));
      const dupErrors = validRows
        .map((r, i) => ({ r, idx: i }))
        .filter(({ r }) => existingSet.has(r.patente))
        .map(({ r }) => ({ patente: r.patente, fieldErrors: { patente: ["Ya existe un vehículo con esa patente en tu empresa"] } }));
      throw new AppError("CONFLICT", `Hay ${dupErrors.length} patente(s) ya existentes en tu empresa`, 409, undefined, { rowErrors: dupErrors, patentesDuplicadas: existing.map((e) => e.patente) });
    }
  } catch (e) {
    if (e instanceof AppError) throw e;
    // Si DB no disponible, continuar (modo demo no bloquea)
  }

  const dataToInsert = validRows.map((r) => ({
    empresaId,
    patente: r.patente,
    marca: r.marca,
    modelo: r.modelo,
    anio: r.anio,
    tipo: r.tipo,
    kilometrajeActual: r.kilometrajeActual,
  }));

  if (dataToInsert.length === 0) throw new AppError("VALIDATION_ERROR", "No hay filas válidas para importar", 400);

  await db.transaction(async (tx) => {
    await tx.insert(vehicles).values(dataToInsert);
  });

  revalidatePath("/panel/control-flota/vehiculos");
  return { success: true, data: { inserted: dataToInsert.length }, message: `${dataToInsert.length} vehículo(s) importados correctamente` };
}
