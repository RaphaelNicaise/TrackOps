import { NextResponse } from "next/server";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import {
  getMockSchedule,
  updateMockSchedule,
  deleteMockSchedule,
  dbRowToSchedule,
  scheduleToDbValues,
} from "@/lib/mock-schedules";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de horario inválido" }, { status: 400 });
    }

    try {
      const [found] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, id));

      if (found) {
        return NextResponse.json(dbRowToSchedule(found));
      }
    } catch (dbError) {
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
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de horario inválido" }, { status: 400 });
    }

    const body = await request.json();

    try {
      const updateValues = scheduleToDbValues(body);
      const [updated] = await db
        .update(schedules)
        .set(updateValues)
        .where(eq(schedules.id, id))
        .returning();

      if (updated) {
        return NextResponse.json(dbRowToSchedule(updated));
      }
    } catch (dbError) {
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
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de horario inválido" }, { status: 400 });
    }

    try {
      const deletedRows = await db
        .delete(schedules)
        .where(eq(schedules.id, id))
        .returning();

      if (deletedRows && deletedRows.length > 0) {
        deleteMockSchedule(id);
        return NextResponse.json({ success: true });
      }
    } catch (dbError) {
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
