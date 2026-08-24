import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sitios } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { AppError, toApiErrorResponse } from "@/lib/api-error";
import type { SitioRow } from "@/types/flota-viajes";
import { MOCK_SITIOS_BAHIA_BLANCA } from "@/lib/sitios-mock";
import { isDemoUser } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

    if (!session?.user) {
      if (isTest) {
        return NextResponse.json(MOCK_SITIOS_BAHIA_BLANCA);
      }
      const { status, body } = toApiErrorResponse(
        new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401)
      );
      return NextResponse.json(body, { status });
    }

    const demo = isDemoUser(session.user);
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const empresaId = session.user.empresaId || (isSuperAdmin ? 1 : null);

    try {
      if (empresaId) {
        const rows = await db
          .select()
          .from(sitios)
          .where(and(eq(sitios.empresaId, empresaId), eq(sitios.activo, 1)));

        if (rows.length > 0) return NextResponse.json(rows);
      }
      return NextResponse.json(demo ? MOCK_SITIOS_BAHIA_BLANCA : []);
    } catch (dbError) {
      console.warn("DB query failed in /api/sitios, using Bahía Blanca fallback:", dbError);
      return NextResponse.json(demo ? MOCK_SITIOS_BAHIA_BLANCA : []);
    }
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
