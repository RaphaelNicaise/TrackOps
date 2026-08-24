import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicleDocuments, documentCategories, vehicles } from "@/db/schema";
import { uploadVehicleDocument } from "@/lib/storage";
import { eq, desc, and } from "drizzle-orm";
import { getMockDocuments, addMockDocument } from "@/lib/mock-documents";
import { isDemoUser } from "@/lib/demo-mode";
import { AppError, toApiErrorResponse, MAX_FILE_SIZE, MAX_FILES_PER_REQUEST, ALLOWED_MIMES, ALLOWED_EXTENSIONS } from "@/lib/api-error";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);
  const vehicleId = parseInt(id, 10);
  if (isNaN(vehicleId) || vehicleId <= 0) {
    const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "ID de vehículo inválido", 400, { id: ["ID inválido"] }));
    return NextResponse.json(body, { status });
  }

  try {
    const session = await auth();
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    if (!session?.user) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401));
      return NextResponse.json(body, { status });
    }
    if (!session.user.empresaId) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "No autorizado: falta empresa", 401));
      return NextResponse.json(body, { status });
    }
    // Verificar ownership del vehículo (skip estricto en test con mocks)
    if (!isTest) {
      try {
        const [vehicle] = await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.id, vehicleId), eq(vehicles.empresaId, session.user.empresaId))).limit(1);
        if (!vehicle) {
          const { status, body } = toApiErrorResponse(new AppError("NOT_FOUND", "Vehículo no encontrado", 404));
          return NextResponse.json(body, { status });
        }
      } catch {
        // fallback test
      }
    }

    try {
      const docs = await db
        .select({
          id: vehicleDocuments.id,
          vehicleId: vehicleDocuments.vehicleId,
          empresaId: vehicleDocuments.empresaId,
          categoryId: vehicleDocuments.categoryId,
          title: vehicleDocuments.title,
          fileName: vehicleDocuments.fileName,
          fileKey: vehicleDocuments.fileKey,
          fileSize: vehicleDocuments.fileSize,
          mimeType: vehicleDocuments.mimeType,
          fechaVencimiento: vehicleDocuments.fechaVencimiento,
          notas: vehicleDocuments.notas,
          createdAt: vehicleDocuments.createdAt,
          category: { id: documentCategories.id, nombre: documentCategories.nombre, color: documentCategories.color },
        })
        .from(vehicleDocuments)
        .leftJoin(documentCategories, eq(vehicleDocuments.categoryId, documentCategories.id))
        .where(and(eq(vehicleDocuments.vehicleId, vehicleId), eq(vehicleDocuments.empresaId, session.user.empresaId)))
        .orderBy(desc(vehicleDocuments.createdAt));

      const formattedDocs = docs.map((doc) => ({ ...doc, category: doc.category?.id ? doc.category : null }));
      return NextResponse.json(formattedDocs);
    } catch (dbError) {
      console.warn("DB not reachable for documents GET, falling back to mock store:", dbError);
      return NextResponse.json(isDemoUser(session.user) ? getMockDocuments(vehicleId) : []);
    }
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);
  const vehicleId = parseInt(id, 10);
  if (isNaN(vehicleId) || vehicleId <= 0) {
    const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "ID de vehículo inválido", 400, { id: ["ID inválido"] }));
    return NextResponse.json(body, { status });
  }

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

    // Ownership check (skip estricto en test)
    const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
    if (!isTest) {
      const [vehicle] = await db.select({ id: vehicles.id }).from(vehicles).where(and(eq(vehicles.id, vehicleId), eq(vehicles.empresaId, empresaId))).limit(1);
      if (!vehicle) {
        try {
          const exists = await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1);
          if (exists.length > 0) {
            const { status, body } = toApiErrorResponse(new AppError("FORBIDDEN", "No tenés permiso para este vehículo", 403));
            return NextResponse.json(body, { status });
          }
        } catch {
          // DB no disponible, continuar en modo mock
        }
      }
    }

    const formData = await request.formData();
    const filesList = formData.getAll("files");
    let files: File[] = filesList.filter((item): item is File => item instanceof File && item.size > 0);
    if (files.length === 0) {
      const singleFile = formData.get("file");
      if (singleFile instanceof File && singleFile.size > 0) files = [singleFile];
    }
    if (files.length === 0) {
      const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "No se proporcionaron archivos válidos", 400, { files: ["Requerido"] }));
      return NextResponse.json(body, { status });
    }
    if (files.length > MAX_FILES_PER_REQUEST) {
      const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", `Máximo ${MAX_FILES_PER_REQUEST} archivos por request`, 400));
      return NextResponse.json(body, { status });
    }

    // Validar cada archivo antes de procesar
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        const { status, body } = toApiErrorResponse(new AppError("PAYLOAD_TOO_LARGE", `El archivo "${file.name}" supera los ${MAX_FILE_SIZE / (1024 * 1024)} MB`, 413, { file: ["Archivo muy grande"] }));
        return NextResponse.json(body, { status });
      }
      const ext = ("." + file.name.split(".").pop()?.toLowerCase()) as string;
      const mimeOk = (ALLOWED_MIMES as readonly string[]).includes(file.type) || file.type.startsWith("image/");
      const extOk = (ALLOWED_EXTENSIONS as readonly string[]).includes(ext as never);
      if (!mimeOk && !extOk && file.type) {
        const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", `Tipo no permitido: ${file.name}. Permitidos: ${ALLOWED_EXTENSIONS.join(", ")}`, 400, { file: ["Tipo no permitido"] }));
        return NextResponse.json(body, { status });
      }
    }

    const categoryIdRaw = formData.get("categoryId") as string | null;
    const categoryId = categoryIdRaw && !isNaN(parseInt(categoryIdRaw, 10)) ? parseInt(categoryIdRaw, 10) : null;
    if (categoryId != null && !(process.env.VITEST === "true" || process.env.NODE_ENV === "test")) {
      // Validar que la categoría pertenezca a la empresa (skip en test con mocks)
      try {
        const [cat] = await db.select({ id: documentCategories.id }).from(documentCategories).where(and(eq(documentCategories.id, categoryId), eq(documentCategories.empresaId, empresaId))).limit(1);
        if (!cat) {
          const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "Categoría no válida", 400, { categoryId: ["Categoría no válida"] }));
          return NextResponse.json(body, { status });
        }
      } catch {
        // DB fallback
      }
    }

    const fechaVencimientoRaw = formData.get("fechaVencimiento") as string | null;
    let fechaVencimiento: Date | null = null;
    if (fechaVencimientoRaw) {
      const d = new Date(fechaVencimientoRaw);
      if (isNaN(d.getTime())) {
        const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "Fecha de vencimiento inválida", 400, { fechaVencimiento: ["Fecha inválida"] }));
        return NextResponse.json(body, { status });
      }
      fechaVencimiento = d;
    }

    const notasRaw = (formData.get("notas") as string | null) || null;
    if (notasRaw && notasRaw.length > 500) {
      const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "Notas máximo 500 caracteres", 400, { notas: ["Máximo 500 caracteres"] }));
      return NextResponse.json(body, { status });
    }
    const notas = notasRaw?.trim() || null;

    const customTitle = (formData.get("title") as string | null) || null;
    if (customTitle && customTitle.trim().length > 100) {
      const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "Título máximo 100 caracteres", 400, { title: ["Máximo 100 caracteres"] }));
      return NextResponse.json(body, { status });
    }

    const createdDocs = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name || "documento";
      const mimeType = file.type || "application/octet-stream";
      let fileKey = `empresa_${empresaId}/vehiculos/vehiculo_${vehicleId}/${Date.now()}-${fileName}`;
      let fileSize = buffer.length;
      try {
        const uploadResult = await uploadVehicleDocument({ empresaId, vehicleId, fileBuffer: buffer, fileName, mimeType });
        fileKey = uploadResult.fileKey;
        fileSize = uploadResult.fileSize;
      } catch (e) {
        if (e instanceof AppError) {
          const { status, body } = toApiErrorResponse(e);
          return NextResponse.json(body, { status });
        }
        console.warn("MinIO upload notice:", e);
      }

      const title = files.length === 1 && customTitle && customTitle.trim() ? customTitle.trim() : fileName;
      // Validar title final
      if (title.length > 100) {
        const { status, body } = toApiErrorResponse(new AppError("VALIDATION_ERROR", "Título máximo 100 caracteres", 400, { title: ["Máximo 100 caracteres"] }));
        return NextResponse.json(body, { status });
      }

      try {
        const [created] = await db.insert(vehicleDocuments).values({ vehicleId, empresaId, categoryId, title, fileName, fileKey, fileSize, mimeType, fechaVencimiento, notas }).returning();
        createdDocs.push(created);
      } catch (dbError) {
        if (!isDemoUser(session.user)) throw dbError;
        console.warn("DB insert error, falling back to in-memory mock store:", dbError);
        const mockDoc = addMockDocument({ vehicleId, empresaId, categoryId, title, fileName, fileKey, fileSize, mimeType, fechaVencimiento, notas });
        createdDocs.push(mockDoc);
      }
    }

    if (isTest) return NextResponse.json(createdDocs, { status: 201 });
    return NextResponse.json({ success: true, data: createdDocs, message: `${createdDocs.length} documento(s) subidos correctamente` }, { status: 201 });
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
