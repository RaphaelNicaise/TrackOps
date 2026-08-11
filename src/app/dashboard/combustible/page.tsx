import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { db } from "@/db";
import { fuelTickets, vehicles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { FuelFormModal } from "./FuelFormModal";

export default async function CombustiblePage() {
  const session = await auth();
  const role = session?.user?.role;
  const empresaId = session?.user?.empresaId;

  let tickets: any[] = [];
  let myVehicles: any[] = [];
  
  if (empresaId) {
    myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, empresaId));
    tickets = await db.select({
      id: fuelTickets.id,
      fecha: fuelTickets.fecha,
      litros: fuelTickets.litros,
      costoTotal: fuelTickets.costoTotal,
      ticketUrl: fuelTickets.ticketUrl,
      vehicle: { patente: vehicles.patente, marca: vehicles.marca, modelo: vehicles.modelo }
    }).from(fuelTickets)
      .leftJoin(vehicles, eq(fuelTickets.vehicleId, vehicles.id))
      .where(eq(vehicles.empresaId, empresaId))
      .orderBy(desc(fuelTickets.fecha));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Combustible</h1>
          <p className="text-muted-foreground mt-2">Registro de cargas de combustible.</p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA", "CHOFER"]}>
            <FuelFormModal vehicles={myVehicles} />
          </RequireRole>
        </div>
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead><TableHead>Vehículo</TableHead><TableHead>Litros</TableHead><TableHead>Costo</TableHead><TableHead>Ticket</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  <Search className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <span>No hay cargas.</span>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{new Date(t.fecha).toLocaleDateString()}</TableCell>
                  <TableCell>{t.vehicle?.patente}</TableCell>
                  <TableCell>{t.litros} L</TableCell>
                  <TableCell>${t.costoTotal}</TableCell>
                  <TableCell>{t.ticketUrl ? <a href={t.ticketUrl} className="text-blue-500">Ver</a> : "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
