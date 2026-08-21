import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { scanAllFleetAlerts } from "@/lib/alerts/triggers";
import { AppError, toApiErrorResponse } from "@/lib/api-error";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const queryEmpresaId = url.searchParams.get("empresaId");

    if (!session?.user) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401));
      return NextResponse.json(body, { status });
    }
    if (!session.user.empresaId && !queryEmpresaId) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "No autorizado: falta empresa", 401));
      return NextResponse.json(body, { status });
    }

    let empresaId = session.user.empresaId as number;
    if (queryEmpresaId) {
      const parsed = parseInt(queryEmpresaId, 10);
      if (!isNaN(parsed)) {
        if (session.user.role === "SUPER_ADMIN") {
          empresaId = parsed;
        } else if (parsed !== empresaId) {
          const { status, body } = toApiErrorResponse(new AppError("FORBIDDEN", "No tenés permiso para consultar otra empresa", 403));
          return NextResponse.json(body, { status });
        } else {
          empresaId = parsed;
        }
      }
    }

    if (!empresaId) {
      const { status, body } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Falta empresaId", 401));
      return NextResponse.json(body, { status });
    }

    const summary = await scanAllFleetAlerts(empresaId);
    return NextResponse.json({ success: true, data: summary, results: summary, count: summary.totalTriggered });
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    let body: { empresaId?: number | string } = {};
    try {
      body = await req.json();
    } catch {
      // Empty body
    }

    if (!session?.user) {
      const { status, body: errBody } = toApiErrorResponse(new AppError("UNAUTHORIZED", "Tenés que iniciar sesión", 401));
      return NextResponse.json(errBody, { status });
    }

    let empresaId = session.user.empresaId as number | undefined;
    if (body.empresaId != null) {
      const parsed = parseInt(String(body.empresaId), 10);
      if (!isNaN(parsed)) {
        if (session.user.role === "SUPER_ADMIN") {
          empresaId = parsed;
        } else if (parsed !== empresaId) {
          const { status, body: errBody } = toApiErrorResponse(new AppError("FORBIDDEN", "No tenés permiso para consultar otra empresa", 403));
          return NextResponse.json(errBody, { status });
        }
      }
    }

    if (!empresaId) {
      const { status, body: errBody } = toApiErrorResponse(new AppError("UNAUTHORIZED", "No autorizado: falta empresa", 401));
      return NextResponse.json(errBody, { status });
    }

    const summary = await scanAllFleetAlerts(empresaId);
    return NextResponse.json({ success: true, data: summary, results: summary, count: summary.totalTriggered });
  } catch (error: unknown) {
    const { status, body } = toApiErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
