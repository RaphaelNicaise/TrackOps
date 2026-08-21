import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptionPlans } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FALLBACK = [
  { id: 1, nombre: "Inicial", minVehiculos: 1, maxVehiculos: 5, precioMensual: 39990, precioAnual: 399900, activo: 1 },
  { id: 2, nombre: "Crecimiento", minVehiculos: 6, maxVehiculos: 15, precioMensual: 64900, precioAnual: 649000, activo: 1 },
  { id: 3, nombre: "Consolidada", minVehiculos: 16, maxVehiculos: 30, precioMensual: 99900, precioAnual: 999000, activo: 1 },
  { id: 4, nombre: "Masiva", minVehiculos: 31, maxVehiculos: 49, precioMensual: 149900, precioAnual: 1499000, activo: 1 },
  { id: 5, nombre: "Enterprise", minVehiculos: 50, maxVehiculos: null, precioMensual: 199900, precioAnual: 1999000, activo: 1 },
];

export async function GET() {
  try {
    const plans = await db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.minVehiculos));
    if (plans && plans.length > 0) return NextResponse.json(plans);
    return NextResponse.json(FALLBACK);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
