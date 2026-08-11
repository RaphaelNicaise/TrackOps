import { db } from "@/db";
import { vehicles, maintenancePlans } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function getPreventativeAlerts(empresaId: number) {
  // Query to find all vehicles that have exceeded their maintenance interval
  // Condition: kilometrajeActual >= ultimoServiceKm + intervaloKm
  
  const alerts = await db.select({
    id: maintenancePlans.id,
    vehicleId: vehicles.id,
    patente: vehicles.patente,
    modelo: vehicles.modelo,
    componente: maintenancePlans.componente,
    kilometrajeActual: vehicles.kilometrajeActual,
    ultimoServiceKm: maintenancePlans.ultimoServiceKm,
    intervaloKm: maintenancePlans.intervaloKm,
  })
  .from(maintenancePlans)
  .innerJoin(vehicles, eq(maintenancePlans.vehicleId, vehicles.id))
  .where(
    and(
      eq(vehicles.empresaId, empresaId),
      sql`${vehicles.kilometrajeActual} >= ${maintenancePlans.ultimoServiceKm} + ${maintenancePlans.intervaloKm}`
    )
  );

  return alerts;
}
