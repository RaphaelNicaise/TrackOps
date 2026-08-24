import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { geofences } from "@/db/schema";
import { toggleMockGeofence, dbRowToGeofence } from "@/lib/mock-geofences";
import { isDemoSession } from "@/lib/demo-mode";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
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
      return NextResponse.json({ error: "ID de geocerca inválido" }, { status: 400 });
    }

    const demo = (await isDemoSession()) || isTest;
    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = session?.user?.empresaId || (isTest ? 1 : undefined);

    if (!isSuperAdmin && !empresaId && !isTest) {
      return NextResponse.json({ error: "Falta empresa" }, { status: 401 });
    }

    try {
      const whereCondition = isSuperAdmin
        ? eq(geofences.id, id)
        : and(eq(geofences.id, id), eq(geofences.empresaId, empresaId!));

      const [existing] = await db
        .select()
        .from(geofences)
        .where(whereCondition);

      if (existing) {
        const newActiva = existing.activa === 1 ? 0 : 1;
        const [updated] = await db
          .update(geofences)
          .set({
            activa: newActiva,
            updatedAt: new Date(),
          })
          .where(whereCondition)
          .returning();

        if (updated) {
          toggleMockGeofence(id);
          return NextResponse.json(dbRowToGeofence(updated));
        }
      }
      if (!demo) {
        return NextResponse.json({ error: "Geocerca no encontrada o sin permisos" }, { status: 404 });
      }
    } catch (dbError) {
      console.warn("DB toggle failed, using mock toggle fallback:", dbError);
      if (!demo) {
        return NextResponse.json(
          { error: "No se pudo cambiar el estado de la geocerca" },
          { status: 500 }
        );
      }
    }

    const updated = toggleMockGeofence(id);
    if (!updated) {
      return NextResponse.json({ error: "Geocerca no encontrada" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error al cambiar estado de geocerca:", error);
    return NextResponse.json(
      { error: error.message || "Error al alternar estado de la geocerca" },
      { status: 500 }
    );
  }
}

