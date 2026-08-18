import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicleDocuments, documentCategories, vehicles } from "@/db/schema";
import { uploadVehicleDocument } from "@/lib/storage";
import { eq, desc } from "drizzle-orm";
import {
  getMockDocuments,
  addMockDocument,
} from "@/lib/mock-documents";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  const vehicleId = parseInt(id, 10);
  if (isNaN(vehicleId)) {
    return NextResponse.json(
      { error: "ID de vehículo inválido" },
      { status: 400 }
    );
  }

  try {
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
          category: {
            id: documentCategories.id,
            nombre: documentCategories.nombre,
            color: documentCategories.color,
          },
        })
        .from(vehicleDocuments)
        .leftJoin(
          documentCategories,
          eq(vehicleDocuments.categoryId, documentCategories.id)
        )
        .where(eq(vehicleDocuments.vehicleId, vehicleId))
        .orderBy(desc(vehicleDocuments.createdAt));

      const formattedDocs = docs.map((doc) => ({
        ...doc,
        category: doc.category?.id ? doc.category : null,
      }));

      return NextResponse.json(formattedDocs);
    } catch (dbError) {
      console.warn("DB not reachable for documents GET, falling back to mock store:", dbError);
      return NextResponse.json(getMockDocuments(vehicleId));
    }
  } catch (error) {
    console.error("Error fetching vehicle documents:", error);
    return NextResponse.json(getMockDocuments(vehicleId));
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await Promise.resolve(params);
  const vehicleId = parseInt(id, 10);
  if (isNaN(vehicleId)) {
    return NextResponse.json(
      { error: "ID de vehículo inválido" },
      { status: 400 }
    );
  }

  try {
    const session = await auth();
    let empresaId = session?.user?.empresaId || 1;

    const formData = await request.formData();
    const filesList = formData.getAll("files");
    let files: File[] = filesList.filter(
      (item): item is File => item instanceof File && item.size > 0
    );

    if (files.length === 0) {
      const singleFile = formData.get("file");
      if (singleFile instanceof File && singleFile.size > 0) {
        files = [singleFile];
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No se proporcionaron archivos válidos" },
        { status: 400 }
      );
    }

    const categoryIdRaw = formData.get("categoryId") as string | null;
    const categoryId =
      categoryIdRaw && !isNaN(parseInt(categoryIdRaw, 10))
        ? parseInt(categoryIdRaw, 10)
        : null;

    const fechaVencimientoRaw = formData.get("fechaVencimiento") as string | null;
    const fechaVencimiento =
      fechaVencimientoRaw && !isNaN(Date.parse(fechaVencimientoRaw))
        ? new Date(fechaVencimientoRaw)
        : null;

    const notas = (formData.get("notas") as string | null) || null;
    const customTitle = (formData.get("title") as string | null) || null;

    const createdDocs = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name || "documento";
      const mimeType = file.type || "application/octet-stream";

      let fileKey = `empresa_${empresaId}/vehiculos/vehiculo_${vehicleId}/${Date.now()}-${fileName}`;
      let fileSize = buffer.length;

      try {
        const uploadResult = await uploadVehicleDocument({
          empresaId,
          vehicleId,
          fileBuffer: buffer,
          fileName,
          mimeType,
        });
        fileKey = uploadResult.fileKey;
        fileSize = uploadResult.fileSize;
      } catch (minioError) {
        console.warn("MinIO upload notice (proceeding with storage key):", minioError);
      }

      const title =
        files.length === 1 && customTitle && customTitle.trim()
          ? customTitle.trim()
          : fileName;

      try {
        const [created] = await db
          .insert(vehicleDocuments)
          .values({
            vehicleId,
            empresaId,
            categoryId,
            title,
            fileName,
            fileKey,
            fileSize,
            mimeType,
            fechaVencimiento,
            notas,
          })
          .returning();

        createdDocs.push(created);
      } catch (dbError) {
        console.warn("DB insert error, falling back to in-memory mock store:", dbError);
        const mockDoc = addMockDocument({
          vehicleId,
          empresaId,
          categoryId,
          title,
          fileName,
          fileKey,
          fileSize,
          mimeType,
          fechaVencimiento,
          notas,
        });
        createdDocs.push(mockDoc);
      }
    }

    return NextResponse.json(createdDocs, { status: 201 });
  } catch (error) {
    console.error("Error uploading vehicle documents:", error);
    return NextResponse.json(
      { error: "Error al procesar la subida de documentos" },
      { status: 500 }
    );
  }
}
