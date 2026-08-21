"use server";

import { db } from "@/db";
import { prospectos } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { logAudit } from "./audit";

export interface ProspectoInput {
  nombre: string;
  email: string;
  telefono?: string | null;
  empresa?: string | null;
  flotaEstimada?: number | null;
  mensaje?: string | null;
  estado?: string;
  notas?: string | null;
}

export type Prospecto = typeof prospectos.$inferSelect;

/**
 * Obtener todos los prospectos / solicitudes de demo ordenados cronológicamente
 */
export async function getProspectos(): Promise<Prospecto[]> {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requieren privilegios de Superadmin");
  }

  const results = await db
    .select()
    .from(prospectos)
    .orderBy(desc(prospectos.createdAt));

  return results;
}

/**
 * Actualizar el estado del pipeline comercial y las notas internas de seguimiento
 */
export async function updateProspectoStatus(
  id: number,
  estado: string,
  notas?: string
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requieren privilegios de Superadmin");
  }

  if (isNaN(id)) {
    throw new Error("ID de prospecto inválido");
  }

  const updateData: { estado: string; notas?: string } = { estado };
  if (notas !== undefined) {
    updateData.notas = notas;
  }

  const [updated] = await db
    .update(prospectos)
    .set(updateData)
    .where(eq(prospectos.id, id))
    .returning();

  await logAudit("UPDATE", "prospecto", id, {
    estado,
    notas,
    prospectoNombre: updated?.nombre,
  });

  revalidatePath("/panel/superadmin/prospectos");
  return { success: true, prospecto: updated };
}

/**
 * Crear un nuevo prospecto o solicitud de demo (desde landing web o desde panel)
 */
export async function createProspecto(data: ProspectoInput) {
  if (!data.nombre?.trim() || !data.email?.trim()) {
    throw new Error("El nombre y el email son obligatorios.");
  }

  const [nuevoProspecto] = await db
    .insert(prospectos)
    .values({
      nombre: data.nombre.trim(),
      email: data.email.trim().toLowerCase(),
      telefono: data.telefono?.trim() || null,
      empresa: data.empresa?.trim() || null,
      flotaEstimada:
        data.flotaEstimada != null && !isNaN(Number(data.flotaEstimada))
          ? Number(data.flotaEstimada)
          : null,
      mensaje: data.mensaje?.trim() || null,
      estado: data.estado || "nuevo",
      notas: data.notas?.trim() || null,
    })
    .returning();

  await logAudit("CREATE", "prospecto", nuevoProspecto.id, {
    nombre: nuevoProspecto.nombre,
    empresa: nuevoProspecto.empresa,
    email: nuevoProspecto.email,
  });

  revalidatePath("/panel/superadmin/prospectos");
  return { success: true, prospecto: nuevoProspecto };
}
