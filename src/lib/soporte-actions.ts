"use server";

import { db } from "@/db";
import { ticketsSoporte, empresas, users } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq, desc, and, or, ilike, SQL } from "drizzle-orm";
import type {
  CreateTicketInput,
  TicketFilters,
  TicketEstado,
  TicketPrioridad,
  TicketSoporteRow,
} from "@/types/soporte";

export async function createSupportTicket(data: CreateTicketInput) {
  try {
    const session = await auth();

    const nombreContacto = (data.nombreContacto || session?.user?.name || "").trim();
    const tipo = data.tipo;
    const asunto = (data.asunto || "").trim();
    const mensaje = (data.mensaje || "").trim();
    const preferenciaRespuesta: PreferenciaRespuesta =
      data.preferenciaRespuesta === "WHATSAPP" ? "WHATSAPP" : "EMAIL";

    const emailContacto = (data.emailContacto || session?.user?.email || "").trim().toLowerCase();
    const telefonoContacto = (data.telefonoContacto || "").trim();

    if (!nombreContacto || !tipo || !asunto || !mensaje) {
      return {
        success: false,
        error: "Los campos nombre, tipo de requerimiento, asunto y mensaje son obligatorios.",
      };
    }

    if (preferenciaRespuesta === "EMAIL" && !emailContacto) {
      return {
        success: false,
        error: "Por favor ingresa un email de contacto para recibir respuesta por correo.",
      };
    }

    if (preferenciaRespuesta === "WHATSAPP" && !telefonoContacto) {
      return {
        success: false,
        error: "Por favor ingresa tu número de WhatsApp de contacto para recibir respuesta.",
      };
    }

    const userId = data.userId ?? (session?.user as any)?.id ?? null;
    const empresaId = data.empresaId ?? (session?.user as any)?.empresaId ?? null;
    const origen = data.origen || (session?.user ? "PANEL" : "WEB");
    const prioridad = data.prioridad || "MEDIA";
    const empresaNombreManual = data.empresaNombreManual?.trim() || null;

    // Fallback email for DB non-null column if contact is solely via WhatsApp
    const finalEmail =
      emailContacto ||
      (telefonoContacto ? `${telefonoContacto.replace(/\s+/g, "")}@whatsapp.user` : "soporte@trackops.com");
    const finalTelefono = telefonoContacto || null;

    const [inserted] = await db
      .insert(ticketsSoporte)
      .values({
        origen,
        empresaId,
        userId,
        nombreContacto,
        emailContacto: finalEmail,
        telefonoContacto: finalTelefono,
        empresaNombreManual,
        tipo,
        prioridad,
        estado: "PENDIENTE",
        asunto,
        mensaje,
        preferenciaRespuesta,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/panel/superadmin/soporte");

    return {
      success: true,
      ticketId: inserted.id,
      message: "Ticket de soporte creado correctamente",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al crear ticket de soporte",
    };
  }
}

export async function getSupportTickets(filters?: TicketFilters) {
  const conditions: SQL[] = [];

  if (filters?.estado && filters.estado !== "ALL") {
    conditions.push(eq(ticketsSoporte.estado, filters.estado as TicketEstado));
  }

  if (filters?.prioridad && filters.prioridad !== "ALL") {
    conditions.push(eq(ticketsSoporte.prioridad, filters.prioridad as TicketPrioridad));
  }

  if (filters?.tipo && filters.tipo !== "ALL") {
    conditions.push(eq(ticketsSoporte.tipo, filters.tipo));
  }

  if (filters?.origen && filters.origen !== "ALL") {
    conditions.push(eq(ticketsSoporte.origen, filters.origen));
  }

  if (filters?.empresaId !== undefined && filters.empresaId !== null && !isNaN(Number(filters.empresaId))) {
    conditions.push(eq(ticketsSoporte.empresaId, Number(filters.empresaId)));
  }

  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(ticketsSoporte.asunto, term),
        ilike(ticketsSoporte.mensaje, term),
        ilike(ticketsSoporte.nombreContacto, term),
        ilike(ticketsSoporte.emailContacto, term),
        ilike(empresas.nombre, term)
      )!
    );
  }

  const baseQuery = db
    .select({
      id: ticketsSoporte.id,
      origen: ticketsSoporte.origen,
      empresaId: ticketsSoporte.empresaId,
      empresaNombre: empresas.nombre,
      userId: ticketsSoporte.userId,
      userName: users.name,
      nombreContacto: ticketsSoporte.nombreContacto,
      emailContacto: ticketsSoporte.emailContacto,
      telefonoContacto: ticketsSoporte.telefonoContacto,
      empresaNombreManual: ticketsSoporte.empresaNombreManual,
      tipo: ticketsSoporte.tipo,
      prioridad: ticketsSoporte.prioridad,
      estado: ticketsSoporte.estado,
      asunto: ticketsSoporte.asunto,
      mensaje: ticketsSoporte.mensaje,
      preferenciaRespuesta: ticketsSoporte.preferenciaRespuesta,
      notasInternas: ticketsSoporte.notasInternas,
      resueltoPor: ticketsSoporte.resueltoPor,
      resueltoAt: ticketsSoporte.resueltoAt,
      createdAt: ticketsSoporte.createdAt,
      updatedAt: ticketsSoporte.updatedAt,
    })
    .from(ticketsSoporte)
    .leftJoin(empresas, eq(ticketsSoporte.empresaId, empresas.id))
    .leftJoin(users, eq(ticketsSoporte.userId, users.id));

  let rows: any[];
  if (conditions.length > 0) {
    rows = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(ticketsSoporte.createdAt));
  } else {
    rows = await baseQuery.orderBy(desc(ticketsSoporte.createdAt));
  }

  return {
    success: true,
    data: rows as TicketSoporteRow[],
  };
}

export async function getSupportTicketStats() {
  const rows = await db
    .select({
      estado: ticketsSoporte.estado,
      prioridad: ticketsSoporte.prioridad,
    })
    .from(ticketsSoporte);

  const stats = {
    total: rows.length,
    pendientes: rows.filter((r) => r.estado === "PENDIENTE").length,
    enRevision: rows.filter((r) => r.estado === "EN_REVISION").length,
    resueltos: rows.filter((r) => r.estado === "RESUELTO").length,
    urgentes: rows.filter((r) => r.prioridad === "URGENTE").length,
  };

  return stats;
}

export async function updateTicketStatus(
  ticketId: number,
  estado: TicketEstado,
  notasInternas?: string
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requieren privilegios de Superadmin");
  }

  if (!ticketId || isNaN(Number(ticketId))) {
    throw new Error("ID de ticket inválido");
  }

  const updateData: Record<string, any> = {
    estado,
    updatedAt: new Date(),
  };

  if (estado === "RESUELTO") {
    updateData.resueltoAt = new Date();
    updateData.resueltoPor = session.user?.email || "superadmin";
  }

  if (notasInternas !== undefined) {
    updateData.notasInternas = notasInternas;
  }

  const [updated] = await db
    .update(ticketsSoporte)
    .set(updateData)
    .where(eq(ticketsSoporte.id, Number(ticketId)))
    .returning();

  revalidatePath("/panel/superadmin/soporte");

  return {
    success: true,
    data: updated as TicketSoporteRow,
  };
}

export async function updateTicketPriority(
  ticketId: number,
  prioridad: TicketPrioridad
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requieren privilegios de Superadmin");
  }

  if (!ticketId || isNaN(Number(ticketId))) {
    throw new Error("ID de ticket inválido");
  }

  await db
    .update(ticketsSoporte)
    .set({
      prioridad,
      updatedAt: new Date(),
    })
    .where(eq(ticketsSoporte.id, Number(ticketId)))
    .returning();

  revalidatePath("/panel/superadmin/soporte");

  return { success: true };
}

export async function saveTicketInternalNotes(
  ticketId: number,
  notasInternas: string
) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Se requieren privilegios de Superadmin");
  }

  if (!ticketId || isNaN(Number(ticketId))) {
    throw new Error("ID de ticket inválido");
  }

  await db
    .update(ticketsSoporte)
    .set({
      notasInternas,
      updatedAt: new Date(),
    })
    .where(eq(ticketsSoporte.id, Number(ticketId)))
    .returning();

  revalidatePath("/panel/superadmin/soporte");

  return { success: true };
}
