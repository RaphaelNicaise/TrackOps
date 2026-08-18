import { NextResponse } from "next/server";
import { db } from "@/db";
import { geofences } from "@/db/schema";
import { toggleMockGeofence, dbRowToGeofence } from "@/lib/mock-geofences";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de geocerca inválido" }, { status: 400 });
    }

    try {
      const [existing] = await db
        .select()
        .from(geofences)
        .where(eq(geofences.id, id));

      if (existing) {
        const newActiva = existing.activa === 1 ? 0 : 1;
        const [updated] = await db
          .update(geofences)
          .set({
            activa: newActiva,
            updatedAt: new Date(),
          })
          .where(eq(geofences.id, id))
          .returning();

        if (updated) {
          toggleMockGeofence(id);
          return NextResponse.json(dbRowToGeofence(updated));
        }
      }
    } catch (dbError) {
      console.warn("DB toggle failed, using mock toggle fallback:", dbError);
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

