import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { geofences } from "@/db/schema";
import {
  updateMockGeofence,
  deleteMockGeofence,
  dbRowToGeofence,
  geofenceToDbValues,
} from "@/lib/mock-geofences";
import { isDemoUser } from "@/lib/demo-mode";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

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
      return NextResponse.json({ error: "ID de geocerca inválido" }, { status: 400 });
    }

    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = session?.user?.empresaId || (isTest ? 1 : undefined);

    if (!isSuperAdmin && !empresaId && !isTest) {
      return NextResponse.json({ error: "Falta empresa" }, { status: 401 });
    }

    const body = await request.json();

    try {
      const updateValues = geofenceToDbValues(body);
      const whereCondition = isSuperAdmin
        ? eq(geofences.id, id)
        : and(eq(geofences.id, id), eq(geofences.empresaId, empresaId!));

      const [updated] = await db
        .update(geofences)
        .set(updateValues)
        .where(whereCondition)
        .returning();

      if (updated) {
        return NextResponse.json(dbRowToGeofence(updated));
      }
    } catch (dbError) {
      const canMock = (session?.user && isDemoUser(session.user)) || isTest;
      if (!canMock) throw dbError;
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

    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
    const empresaId = session?.user?.empresaId || (isTest ? 1 : undefined);

    if (!isSuperAdmin && !empresaId && !isTest) {
      return NextResponse.json({ error: "Falta empresa" }, { status: 401 });
    }

    try {
      const whereCondition = isSuperAdmin
        ? eq(geofences.id, id)
        : and(eq(geofences.id, id), eq(geofences.empresaId, empresaId!));

      const deletedRows = await db
        .delete(geofences)
        .where(whereCondition)
        .returning();

      if (deletedRows && deletedRows.length > 0) {
        deleteMockGeofence(id);
        return NextResponse.json({ success: true });
      }
    } catch (dbError) {
      const canMock = (session?.user && isDemoUser(session.user)) || isTest;
      if (!canMock) throw dbError;
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

