import { db } from "@/db";
import { gpsInstallations, vehicles } from "@/db/schema";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { GpsFormModal } from "./GpsFormModal";
import { eq } from "drizzle-orm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createGpsInstallation, updateGpsInstallationStatus } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default async function InstalacionesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const role = session.user.role;
  if (role !== "SUPER_ADMIN" && role !== "VENDEDOR_INSTALADOR") {
    redirect("/dashboard");
  }

  // Fetch installations and vehicles
  const installations = await db
    .select({
      id: gpsInstallations.id,
      dispositivoModelo: gpsInstallations.dispositivoModelo,
      dispositivoSerial: gpsInstallations.dispositivoSerial,
      estado: gpsInstallations.estado,
      fechaInstalacion: gpsInstallations.fechaInstalacion,
      notas: gpsInstallations.notas,
      patente: vehicles.patente,
    })
    .from(gpsInstallations)
    .leftJoin(vehicles, eq(gpsInstallations.vehicleId, vehicles.id));
    
  const allVehicles = await db.select().from(vehicles);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Instalaciones GPS</h1>
        
        <GpsFormModal vehicles={allVehicles} />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehículo</TableHead>
              <TableHead>Dispositivo</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {installations.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell>{inst.patente}</TableCell>
                <TableCell>{inst.dispositivoModelo}</TableCell>
                <TableCell>{inst.dispositivoSerial}</TableCell>
                <TableCell>
                  <Badge variant={inst.estado === "instalado" ? "default" : inst.estado === "con_falla" ? "destructive" : "secondary"}>
                    {inst.estado}
                  </Badge>
                </TableCell>
                <TableCell>{inst.fechaInstalacion ? new Date(inst.fechaInstalacion).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell>{inst.notas}</TableCell>
                <TableCell>
                  <form action={updateGpsInstallationStatus} className="flex gap-2">
                    <input type="hidden" name="id" value={inst.id} />
                    <select name="estado" defaultValue={inst.estado!} className="border rounded px-2 py-1 text-sm">
                      <option value="pendiente">Pendiente</option>
                      <option value="instalado">Instalado</option>
                      <option value="con_falla">Con Falla</option>
                    </select>
                    <Button type="submit" size="sm" variant="outline">Actualizar</Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {installations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay instalaciones registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
