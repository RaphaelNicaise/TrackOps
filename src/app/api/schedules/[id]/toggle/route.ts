import { NextResponse } from "next/server";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import { toggleMockSchedule, dbRowToSchedule, updateMockSchedule } from "@/lib/mock-schedules";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de horario inválido" }, { status: 400 });
    }

    let explicitActivo: boolean | undefined = undefined;
    try {
      const body = await request.json();
      if (body && typeof body.activo === "boolean") {
        explicitActivo = body.activo;
      }
    } catch {
      // Request without body, standard toggle
    }

    try {
      const [existing] = await db
        .select()
        .from(schedules)
        .where(eq(schedules.id, id));

      if (existing) {
        const newActivo =
          explicitActivo !== undefined
            ? explicitActivo
              ? 1
              : 0
            : existing.activo === 1
            ? 0
            : 1;

        const [updated] = await db
          .update(schedules)
          .set({
            activo: newActivo,
            updatedAt: new Date(),
          })
          .where(eq(schedules.id, id))
          .returning();

        if (updated) {
          if (explicitActivo !== undefined) {
            updateMockSchedule(id, { activo: explicitActivo });
          } else {
            toggleMockSchedule(id);
          }
          return NextResponse.json(dbRowToSchedule(updated));
        }
      }
    } catch (dbError) {
      console.warn("DB toggle failed, using mock toggle fallback:", dbError);
    }

    const updated =
      explicitActivo !== undefined
        ? updateMockSchedule(id, { activo: explicitActivo })
        : toggleMockSchedule(id);

    if (!updated) {
      return NextResponse.json({ error: "Horario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error al cambiar estado del horario:", error);
    return NextResponse.json(
      { error: error.message || "Error al alternar estado del horario" },
      { status: 500 }
    );
  }
}
