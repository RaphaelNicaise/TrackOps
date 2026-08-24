import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicleGroups, vehicleGroupMembers } from "@/db/schema";
import {
  getMockVehicleGroup,
  updateMockVehicleGroup,
  deleteMockVehicleGroup,
  dbRowToVehicleGroup,
  vehicleGroupToDbValues,
} from "@/lib/mock-vehicle-groups";
import { isDemoSession } from "@/lib/demo-mode";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de grupo inválido" }, { status: 400 });
    }

    const demo = await isDemoSession();

    try {
      const [group] = await db
        .select()
        .from(vehicleGroups)
        .where(eq(vehicleGroups.id, id));

      if (group) {
        const members = await db
          .select()
          .from(vehicleGroupMembers)
          .where(eq(vehicleGroupMembers.groupId, id));
        const vehicleIds = members.map((m) => m.vehicleId);
        return NextResponse.json(dbRowToVehicleGroup(group, vehicleIds));
      }
      if (!demo) {
        return NextResponse.json({ error: "Grupo de vehículos no encontrado" }, { status: 404 });
      }
    } catch (dbError) {
      console.warn("DB query failed, using mock group fallback:", dbError);
      if (!demo) {
        return NextResponse.json(
          { error: "No se pudo obtener el grupo de vehículos" },
          { status: 500 }
        );
      }
    }

    const mockGroup = getMockVehicleGroup(id);
    if (!mockGroup) {
      return NextResponse.json({ error: "Grupo de vehículos no encontrado" }, { status: 404 });
    }

    return NextResponse.json(mockGroup);
  } catch (error: any) {
    console.error("Error al obtener grupo de vehículos:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener grupo de vehículos" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID de grupo inválido" }, { status: 400 });
    }

    const body = await request.json();

    const vehicleIds: number[] | undefined = Array.isArray(body.vehicleIds)
      ? body.vehicleIds.map((v: any) => Number(v)).filter((v: number) => !isNaN(v))
      : undefined;

    const demo = await isDemoSession();

    try {
      const updateValues = vehicleGroupToDbValues(body);
      const [updated] = await db
        .update(vehicleGroups)
        .set(updateValues)
        .where(eq(vehicleGroups.id, id))
        .returning();

      if (updated) {
        if (vehicleIds !== undefined) {
          await db
            .delete(vehicleGroupMembers)
            .where(eq(vehicleGroupMembers.groupId, id));
          if (vehicleIds.length > 0) {
            await db.insert(vehicleGroupMembers).values(
              vehicleIds.map((vId) => ({
                groupId: id,
                vehicleId: vId,
              }))
            );
          }
        } else {
          const members = await db
            .select()
            .from(vehicleGroupMembers)
            .where(eq(vehicleGroupMembers.groupId, id));
          return NextResponse.json(
            dbRowToVehicleGroup(updated, members.map((m) => m.vehicleId))
          );
        }

        return NextResponse.json(dbRowToVehicleGroup(updated, vehicleIds || []));
      }
      if (!demo) {
        return NextResponse.json({ error: "Grupo de vehículos no encontrado" }, { status: 404 });
      }
    } catch (dbError) {
      console.warn("DB update failed, using mock update fallback:", dbError);
      if (!demo) {
        return NextResponse.json(
          { error: "No se pudo actualizar el grupo de vehículos" },
          { status: 500 }
        );
      }
    }

    const updatedMock = updateMockVehicleGroup(id, {
      ...body,
      ...(vehicleIds !== undefined ? { vehicleIds } : {}),
    });
    if (!updatedMock) {
      return NextResponse.json({ error: "Grupo de vehículos no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedMock);
  } catch (error: any) {
    console.error("Error al actualizar grupo de vehículos:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar grupo de vehículos" },
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
      return NextResponse.json({ error: "ID de grupo inválido" }, { status: 400 });
    }

    const demo = await isDemoSession();

    try {
      const deletedRows = await db
        .delete(vehicleGroups)
        .where(eq(vehicleGroups.id, id))
        .returning();

      if (deletedRows && deletedRows.length > 0) {
        deleteMockVehicleGroup(id);
        return NextResponse.json({ success: true });
      }
      if (!demo) {
        return NextResponse.json({ error: "Grupo de vehículos no encontrado" }, { status: 404 });
      }
    } catch (dbError) {
      console.warn("DB delete failed, using mock delete fallback:", dbError);
      if (!demo) {
        return NextResponse.json(
          { error: "No se pudo eliminar el grupo de vehículos" },
          { status: 500 }
        );
      }
    }

    const success = deleteMockVehicleGroup(id);
    if (!success) {
      return NextResponse.json({ error: "Grupo de vehículos no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error al eliminar grupo de vehículos:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar grupo de vehículos" },
      { status: 500 }
    );
  }
}
