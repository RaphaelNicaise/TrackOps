import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { vehicleDocuments } from "@/db/schema";
import { getDocumentStream } from "@/lib/storage";
import { eq } from "drizzle-orm";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

function toWebReadableStream(stream: any): ReadableStream {
  if (!stream) {
    throw new Error("Stream is empty");
  }
  if (typeof stream.transformToWebStream === "function") {
    return stream.transformToWebStream();
  }
  if (stream instanceof Readable) {
    return Readable.toWeb(stream) as ReadableStream;
  }
  return stream as ReadableStream;
}

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

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    if (!isSuperAdmin) {
      if (!session.user.empresaId || doc.empresaId !== session.user.empresaId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { stream, contentType, contentLength } = await getDocumentStream(
      doc.fileKey
    );

    const webStream = toWebReadableStream(stream);

    const headers = new Headers();
    headers.set(
      "Content-Type",
      doc.mimeType || contentType || "application/octet-stream"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(doc.fileName)}"`
    );
    if (contentLength) {
      headers.set("Content-Length", contentLength.toString());
    }

    return new NextResponse(webStream as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error downloading document:", error);
    return NextResponse.json(
      { error: "Error al descargar el documento" },
      { status: 500 }
    );
  }
}
