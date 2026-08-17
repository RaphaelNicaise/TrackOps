import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicleDocuments } from "@/db/schema";
import { deleteVehicleDocument } from "@/lib/storage";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return NextResponse.json(
        { error: "ID de documento inválido" },
        { status: 400 }
      );
    }

    const [doc] = await db
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.id, docId));

    if (!doc) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    if (session.user.empresaId && doc.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Partial<typeof vehicleDocuments.$inferInsert> = {};

    if ("categoryId" in body) {
      if (
        body.categoryId === null ||
        body.categoryId === "" ||
        body.categoryId === undefined
      ) {
        updateData.categoryId = null;
      } else {
        const catId = Number(body.categoryId);
        updateData.categoryId = isNaN(catId) ? null : catId;
      }
    }

    if ("title" in body && typeof body.title === "string") {
      const trimmedTitle = body.title.trim();
      if (trimmedTitle) {
        updateData.title = trimmedTitle;
      }
    }

    if ("fechaVencimiento" in body) {
      if (!body.fechaVencimiento) {
        updateData.fechaVencimiento = null;
      } else {
        const parsedDate = new Date(body.fechaVencimiento);
        updateData.fechaVencimiento = isNaN(parsedDate.getTime())
          ? null
          : parsedDate;
      }
    }

    if ("notas" in body) {
      updateData.notas =
        typeof body.notas === "string" ? body.notas.trim() : null;
    }

    const [updated] = await db
      .update(vehicleDocuments)
      .set(updateData)
      .where(eq(vehicleDocuments.id, docId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating vehicle document:", error);
    return NextResponse.json(
      { error: "Error al actualizar el documento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      return NextResponse.json(
        { error: "ID de documento inválido" },
        { status: 400 }
      );
    }

    const [doc] = await db
      .select()
      .from(vehicleDocuments)
      .where(eq(vehicleDocuments.id, docId));

    if (!doc) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    if (session.user.empresaId && doc.empresaId !== session.user.empresaId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Intentar borrar el archivo físico en MinIO
    try {
      await deleteVehicleDocument(doc.fileKey);
    } catch (storageError) {
      console.warn("Could not delete file from MinIO:", storageError);
    }

    // Borrar de la base de datos
    await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, docId));

    return NextResponse.json({
      success: true,
      message: "Documento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error deleting vehicle document:", error);
    return NextResponse.json(
      { error: "Error al eliminar el documento" },
      { status: 500 }
    );
  }
}
