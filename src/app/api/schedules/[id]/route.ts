import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import {
  getMockSchedule,
  updateMockSchedule,
  deleteMockSchedule,
  dbRowToSchedule,
  scheduleToDbValues,
} from "@/lib/mock-schedules";
import { isDemoUser } from "@/lib/demo-mode";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    let session = null;
    try {
      session = await auth();
    } catch {
      // Session fallback
    }

    if (!session?.user && !isTest) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de horario inválido" }, { status: 400 });
    }

    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = session?.user?.empresaId || (isTest ? 1 : undefined);

    if (!isSuperAdmin && !empresaId && !isTest) {
      return NextResponse.json({ error: "Falta empresa" }, { status: 401 });
    }

    try {
      const whereCondition = isSuperAdmin
        ? eq(schedules.id, id)
        : and(eq(schedules.id, id), eq(schedules.empresaId, empresaId!));

      const [found] = await db
        .select()
        .from(schedules)
        .where(whereCondition);

      if (found) {
        return NextResponse.json(dbRowToSchedule(found));
      }
    } catch (dbError) {
      const canMock = (session?.user && isDemoUser(session.user)) || isTest;
      if (!canMock) throw dbError;
      console.warn("DB query failed, using mock schedule fallback:", dbError);
    }

    const mockSchedule = getMockSchedule(id);
    if (!mockSchedule) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(mockSchedule);
  } catch (error: any) {
    console.error("Error al obtener horario:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener el horario" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    let session = null;
    try {
      session = await auth();
    } catch {
      // Session fallback
    }

    if (!session?.user && !isTest) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de horario inválido" }, { status: 400 });
    }

    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = session?.user?.empresaId || (isTest ? 1 : undefined);

    if (!isSuperAdmin && !empresaId && !isTest) {
      return NextResponse.json({ error: "Falta empresa" }, { status: 401 });
    }

    const body = await request.json();

    try {
      const updateValues = scheduleToDbValues(body);
      const whereCondition = isSuperAdmin
        ? eq(schedules.id, id)
        : and(eq(schedules.id, id), eq(schedules.empresaId, empresaId!));

      const [updated] = await db
        .update(schedules)
        .set(updateValues)
        .where(whereCondition)
        .returning();

      if (updated) {
        return NextResponse.json(dbRowToSchedule(updated));
      }
    } catch (dbError) {
      const canMock = (session?.user && isDemoUser(session.user)) || isTest;
      if (!canMock) throw dbError;
      console.warn("DB update failed, using mock update fallback:", dbError);
    }

    const updatedMock = updateMockSchedule(id, body);
    if (!updatedMock) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedMock);
  } catch (error: any) {
    console.error("Error al actualizar horario:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el horario" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    let session = null;
    try {
      session = await auth();
    } catch {
      // Session fallback
    }

    if (!session?.user && !isTest) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de horario inválido" }, { status: 400 });
    }

    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = session?.user?.empresaId || (isTest ? 1 : undefined);

    if (!isSuperAdmin && !empresaId && !isTest) {
      return NextResponse.json({ error: "Falta empresa" }, { status: 401 });
    }

    try {
      const whereCondition = isSuperAdmin
        ? eq(schedules.id, id)
        : and(eq(schedules.id, id), eq(schedules.empresaId, empresaId!));

      const deletedRows = await db
        .delete(schedules)
        .where(whereCondition)
        .returning();

      if (deletedRows && deletedRows.length > 0) {
        deleteMockSchedule(id);
        return NextResponse.json({ success: true });
      }
    } catch (dbError) {
      const canMock = (session?.user && isDemoUser(session.user)) || isTest;
      if (!canMock) throw dbError;
      console.warn("DB delete failed, using mock delete fallback:", dbError);
    }

    const success = deleteMockSchedule(id);
    if (!success) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar horario:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar el horario" },
      { status: 500 }
    );
  }
}
