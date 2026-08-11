import { db } from "@/db";
import { empresas, vehicles, empresaSubscriptions } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { RequireRole } from "@/components/auth/RequireRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NewEmpresaDialog } from "./NewEmpresaDialog";
import { auth } from "@/auth";

export default async function EmpresasPage() {
  const session = await auth();
  const role = session?.user?.role as any;

  const allEmpresas = await db
    .select({
      id: empresas.id,
      nombre: empresas.nombre,
      cuit: empresas.cuit,
      createdAt: empresas.createdAt,
      estadoSuscripcion: empresaSubscriptions.estado,
    })
    .from(empresas)
    .leftJoin(empresaSubscriptions, eq(empresas.id, empresaSubscriptions.empresaId));

  const vehiculosPorEmpresa = await db
    .select({
      empresaId: vehicles.empresaId,
      count: count(vehicles.id),
    })
    .from(vehicles)
    .groupBy(vehicles.empresaId);

  const vehicleCountMap = vehiculosPorEmpresa.reduce((acc, curr) => {
    acc[curr.empresaId] = curr.count;
    return acc;
  }, {} as Record<number, number>);

  return (
    <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
            <p className="text-muted-foreground mt-2">
              Gestión de empresas registradas en la plataforma.
            </p>
          </div>
          
          <NewEmpresaDialog />
        </div>

        <Card className="rounded-xl shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Listado Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Vehículos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEmpresas.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.nombre}</TableCell>
                    <TableCell>{emp.cuit || "-"}</TableCell>
                    <TableCell>{vehicleCountMap[emp.id] || 0}</TableCell>
                    <TableCell>
                      {emp.estadoSuscripcion === "activa" ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Activa</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(emp.createdAt), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
                {allEmpresas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No hay empresas registradas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </RequireRole>
  );
}
