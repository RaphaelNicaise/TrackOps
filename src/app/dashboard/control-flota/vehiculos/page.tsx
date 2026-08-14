import { auth } from "@/auth";
import { db } from "@/db";
import { vehicles, documents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { mockVehiculos } from "@/lib/mock-vehicles";
import { VehiculosTable } from "@/components/dashboard/vehiculos/vehiculos-table";

export const dynamic = "force-dynamic";

export default async function VehiculosPage() {
  let rows;

  try {
    const session = await auth();
    const empresaId = session?.user?.empresaId;

    rows = await db
      .select({
        id: vehicles.id,
        patente: vehicles.patente,
        marca: vehicles.marca,
        modelo: vehicles.modelo,
        anio: vehicles.anio,
        tipo: vehicles.tipo,
        chasis: vehicles.chasis,
        kilometrajeActual: vehicles.kilometrajeActual,
        rto: vehicles.rto,
        docCount: sql<number>`count(${documents.id})`,
      })
      .from(vehicles)
      .leftJoin(documents, eq(documents.vehicleId, vehicles.id))
      .where(empresaId ? eq(vehicles.empresaId, empresaId) : undefined)
      .groupBy(vehicles.id)
      .orderBy(vehicles.patente);
  } catch {
    rows = mockVehiculos;
  }

  return <VehiculosTable vehicles={rows} />;
}