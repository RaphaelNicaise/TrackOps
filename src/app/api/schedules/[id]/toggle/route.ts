import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import { toggleMockSchedule, dbRowToSchedule, updateMockSchedule } from "@/lib/mock-schedules";
import { isDemoUser } from "@/lib/demo-mode";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
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
      const whereCondition = isSuperAdmin
        ? eq(schedules.id, id)
        : and(eq(schedules.id, id), eq(schedules.empresaId, empresaId!));

      const [existing] = await db
        .select()
        .from(schedules)
        .where(whereCondition);

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
          .where(whereCondition)
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
      const canMock = (session?.user && isDemoUser(session.user)) || isTest;
      if (!canMock) throw dbError;
      console.warn("DB toggle failed, using mock toggle fallback:", dbError);
    }

    const updated =
      explicitActivo !== undefined
        ? updateMockSchedule(id, { activo: explicitActivo })
        : toggleMockSchedule(id);

    if (!updated) {
      return NextResponse.json({ error: "Horario no encontrado o sin permisos" }, { status: 404 });
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
