import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptionPlans } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const FALLBACK = [
  { id: 1, nombre: "Inicial", minVehiculos: 1, maxVehiculos: 5, precioMensual: 14900, precioAnual: 149000, activo: 1 },
  { id: 2, nombre: "Crecimiento", minVehiculos: 6, maxVehiculos: 15, precioMensual: 12500, precioAnual: 125000, activo: 1 },
  { id: 3, nombre: "Consolidada", minVehiculos: 16, maxVehiculos: 30, precioMensual: 10500, precioAnual: 105000, activo: 1 },
  { id: 4, nombre: "Masiva", minVehiculos: 31, maxVehiculos: 49, precioMensual: 8900, precioAnual: 89000, activo: 1 },
  { id: 5, nombre: "Enterprise", minVehiculos: 50, maxVehiculos: null, precioMensual: 0, precioAnual: 0, activo: 1 },
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
