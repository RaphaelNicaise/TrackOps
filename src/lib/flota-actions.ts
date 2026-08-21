"use server";

import { db } from "@/db";
import { choferes, sitios, viajes, users, vehicles, empresas } from "@/db/schema";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq, and, or, ilike, gte, lte, desc, sql } from "drizzle-orm";
import type {
  CreateChoferInput,
  UpdateChoferInput,
  CreateSitioInput,
  UpdateSitioInput,
  CreateViajeInput,
  UpdateViajeInput,
  ChoferFilters,
  SitioFilters,
  ViajeFilters,
  ChoferRow,
  SitioRow,
  ViajeRow,
} from "@/types/flota-viajes";

// ═══════════════════════════════════════════════════════════
// 1. CHOFERES ACTIONS
// ═══════════════════════════════════════════════════════════

export async function getChoferes(
  filters?: ChoferFilters
): Promise<{ success: boolean; data?: ChoferRow[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const empresaId =
      filters?.empresaId || (!isSuperAdmin ? session.user.empresaId : null);

    const conditions = [];

    if (empresaId) {
      conditions.push(eq(choferes.empresaId, empresaId));
    }

    if (filters?.estado && filters.estado !== "TODOS") {
      conditions.push(eq(choferes.estado, filters.estado));
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(choferes.nombre, term),
          ilike(choferes.apellido, term),
          ilike(choferes.dni, term),
          ilike(choferes.telefono, term),
          ilike(choferes.email, term),
          ilike(choferes.licenciaNumero, term)
        )
      );
    }

    const query = db
      .select({
        id: choferes.id,
        empresaId: choferes.empresaId,
        userId: choferes.userId,
        nombre: choferes.nombre,
        apellido: choferes.apellido,
        dni: choferes.dni,
        telefono: choferes.telefono,
        email: choferes.email,
        licenciaNumero: choferes.licenciaNumero,
        licenciaCategoria: choferes.licenciaCategoria,
        licenciaVencimiento: choferes.licenciaVencimiento,
        estado: choferes.estado,
        vehiculoHabitualId: choferes.vehiculoHabitualId,
        notas: choferes.notas,
        createdAt: choferes.createdAt,
        updatedAt: choferes.updatedAt,
        vehiculoHabitualPatente: vehicles.patente,
        vehiculoHabitualModelo: vehicles.modelo,
      })
      .from(choferes)
      .leftJoin(vehicles, eq(choferes.vehiculoHabitualId, vehicles.id));

    const rows =
      conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(desc(choferes.createdAt))
        : await query.orderBy(desc(choferes.createdAt));

    return { success: true, data: rows as ChoferRow[] };
  } catch (error: any) {
    console.error("Error in getChoferes:", error);
    return { success: false, error: error.message || "Error al obtener choferes" };
  }
}

export async function createChofer(
  data: CreateChoferInput,
  createLoginUser: boolean = false,
  userPassword?: string
): Promise<{ success: boolean; data?: ChoferRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const targetEmpresaId =
      isSuperAdmin && data.empresaId
        ? data.empresaId
        : session.user.empresaId || data.empresaId;

    if (!targetEmpresaId) {
      return { success: false, error: "Empresa no especificada" };
    }

    if (!data.nombre?.trim() || !data.apellido?.trim() || !data.dni?.trim()) {
      return {
        success: false,
        error: "Nombre, apellido y DNI son obligatorios",
      };
    }

    // Check DNI uniqueness in company
    const existing = await db
      .select({ id: choferes.id })
      .from(choferes)
      .where(
        and(
          eq(choferes.empresaId, targetEmpresaId),
          eq(choferes.dni, data.dni.trim())
        )
      );

    if (existing.length > 0) {
      return {
        success: false,
        error: "Ya existe un chofer registrado con este DNI en la empresa",
      };
    }

    let linkedUserId: string | null = data.userId || null;

    if (createLoginUser) {
      const emailToUse = data.email?.trim() || `${data.dni.trim()}@flota.local`;

      // Check if user already exists
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(
          or(eq(users.dni, data.dni.trim()), eq(users.email, emailToUse))
        );

      if (existingUser.length > 0) {
        linkedUserId = existingUser[0].id;
      } else {
        const rawPassword = userPassword?.trim() || data.dni.trim();
        const passwordHash = await bcrypt.hash(rawPassword, 10);

        const [newUser] = await db
          .insert(users)
          .values({
            name: `${data.nombre.trim()} ${data.apellido.trim()}`,
            email: emailToUse,
            dni: data.dni.trim(),
            role: "CHOFER",
            empresaId: targetEmpresaId,
            passwordHash,
            mustChangePassword: 0,
          })
          .returning();

        if (newUser) {
          linkedUserId = newUser.id;
        }
      }
    }

    let licenciaVencimientoDate: Date | null = null;
    if (data.licenciaVencimiento) {
      licenciaVencimientoDate =
        data.licenciaVencimiento instanceof Date
          ? data.licenciaVencimiento
          : new Date(data.licenciaVencimiento);
    }

    const [newChofer] = await db
      .insert(choferes)
      .values({
        empresaId: targetEmpresaId,
        userId: linkedUserId,
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        dni: data.dni.trim(),
        telefono: data.telefono?.trim() || null,
        email: data.email?.trim() || null,
        licenciaNumero: data.licenciaNumero?.trim() || null,
        licenciaCategoria: data.licenciaCategoria?.trim() || null,
        licenciaVencimiento: licenciaVencimientoDate,
        estado: data.estado || "ACTIVO",
        vehiculoHabitualId: data.vehiculoHabitualId || null,
        notas: data.notas?.trim() || null,
      })
      .returning();

    revalidatePath("/panel/control-flota/choferes");
    return { success: true, data: newChofer as ChoferRow };
  } catch (error: any) {
    console.error("Error in createChofer:", error);
    return { success: false, error: error.message || "Error al crear chofer" };
  }
}

export async function updateChofer(
  choferId: number,
  data: UpdateChoferInput
): Promise<{ success: boolean; data?: ChoferRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.nombre !== undefined) updatePayload.nombre = data.nombre.trim();
    if (data.apellido !== undefined) updatePayload.apellido = data.apellido.trim();
    if (data.dni !== undefined) updatePayload.dni = data.dni.trim();
    if (data.telefono !== undefined)
      updatePayload.telefono = data.telefono?.trim() || null;
    if (data.email !== undefined)
      updatePayload.email = data.email?.trim() || null;
    if (data.licenciaNumero !== undefined)
      updatePayload.licenciaNumero = data.licenciaNumero?.trim() || null;
    if (data.licenciaCategoria !== undefined)
      updatePayload.licenciaCategoria = data.licenciaCategoria?.trim() || null;
    if (data.licenciaVencimiento !== undefined) {
      updatePayload.licenciaVencimiento = data.licenciaVencimiento
        ? data.licenciaVencimiento instanceof Date
          ? data.licenciaVencimiento
          : new Date(data.licenciaVencimiento)
        : null;
    }
    if (data.estado !== undefined) updatePayload.estado = data.estado;
    if (data.vehiculoHabitualId !== undefined)
      updatePayload.vehiculoHabitualId = data.vehiculoHabitualId;
    if (data.notas !== undefined)
      updatePayload.notas = data.notas?.trim() || null;
    if (data.userId !== undefined) updatePayload.userId = data.userId;

    const [updatedChofer] = await db
      .update(choferes)
      .set(updatePayload)
      .where(eq(choferes.id, choferId))
      .returning();

    revalidatePath("/panel/control-flota/choferes");
    revalidatePath("/panel/chofer");
    return { success: true, data: updatedChofer as ChoferRow };
  } catch (error: any) {
    console.error("Error in updateChofer:", error);
    return { success: false, error: error.message || "Error al actualizar chofer" };
  }
}

export async function deleteChofer(
  choferId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    await db.delete(choferes).where(eq(choferes.id, choferId));
    revalidatePath("/panel/control-flota/choferes");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteChofer:", error);
    return { success: false, error: error.message || "Error al eliminar chofer" };
  }
}

// ═══════════════════════════════════════════════════════════
// 2. SITIOS ACTIONS
// ═══════════════════════════════════════════════════════════

export async function getSitios(
  filters?: SitioFilters
): Promise<{ success: boolean; data?: SitioRow[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const empresaId =
      filters?.empresaId || (!isSuperAdmin ? session.user.empresaId : null);

    const conditions = [];

    if (empresaId) {
      conditions.push(eq(sitios.empresaId, empresaId));
    }

    if (filters?.tipo && filters.tipo !== "TODOS") {
      conditions.push(eq(sitios.tipo, filters.tipo));
    }

    if (filters?.activo !== undefined) {
      conditions.push(eq(sitios.activo, filters.activo));
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(sitios.nombre, term),
          ilike(sitios.direccion, term),
          ilike(sitios.ciudad, term),
          ilike(sitios.provincia, term),
          ilike(sitios.contactoNombre, term)
        )
      );
    }

    const query = db.select().from(sitios);

    const rows =
      conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(desc(sitios.createdAt))
        : await query.orderBy(desc(sitios.createdAt));

    return { success: true, data: rows as SitioRow[] };
  } catch (error: any) {
    console.error("Error in getSitios:", error);
    return { success: false, error: error.message || "Error al obtener sitios" };
  }
}

export async function createSitio(
  data: CreateSitioInput
): Promise<{ success: boolean; data?: SitioRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const targetEmpresaId =
      isSuperAdmin && data.empresaId
        ? data.empresaId
        : session.user.empresaId || data.empresaId;

    if (!targetEmpresaId) {
      return { success: false, error: "Empresa no especificada" };
    }

    if (
      !data.nombre?.trim() ||
      !data.direccion?.trim() ||
      data.lat === undefined ||
      data.lng === undefined ||
      isNaN(data.lat) ||
      isNaN(data.lng) ||
      (data.lat === 0 && data.lng === 0 && (!data.nombre?.trim() || !data.direccion?.trim()))
    ) {
      return {
        success: false,
        error: "Nombre, dirección, latitud y longitud son obligatorios",
      };
    }

    const [newSitio] = await db
      .insert(sitios)
      .values({
        empresaId: targetEmpresaId,
        nombre: data.nombre.trim(),
        tipo: data.tipo || "DEPOSITO",
        direccion: data.direccion.trim(),
        ciudad: data.ciudad?.trim() || null,
        provincia: data.provincia?.trim() || null,
        lat: data.lat,
        lng: data.lng,
        radioMetros: data.radioMetros ?? 100,
        contactoNombre: data.contactoNombre?.trim() || null,
        contactoTelefono: data.contactoTelefono?.trim() || null,
        activo: data.activo ?? 1,
      })
      .returning();

    revalidatePath("/panel/control-flota/sitios");
    return { success: true, data: newSitio as SitioRow };
  } catch (error: any) {
    console.error("Error in createSitio:", error);
    return { success: false, error: error.message || "Error al crear sitio" };
  }
}

export async function updateSitio(
  sitioId: number,
  data: UpdateSitioInput
): Promise<{ success: boolean; data?: SitioRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.nombre !== undefined) updatePayload.nombre = data.nombre.trim();
    if (data.tipo !== undefined) updatePayload.tipo = data.tipo;
    if (data.direccion !== undefined)
      updatePayload.direccion = data.direccion.trim();
    if (data.ciudad !== undefined)
      updatePayload.ciudad = data.ciudad?.trim() || null;
    if (data.provincia !== undefined)
      updatePayload.provincia = data.provincia?.trim() || null;
    if (data.lat !== undefined) updatePayload.lat = data.lat;
    if (data.lng !== undefined) updatePayload.lng = data.lng;
    if (data.radioMetros !== undefined)
      updatePayload.radioMetros = data.radioMetros;
    if (data.contactoNombre !== undefined)
      updatePayload.contactoNombre = data.contactoNombre?.trim() || null;
    if (data.contactoTelefono !== undefined)
      updatePayload.contactoTelefono = data.contactoTelefono?.trim() || null;
    if (data.activo !== undefined) updatePayload.activo = data.activo;

    const [updatedSitio] = await db
      .update(sitios)
      .set(updatePayload)
      .where(eq(sitios.id, sitioId))
      .returning();

    revalidatePath("/panel/control-flota/sitios");
    return { success: true, data: updatedSitio as SitioRow };
  } catch (error: any) {
    console.error("Error in updateSitio:", error);
    return { success: false, error: error.message || "Error al actualizar sitio" };
  }
}

export async function deleteSitio(
  sitioId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    await db.delete(sitios).where(eq(sitios.id, sitioId));
    revalidatePath("/panel/control-flota/sitios");
    return { success: true };
  } catch (error: any) {
    console.error("Error in deleteSitio:", error);
    return { success: false, error: error.message || "Error al eliminar sitio" };
  }
}

// ═══════════════════════════════════════════════════════════
// 3. VIAJES ACTIONS
// ═══════════════════════════════════════════════════════════

export async function getViajes(
  filters?: ViajeFilters
): Promise<{ success: boolean; data?: ViajeRow[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const empresaId =
      filters?.empresaId || (!isSuperAdmin ? session.user.empresaId : null);

    const conditions = [];

    if (empresaId) {
      conditions.push(eq(viajes.empresaId, empresaId));
    }

    if (filters?.choferId) {
      conditions.push(eq(viajes.choferId, filters.choferId));
    }

    if (filters?.vehiculoId) {
      conditions.push(eq(viajes.vehiculoId, filters.vehiculoId));
    }

    if (filters?.estado && filters.estado !== "TODOS") {
      conditions.push(eq(viajes.estado, filters.estado));
    }

    if (filters?.fechaDesde) {
      const fromDate =
        filters.fechaDesde instanceof Date
          ? filters.fechaDesde
          : new Date(filters.fechaDesde);
      conditions.push(gte(viajes.fechaSalidaProgramada, fromDate));
    }

    if (filters?.fechaHasta) {
      const toDate =
        filters.fechaHasta instanceof Date
          ? filters.fechaHasta
          : new Date(filters.fechaHasta);
      conditions.push(lte(viajes.fechaSalidaProgramada, toDate));
    }

    if (filters?.search && filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(viajes.codigo, term),
          ilike(viajes.origenNombre, term),
          ilike(viajes.destinoNombre, term),
          ilike(viajes.origenDireccion, term),
          ilike(viajes.destinoDireccion, term)
        )
      );
    }

    const query = db
      .select({
        id: viajes.id,
        empresaId: viajes.empresaId,
        codigo: viajes.codigo,
        choferId: viajes.choferId,
        choferNombre: sql<string>`concat(${choferes.nombre}, ' ', ${choferes.apellido})`,
        vehiculoId: viajes.vehiculoId,
        vehiculoPatente: vehicles.patente,
        vehiculoModelo: vehicles.modelo,
        origenTipo: viajes.origenTipo,
        origenSitioId: viajes.origenSitioId,
        origenNombre: viajes.origenNombre,
        origenDireccion: viajes.origenDireccion,
        origenLat: viajes.origenLat,
        origenLng: viajes.origenLng,
        destinoTipo: viajes.destinoTipo,
        destinoSitioId: viajes.destinoSitioId,
        destinoNombre: viajes.destinoNombre,
        destinoDireccion: viajes.destinoDireccion,
        destinoLat: viajes.destinoLat,
        destinoLng: viajes.destinoLng,
        distanciaEstimadaKm: viajes.distanciaEstimadaKm,
        fechaSalidaProgramada: viajes.fechaSalidaProgramada,
        fechaLlegadaEstimada: viajes.fechaLlegadaEstimada,
        fechaInicioReal: viajes.fechaInicioReal,
        fechaFinReal: viajes.fechaFinReal,
        kmInicio: viajes.kmInicio,
        kmFin: viajes.kmFin,
        estado: viajes.estado,
        notas: viajes.notas,
        creadoPor: viajes.creadoPor,
        createdAt: viajes.createdAt,
        updatedAt: viajes.updatedAt,
      })
      .from(viajes)
      .leftJoin(choferes, eq(viajes.choferId, choferes.id))
      .leftJoin(vehicles, eq(viajes.vehiculoId, vehicles.id));

    const rows =
      conditions.length > 0
        ? await query.where(and(...conditions)).orderBy(desc(viajes.fechaSalidaProgramada))
        : await query.orderBy(desc(viajes.fechaSalidaProgramada));

    return { success: true, data: rows as ViajeRow[] };
  } catch (error: any) {
    console.error("Error in getViajes:", error);
    return { success: false, error: error.message || "Error al obtener viajes" };
  }
}

export async function createViaje(
  data: CreateViajeInput
): Promise<{ success: boolean; data?: ViajeRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const targetEmpresaId =
      isSuperAdmin && data.empresaId
        ? data.empresaId
        : session.user.empresaId || data.empresaId;

    if (!targetEmpresaId) {
      return { success: false, error: "Empresa no especificada" };
    }

    if (
      !data.origenNombre?.trim() ||
      !data.origenDireccion?.trim() ||
      !data.destinoNombre?.trim() ||
      !data.destinoDireccion?.trim() ||
      !data.fechaSalidaProgramada
    ) {
      return {
        success: false,
        error: "Origen, destino y fecha de salida son obligatorios",
      };
    }

    const codigo =
      data.codigo?.trim() || `VIA-${Math.floor(10000 + Math.random() * 90000)}`;

    const fechaSalidaProgramada =
      data.fechaSalidaProgramada instanceof Date
        ? data.fechaSalidaProgramada
        : new Date(data.fechaSalidaProgramada);

    const fechaLlegadaEstimada = data.fechaLlegadaEstimada
      ? data.fechaLlegadaEstimada instanceof Date
        ? data.fechaLlegadaEstimada
        : new Date(data.fechaLlegadaEstimada)
      : null;

    const [newViaje] = await db
      .insert(viajes)
      .values({
        empresaId: targetEmpresaId,
        codigo,
        choferId: data.choferId || null,
        vehiculoId: data.vehiculoId || null,
        origenTipo: data.origenTipo || "SITIO",
        origenSitioId: data.origenSitioId || null,
        origenNombre: data.origenNombre.trim(),
        origenDireccion: data.origenDireccion.trim(),
        origenLat: data.origenLat ?? 0,
        origenLng: data.origenLng ?? 0,
        destinoTipo: data.destinoTipo || "SITIO",
        destinoSitioId: data.destinoSitioId || null,
        destinoNombre: data.destinoNombre.trim(),
        destinoDireccion: data.destinoDireccion.trim(),
        destinoLat: data.destinoLat ?? 0,
        destinoLng: data.destinoLng ?? 0,
        distanciaEstimadaKm: data.distanciaEstimadaKm ?? null,
        fechaSalidaProgramada,
        fechaLlegadaEstimada,
        estado: data.estado || "PLANIFICADO",
        notas: data.notas?.trim() || null,
        creadoPor: session.user.id || null,
      })
      .returning();

    revalidatePath("/panel/control-flota/viajes");
    revalidatePath("/panel/chofer");
    return { success: true, data: newViaje as ViajeRow };
  } catch (error: any) {
    console.error("Error in createViaje:", error);
    return { success: false, error: error.message || "Error al crear viaje" };
  }
}

export async function iniciarViajeChofer(
  viajeId: number,
  kmInicio: number
): Promise<{ success: boolean; data?: ViajeRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const [updatedViaje] = await db
      .update(viajes)
      .set({
        estado: "EN_CURSO",
        fechaInicioReal: new Date(),
        kmInicio,
        updatedAt: new Date(),
      })
      .where(eq(viajes.id, viajeId))
      .returning();

    if (updatedViaje?.vehiculoId && typeof kmInicio === "number") {
      await db
        .update(vehicles)
        .set({ kilometrajeActual: kmInicio })
        .where(eq(vehicles.id, updatedViaje.vehiculoId));
    }

    revalidatePath("/panel/chofer");
    revalidatePath("/panel/control-flota/viajes");
    return { success: true, data: updatedViaje as ViajeRow };
  } catch (error: any) {
    console.error("Error in iniciarViajeChofer:", error);
    return { success: false, error: error.message || "Error al iniciar viaje" };
  }
}

export async function finalizarViajeChofer(
  viajeId: number,
  kmFin: number,
  notasFin?: string
): Promise<{ success: boolean; data?: ViajeRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const updateSet: Record<string, any> = {
      estado: "COMPLETADO",
      fechaFinReal: new Date(),
      kmFin,
      updatedAt: new Date(),
    };

    if (notasFin) {
      updateSet.notas = notasFin;
    }

    const [updatedViaje] = await db
      .update(viajes)
      .set(updateSet)
      .where(eq(viajes.id, viajeId))
      .returning();

    if (updatedViaje?.vehiculoId && typeof kmFin === "number") {
      await db
        .update(vehicles)
        .set({ kilometrajeActual: kmFin })
        .where(eq(vehicles.id, updatedViaje.vehiculoId));
    }

    revalidatePath("/panel/chofer");
    revalidatePath("/panel/control-flota/viajes");
    return { success: true, data: updatedViaje as ViajeRow };
  } catch (error: any) {
    console.error("Error in finalizarViajeChofer:", error);
    return { success: false, error: error.message || "Error al finalizar viaje" };
  }
}

export async function cancelarViaje(
  viajeId: number,
  motivo?: string
): Promise<{ success: boolean; data?: ViajeRow; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const updateSet: Record<string, any> = {
      estado: "CANCELADO",
      updatedAt: new Date(),
    };

    if (motivo) {
      updateSet.notas = motivo;
    }

    const [updatedViaje] = await db
      .update(viajes)
      .set(updateSet)
      .where(eq(viajes.id, viajeId))
      .returning();

    revalidatePath("/panel/control-flota/viajes");
    revalidatePath("/panel/chofer");
    return { success: true, data: updatedViaje as ViajeRow };
  } catch (error: any) {
    console.error("Error in cancelarViaje:", error);
    return { success: false, error: error.message || "Error al cancelar viaje" };
  }
}
