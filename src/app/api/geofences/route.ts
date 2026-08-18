import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { geofences, empresas } from "@/db/schema";
import {
  getMockGeofences,
  createMockGeofence,
  dbRowToGeofence,
  geofenceToDbValues,
} from "@/lib/mock-geofences";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      // Session lookup fallback
    }

    try {
      let query = db.select().from(geofences);
      if (session?.user?.empresaId) {
        query = query.where(eq(geofences.empresaId, session.user.empresaId)) as any;
      }
      const rows = await query;
      if (Array.isArray(rows) && rows.length > 0) {
        const parsed = rows.map(dbRowToGeofence);
        return NextResponse.json(parsed);
      }
      if (Array.isArray(rows) && rows.length === 0) {
        return NextResponse.json([]);
      }
    } catch (dbError) {
      console.warn("DB query failed, using mock geofences fallback:", dbError);
    }

    const mocks = getMockGeofences();
    return NextResponse.json(mocks);
  } catch (error: any) {
    console.error("Error al obtener geocercas:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener geocercas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.nombre || typeof body.nombre !== "string" || !body.nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre de la geocerca es obligatorio" },
        { status: 400 }
      );
    }

    let session = null;
    try {
      session = await auth();
    } catch {
      // Auth lookup fallback
    }

    let empresaId = body.empresaId || session?.user?.empresaId;
    if (!empresaId) {
      try {
        const [firstEmpresa] = await db.select({ id: empresas.id }).from(empresas).limit(1);
        empresaId = firstEmpresa?.id || 1;
      } catch {
        empresaId = 1;
      }
    }

    try {
      const dbValues = {
        ...geofenceToDbValues(body),
        empresaId,
      };

      const [created] = await db.insert(geofences).values(dbValues as any).returning();
      if (created) {
        return NextResponse.json(dbRowToGeofence(created), { status: 201 });
      }
    } catch (dbError) {
      console.warn("DB insert failed, using mock creation fallback:", dbError);
    }

    const newGeofence = createMockGeofence({
      ...body,
      empresaId,
    });

    return NextResponse.json(newGeofence, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear geocerca:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
