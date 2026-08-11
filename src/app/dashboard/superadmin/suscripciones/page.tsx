import { db } from "@/db";
import { subscriptionPlans, empresas } from "@/db/schema";
import { RequireRole } from "@/components/auth/RequireRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NewSuscripcionDialog } from "./NewSuscripcionDialog";
import { AssignSuscripcionDialog } from "./AssignSuscripcionDialog";
import { auth } from "@/auth";

export default async function SuscripcionesPage() {
  const session = await auth();
  const role = session?.user?.role as any;

  const allPlanes = await db.select().from(subscriptionPlans);
  const allEmpresas = await db.select({ id: empresas.id, nombre: empresas.nombre }).from(empresas);

  return (
    <RequireRole userRole={role} allowedRoles={["SUPER_ADMIN"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suscripciones</h1>
            <p className="text-muted-foreground mt-2">
              Gestión de planes y asignaciones para empresas.
            </p>
          </div>
          <div className="flex gap-2">
            <AssignSuscripcionDialog 
              planes={allPlanes.filter(p => p.activo === 1)} 
              empresas={allEmpresas} 
            />
            <NewSuscripcionDialog />
          </div>
        </div>

        <Card className="rounded-xl shadow-sm border-none bg-white">
          <CardHeader>
            <CardTitle>Planes Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Max Vehículos</TableHead>
                  <TableHead>Precio Mensual</TableHead>
                  <TableHead>Precio Anual</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPlanes.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.nombre}</TableCell>
                    <TableCell>{plan.maxVehiculos}</TableCell>
                    <TableCell>${plan.precioMensual.toLocaleString("es-AR")}</TableCell>
                    <TableCell>
                      {plan.precioAnual ? `$${plan.precioAnual.toLocaleString("es-AR")}` : "-"}
                    </TableCell>
                    <TableCell>
                      {plan.activo === 1 ? (
                        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Activo</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Inactivo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {allPlanes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No hay planes registrados
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
