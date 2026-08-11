import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { db } from "@/db";
import { maintenanceLogs, vehicles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { MaintenanceFormModal } from "./MaintenanceFormModal";

export default async function MantenimientoPage() {
  const session = await auth();
  const role = session?.user?.role;
  const empresaId = session?.user?.empresaId;

  let logs: any[] = [];
  let myVehicles: any[] = [];
  
  if (empresaId) {
    myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, empresaId));
    logs = await db.select({
      id: maintenanceLogs.id,
      fecha: maintenanceLogs.fecha,
      taller: maintenanceLogs.taller,
      descripcion: maintenanceLogs.descripcion,
      costo: maintenanceLogs.costo,
      kilometraje: maintenanceLogs.kilometraje,
      vehicle: { patente: vehicles.patente, marca: vehicles.marca, modelo: vehicles.modelo }
    }).from(maintenanceLogs)
      .leftJoin(vehicles, eq(maintenanceLogs.vehicleId, vehicles.id))
      .where(eq(vehicles.empresaId, empresaId))
      .orderBy(desc(maintenanceLogs.fecha));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mantenimiento</h1>
          <p className="text-muted-foreground mt-2">Registro de servicios y reparaciones.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA"]}>
            <MaintenanceFormModal vehicles={myVehicles} />
          </RequireRole>
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead><TableHead>Vehículo</TableHead><TableHead>Taller</TableHead>
              <TableHead>Descripción</TableHead><TableHead>Costo</TableHead><TableHead>Kilometraje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <span>No hay registros.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{new Date(log.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>{log.vehicle?.patente} - {log.vehicle?.marca} {log.vehicle?.modelo}</TableCell>
                  <TableCell className="capitalize">{log.taller}</TableCell>
                  <TableCell>{log.descripcion}</TableCell>
                  <TableCell>${log.costo}</TableCell>
                  <TableCell>{log.kilometraje} km</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
