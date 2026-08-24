import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { documentCategories, vehicles } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { error: "ID de vehículo inválido" },
        { status: 400 }
      );
    }

    // Determine empresaId
    let empresaId = session.user.empresaId;
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";

    if (!empresaId) {
      if (isSuperAdmin) {
        const [vehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, vehicleId));
        if (!vehicle) {
          return NextResponse.json(
            { error: "Vehículo no encontrado" },
            { status: 404 }
          );
        }
        empresaId = vehicle.empresaId;
      } else {
        return NextResponse.json({ error: "Unauthorized: falta empresa" }, { status: 401 });
      }
    } else {
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId));
      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehículo no encontrado" },
          { status: 404 }
        );
      }
      if (vehicle.empresaId !== empresaId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    let categories = await db
      .select()
      .from(documentCategories)
      .where(eq(documentCategories.empresaId, empresaId))
      .orderBy(asc(documentCategories.id));

    // Si no existen categorías para la empresa, inicializar con las categorías por defecto
    if (categories.length === 0) {
      const defaultCategories = [
        { nombre: "Seguro", color: "blue", empresaId },
        { nombre: "Cédula", color: "emerald", empresaId },
        { nombre: "RTO / VTV", color: "amber", empresaId },
        { nombre: "Service", color: "purple", empresaId },
      ];
      categories = await db
        .insert(documentCategories)
        .values(defaultCategories)
        .returning();
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías de documentos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const vehicleId = parseInt(id, 10);
    if (isNaN(vehicleId)) {
      return NextResponse.json(
        { error: "ID de vehículo inválido" },
        { status: 400 }
      );
    }

    let empresaId = session.user.empresaId;
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";

    if (!empresaId) {
      if (isSuperAdmin) {
        const [vehicle] = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, vehicleId));
        if (!vehicle) {
          return NextResponse.json(
            { error: "Vehículo no encontrado" },
            { status: 404 }
          );
        }
        empresaId = vehicle.empresaId;
      } else {
        return NextResponse.json({ error: "Unauthorized: falta empresa" }, { status: 401 });
      }
    } else {
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId));
      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehículo no encontrado" },
          { status: 404 }
        );
      }
      if (vehicle.empresaId !== empresaId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { nombre, color } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre de la categoría es obligatorio" },
        { status: 400 }
      );
    }

    const [newCategory] = await db
      .insert(documentCategories)
      .values({
        empresaId,
        nombre: nombre.trim(),
        color: typeof color === "string" && color.trim() ? color.trim() : "blue",
      })
      .returning();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Error al crear la categoría" },
      { status: 500 }
    );
  }
}
