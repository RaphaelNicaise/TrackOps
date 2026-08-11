import { RequireRole } from "@/components/auth/RequireRole";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Settings, Search, Upload, Download } from "lucide-react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { importVehiclesCSV } from "@/lib/import-actions";
import { FlotaFormModal } from "./FlotaFormModal";

export default async function FlotaPage() {
  const session = await auth();
  const role = session?.user?.role;
  const empresaId = session?.user?.empresaId;

  let myVehicles: any[] = [];
  if (empresaId) {
    myVehicles = await db.select().from(vehicles).where(eq(vehicles.empresaId, empresaId)).orderBy(desc(vehicles.createdAt));
  } else if (role === "SUPER_ADMIN") {
    myVehicles = await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground mt-2">Gestión de la flota, altas masivas y estado actual.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <a href="/api/export?type=flota" target="_blank" className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium">
            <Download className="h-4 w-4" /> Exportar CSV
          </a>

          <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA"]}>
            <form action={importVehiclesCSV} className="flex gap-2 items-center bg-muted p-2 rounded border border-border">
              <input type="file" name="csvFile" accept=".csv" required className="text-sm max-w-[200px]" />
              <Button type="submit" size="sm" variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Alta Masiva
              </Button>
            </form>
          </RequireRole>

          <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "VENDEDOR_INSTALADOR"]}>
            <Button variant="outline" className="bg-white">
              <Settings className="mr-2 h-4 w-4" /> Configurar GPS Hardware
            </Button>
          </RequireRole>

          <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN", "ADMIN_EMPRESA"]}>
            <FlotaFormModal />
          </RequireRole>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patente</TableHead><TableHead>Chasis</TableHead><TableHead>Marca y Modelo</TableHead><TableHead>Año</TableHead><TableHead>Kilometraje</TableHead><TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myVehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground/50" />
                    <span>No hay vehículos registrados en este tenant.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              myVehicles.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.patente}</TableCell>
                  <TableCell>{v.chasis || "-"}</TableCell>
                  <TableCell>{v.marca} {v.modelo}</TableCell>
                  <TableCell>{v.anio}</TableCell>
                  <TableCell>{v.kilometrajeActual} km</TableCell>
                  <TableCell className="capitalize">{v.tipo}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
