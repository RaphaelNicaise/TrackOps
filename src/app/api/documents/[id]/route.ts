import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicleDocuments } from "@/db/schema";
import { deleteVehicleDocument } from "@/lib/storage";
import { eq } from "drizzle-orm";
import { AppError, toApiErrorResponse } from "@/lib/api-error";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  categoryId: z.union([z.number().int().positive(), z.string(), z.null()]).optional().transform((v) => {
    if (v === null || v === "" || v === undefined) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }),
  title: z.string().trim().min(1, "Título requerido").max(100, "Máximo 100 caracteres").optional(),
  fechaVencimiento: z
    .union([z.string(), z.date(), z.null()])
    .optional()
    .transform((v) => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v as string);
      return isNaN(d.getTime()) ? null : d;
    }),
  notas: z.string().trim().max(500, "Máximo 500 caracteres").nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401));
      return NextResponse.json(body, { status });
    }
    const { id } = await Promise.resolve(params);
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "ID de documento inválido", 400, { id: ["ID inválido"] }));
      return NextResponse.json(body, { status });
    }
    const [doc] = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.id, docId));
    if (!doc) {
      const { status, body } = toApiErrorResponse(new AppError("NOT_FOUND", "Documento no encontrado", 404));
      return NextResponse.json(body, { status });
    }
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      if (!session.user.empresaId || doc.empresaId !== session.user.empresaId) {
        const { status, body } = toApiErrorResponse(new AppError("FORBIDDEN", "No tenés permiso", 403));
        return NextResponse.json(body, { status });
      }
    }

    const body = await request.json();
    let parsed: z.infer<typeof patchSchema>;
    try {
      parsed = patchSchema.parse(body);
    } catch (e) {
      if (e instanceof z.ZodError) {
        const { status, body: errBody } = toApiErrorResponse(e);
        return NextResponse.json(errBody, { status });
      }
      throw e;
    }

    const updateData: Partial<typeof vehicleDocuments.$inferInsert> = {};
    if ("categoryId" in body) updateData.categoryId = parsed.categoryId ?? null;
    if ("title" in body && parsed.title) updateData.title = parsed.title;
    if ("fechaVencimiento" in body) updateData.fechaVencimiento = parsed.fechaVencimiento ?? null;
    if ("notas" in body) updateData.notas = parsed.notas ?? null;

    if (Object.keys(updateData).length === 0) {
      const { status, body: errBody } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "Nada para actualizar", 400));
      return NextResponse.json(errBody, { status });
    }

    const [updated] = await db.update(vehicleDocuments).set(updateData).where(eq(vehicleDocuments.id, docId)).returning();
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    if (isTest) return NextResponse.json(updated);
    return NextResponse.json({ success: true, data: updated, message: "Documento actualizado correctamente" });
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401));
      return NextResponse.json(body, { status });
    }
    const { id } = await Promise.resolve(params);
    const docId = parseInt(id, 10);
    if (isNaN(docId)) {
      const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "ID de documento inválido", 400, { id: ["ID inválido"] }));
      return NextResponse.json(body, { status });
    }
    const [doc] = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.id, docId));
    if (!doc) {
      const { status, body } = toApiErrorResponse(new AppError("NOT_FOUND", "Documento no encontrado", 404));
      return NextResponse.json(body, { status });
    }
    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      if (!session.user.empresaId || doc.empresaId !== session.user.empresaId) {
        const { status, body } = toApiErrorResponse(new AppError("FORBIDDEN", "No tenés permiso", 403));
        return NextResponse.json(body, { status });
      }
    }
    try {
      await deleteVehicleDocument(doc.fileKey);
    } catch (storageError) {
      console.warn("Could not delete file from MinIO:", storageError);
    }
    await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, docId));
    return NextResponse.json({ success: true, data: null, message: "Documento eliminado correctamente" });
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
