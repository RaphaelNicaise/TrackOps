import { NextResponse } from "next/server";
import { db } from "@/db";
import { geofences } from "@/db/schema";
import {
  updateMockGeofence,
  deleteMockGeofence,
  dbRowToGeofence,
  geofenceToDbValues,
} from "@/lib/mock-geofences";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de geocerca inválido" }, { status: 400 });
    }

    const body = await request.json();

    try {
      const updateValues = geofenceToDbValues(body);
      const [updated] = await db
        .update(geofences)
        .set(updateValues)
        .where(eq(geofences.id, id))
        .returning();

      if (updated) {
        return NextResponse.json(dbRowToGeofence(updated));
      }
    } catch (dbError) {
      console.warn("DB update failed, using mock update fallback:", dbError);
    }

    const updatedMock = updateMockGeofence(id, body);
    if (!updatedMock) {
      return NextResponse.json({ error: "Geocerca no encontrada" }, { status: 404 });
    }

    return NextResponse.json(updatedMock);
  } catch (error: any) {
    console.error("Error al actualizar geocerca:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la geocerca" },
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
      return NextResponse.json({ error: "ID de geocerca inválido" }, { status: 400 });
    }

    try {
      const deletedRows = await db
        .delete(geofences)
        .where(eq(geofences.id, id))
        .returning();

      if (deletedRows && deletedRows.length > 0) {
        deleteMockGeofence(id);
        return NextResponse.json({ success: true });
      }
    } catch (dbError) {
      console.warn("DB delete failed, using mock delete fallback:", dbError);
    }

    const success = deleteMockGeofence(id);
    if (!success) {
      return NextResponse.json({ error: "Geocerca no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar geocerca:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la geocerca" },
      { status: 500 }
    );
  }
}

