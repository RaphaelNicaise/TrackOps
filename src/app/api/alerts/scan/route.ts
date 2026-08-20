import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { scanAllFleetAlerts } from "@/lib/alerts/triggers";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const url = new URL(req.url);
    const queryEmpresaId = url.searchParams.get("empresaId");

    if (!session && !queryEmpresaId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let empresaId = 1;
    if (session?.user?.empresaId) {
      empresaId = session.user.empresaId;
    }

    if (queryEmpresaId) {
      const parsed = parseInt(queryEmpresaId, 10);
      if (!isNaN(parsed)) {
        if (session?.user?.role === "SUPER_ADMIN" || !session) {
          empresaId = parsed;
        }
      }
    }

    const summary = await scanAllFleetAlerts(empresaId);

    return NextResponse.json({
      success: true,
      count: summary.totalTriggered,
      results: summary,
    });
  } catch (error: any) {
    console.error("Error in GET /api/alerts/scan:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno al escanear alertas" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body
    }

    if (!session && !body.empresaId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let empresaId = 1;
    if (session?.user?.empresaId) {
      empresaId = session.user.empresaId;
    }

    if (body.empresaId) {
      const parsed = parseInt(body.empresaId, 10);
      if (!isNaN(parsed)) {
        if (session?.user?.role === "SUPER_ADMIN" || !session || !session.user.empresaId) {
          empresaId = parsed;
        }
      }
    }

    const summary = await scanAllFleetAlerts(empresaId);

    return NextResponse.json({
      success: true,
      count: summary.totalTriggered,
      results: summary,
    });
  } catch (error: any) {
    console.error("Error in POST /api/alerts/scan:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno al ejecutar escaneo de alertas" },
      { status: 500 }
    );
  }
}
