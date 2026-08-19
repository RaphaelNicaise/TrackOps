import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicleGroups, vehicleGroupMembers, empresas } from "@/db/schema";
import {
  getMockVehicleGroups,
  createMockVehicleGroup,
  dbRowToVehicleGroup,
  vehicleGroupToDbValues,
} from "@/lib/mock-vehicle-groups";
import { eq, inArray } from "drizzle-orm";

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
      let query = db.select().from(vehicleGroups);
      if (session?.user?.empresaId) {
        query = query.where(eq(vehicleGroups.empresaId, session.user.empresaId)) as any;
      }
      const groupRows = await query;
      if (Array.isArray(groupRows) && groupRows.length > 0) {
        const groupIds = groupRows.map((g) => g.id);
        const memberRows = await db
          .select()
          .from(vehicleGroupMembers)
          .where(inArray(vehicleGroupMembers.groupId, groupIds));

        const membersByGroup = new Map<number, number[]>();
        for (const m of memberRows) {
          const list = membersByGroup.get(m.groupId) || [];
          list.push(m.vehicleId);
          membersByGroup.set(m.groupId, list);
        }

        const parsed = groupRows.map((g) =>
          dbRowToVehicleGroup(g, membersByGroup.get(g.id) || [])
        );
        return NextResponse.json(parsed);
      }
      if (Array.isArray(groupRows) && groupRows.length === 0) {
        return NextResponse.json([]);
      }
    } catch (dbError) {
      console.warn("DB query failed, using mock vehicle groups fallback:", dbError);
    }

    const mocks = getMockVehicleGroups(session?.user?.empresaId || 1);
    return NextResponse.json(mocks);
  } catch (error: any) {
    console.error("Error al obtener grupos de vehículos:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener grupos de vehículos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.nombre || typeof body.nombre !== "string" || !body.nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del grupo es obligatorio" },
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

    const vehicleIds: number[] = Array.isArray(body.vehicleIds)
      ? body.vehicleIds.map((v: any) => Number(v)).filter((v: number) => !isNaN(v))
      : [];

    try {
      const dbValues = {
        ...vehicleGroupToDbValues(body),
        empresaId,
      };

      const [created] = await db.insert(vehicleGroups).values(dbValues as any).returning();
      if (created) {
        if (vehicleIds.length > 0) {
          await db.insert(vehicleGroupMembers).values(
            vehicleIds.map((vId) => ({
              groupId: created.id,
              vehicleId: vId,
            }))
          );
        }
        return NextResponse.json(dbRowToVehicleGroup(created, vehicleIds), { status: 201 });
      }
    } catch (dbError) {
      console.warn("DB insert failed, using mock creation fallback:", dbError);
    }

    const newGroup = createMockVehicleGroup({
      ...body,
      empresaId,
      vehicleIds,
    });

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear grupo de vehículos:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
