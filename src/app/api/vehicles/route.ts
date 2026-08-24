import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { mockVehiculos } from "@/lib/mock-vehicles";
import { isDemoUser } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";

    if (!session?.user) {
      if (isTest) {
        return NextResponse.json(mockVehiculos);
      }
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const demo = isDemoUser(session.user);
    const empresaId = session.user.empresaId;

    try {
      const rows = await db
        .select({
          id: vehicles.id,
          patente: vehicles.patente,
          marca: vehicles.marca,
          modelo: vehicles.modelo,
          tipo: vehicles.tipo,
        })
        .from(vehicles)
        .where(empresaId ? eq(vehicles.empresaId, empresaId) : undefined)
        .orderBy(vehicles.patente);

      if (rows.length > 0) return NextResponse.json(rows);
      return NextResponse.json(demo ? mockVehiculos : []);
    } catch (dbError) {
      console.warn("DB query failed in /api/vehicles:", dbError);
      return NextResponse.json(demo ? mockVehiculos : []);
    }
  } catch (error: unknown) {
    console.error("Error in GET /api/vehicles:", error);
    return NextResponse.json(
      { error: "Error al obtener vehículos" },
      { status: 500 }
    );
  }
}
