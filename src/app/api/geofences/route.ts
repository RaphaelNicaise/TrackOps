import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { geofences } from "@/db/schema";
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
      if (rows && rows.length > 0) {
        const parsed = rows.map(dbRowToGeofence);
        return NextResponse.json(parsed);
      }
    } catch (dbError) {
      console.warn("DB query failed, using mock geofences fallback:", dbError);
    }

    const mocks = getMockGeofences();
    return NextResponse.json(mocks);
  } catch (error: any) {
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

    const empresaId = body.empresaId || session?.user?.empresaId || 1;

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
    return NextResponse.json(
      { error: error.message || "Error al procesar la solicitud" },
      { status: 400 }
    );
  }
}
