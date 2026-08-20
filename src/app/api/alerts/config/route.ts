import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAlertConfigAction, saveAlertConfigAction } from "@/lib/alert-config-actions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      // Session fallback
    }

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const empresaIdParam = searchParams.get("empresaId");
    const targetEmpresaId = empresaIdParam ? parseInt(empresaIdParam, 10) : undefined;

    const config = await getAlertConfigAction(targetEmpresaId);
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Error fetching alert config:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener configuración de alertas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    let session = null;
    try {
      session = await auth();
    } catch {
      // Session fallback
    }

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = await saveAlertConfigAction(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error saving alert config:", error);
    return NextResponse.json(
      { error: error.message || "Error al guardar configuración de alertas" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
