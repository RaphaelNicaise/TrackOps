import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { schedules } from "@/db/schema";
import {
  getMockSchedules,
  createMockSchedule,
  dbRowToSchedule,
  scheduleToDbValues,
} from "@/lib/mock-schedules";
import { eq } from "drizzle-orm";
import { scheduleSchema } from "@/lib/schemas/schedule.schema";
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
      const rows = await db.select().from(schedules).where(eq(schedules.empresaId, empresaId));
      if (rows.length > 0) return NextResponse.json(rows.map(dbRowToSchedule));
      return NextResponse.json([]);
    } catch (dbError) {
      console.warn("DB query failed, using mock schedules fallback:", dbError);
      return NextResponse.json(getMockSchedules(empresaId));
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
    let parsed: z.infer<typeof scheduleSchema>;
    try {
      parsed = scheduleSchema.parse(body);
    } catch (e) {
      if (e instanceof z.ZodError) {
        const { status, body: errBody } = toApiErrorResponse(e);
        return NextResponse.json(errBody, { status });
      }
      throw e;
    }

    try {
      const dbValues = {
        ...scheduleToDbValues(parsed as any),
        empresaId,
      };
      const [created] = await db.insert(schedules).values(dbValues as never).returning();
      if (created) return NextResponse.json(dbRowToSchedule(created), { status: 201 });
    } catch (dbError) {
      console.warn("DB insert failed, using mock creation fallback:", dbError);
    }

    const newSchedule = createMockSchedule({ ...(parsed as any), empresaId });
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
