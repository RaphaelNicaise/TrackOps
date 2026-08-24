import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { scheduleViolations } from "@/db/schema";
import { getMockScheduleViolations, dbRowToViolation } from "@/lib/mock-schedules";
import { isDemoUser } from "@/lib/demo-mode";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleIdParam = searchParams.get("scheduleId");
    const vehicleIdParam = searchParams.get("vehicleId");

    const scheduleId = scheduleIdParam ? parseInt(scheduleIdParam, 10) : undefined;
    const vehicleId = vehicleIdParam ? parseInt(vehicleIdParam, 10) : undefined;

    let session = null;
    try {
      session = await auth();
    } catch {
      // Session lookup fallback
    }

    const empresaId = session?.user?.empresaId || 1;

    try {
      let conditions = [];
      if (session?.user?.empresaId) {
        conditions.push(eq(scheduleViolations.empresaId, session.user.empresaId));
      }
      if (scheduleId && !isNaN(scheduleId)) {
        conditions.push(eq(scheduleViolations.scheduleId, scheduleId));
      }
      if (vehicleId && !isNaN(vehicleId)) {
        conditions.push(eq(scheduleViolations.vehicleId, vehicleId));
      }

      let query = db
        .select()
        .from(scheduleViolations)
        .orderBy(desc(scheduleViolations.fechaInicio));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const rows = await query;
      if (Array.isArray(rows) && rows.length > 0) {
        const parsed = rows.map(dbRowToViolation);
        return NextResponse.json(parsed);
      }
      if (Array.isArray(rows) && rows.length === 0) {
        return NextResponse.json([]);
      }
    } catch (dbError) {
      console.warn("DB query failed, using mock schedule violations fallback:", dbError);
      if (!session?.user || !isDemoUser(session.user)) {
        return NextResponse.json([]);
      }
    }

    if (!session?.user || !isDemoUser(session.user)) {
      return NextResponse.json([]);
    }

    const mocks = getMockScheduleViolations({
      empresaId,
      scheduleId: scheduleId && !isNaN(scheduleId) ? scheduleId : undefined,
      vehicleId: vehicleId && !isNaN(vehicleId) ? vehicleId : undefined,
    });

    return NextResponse.json(mocks);
  } catch (error: any) {
    console.error("Error al obtener infracciones de horario:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener infracciones de horario" },
      { status: 500 }
    );
  }
}
