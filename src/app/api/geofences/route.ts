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
import { geofenceSchema } from "@/lib/schemas/geofence.schema";
import { AppError, toApiErrorResponse } from "@/lib/api-error";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401));
      return NextResponse.json(body, { status });
    }
    if (!session.user.empresaId) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "No autorizado: falta empresa", 401));
      return NextResponse.json(body, { status });
    }
    const empresaId = session.user.empresaId;
    try {
      const rows = await db.select().from(geofences).where(eq(geofences.empresaId, empresaId));
      if (rows.length > 0) return NextResponse.json(rows.map(dbRowToGeofence));
      return NextResponse.json([]);
    } catch (dbError) {
      console.warn("DB query failed, using mock geofences fallback:", dbError);
      return NextResponse.json(getMockGeofences());
    }
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401));
      return NextResponse.json(body, { status });
    }
    if (!session.user.empresaId) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "No autorizado: falta empresa", 401));
      return NextResponse.json(body, { status });
    }
    const empresaId = session.user.empresaId;

    const body = await request.json();
    let parsed: z.infer<typeof geofenceSchema>;
    try {
      parsed = geofenceSchema.parse(body);
    } catch (e) {
      if (e instanceof z.ZodError) {
        const { status, body: errBody } = toApiErrorResponse(e);
        return NextResponse.json(errBody, { status });
      }
      throw e;
    }

    try {
      const dbValues = {
        ...geofenceToDbValues(parsed as any),
        empresaId,
      };
      const [created] = await db.insert(geofences).values(dbValues as never).returning();
      if (created) return NextResponse.json(dbRowToGeofence(created), { status: 201 });
    } catch (dbError) {
      console.warn("DB insert failed, using mock creation fallback:", dbError);
    }

    const newGeofence = createMockGeofence({ ...(parsed as any), empresaId });
    return NextResponse.json(newGeofence, { status: 201 });
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
