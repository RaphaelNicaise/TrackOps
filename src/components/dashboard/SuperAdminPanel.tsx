import { db } from "@/db";
import { 
  empresas, 
  vehicles, 
  subscriptionPlans, 
  empresaSubscriptions 
} from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Building2, Car, CreditCard, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default async function SuperAdminPanel() {
  // Queries
  const totalEmpresasQuery = await db.select({ count: count() }).from(empresas);
  const totalVehiclesQuery = await db.select({ count: count() }).from(vehicles);
  
  const empresasConSuscripcion = await db
    .select({
      id: empresas.id,
      nombre: empresas.nombre,
      cuit: empresas.cuit,
      createdAt: empresas.createdAt,
      planNombre: subscriptionPlans.nombre,
      estadoSuscripcion: empresaSubscriptions.estado,
      precioMensual: subscriptionPlans.precioMensual,
    })
    .from(empresas)
    .leftJoin(empresaSubscriptions, eq(empresas.id, empresaSubscriptions.empresaId))
    .leftJoin(subscriptionPlans, eq(empresaSubscriptions.planId, subscriptionPlans.id));

  // Get vehicle count per empresa
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

  const totalEmpresas = totalEmpresasQuery?.[0]?.count || 0;
  const totalVehicles = totalVehiclesQuery?.[0]?.count || 0;
  const activas = empresasConSuscripcion.filter(e => e.estadoSuscripcion === "activa").length;
  const mrrEstimado = empresasConSuscripcion
    .filter(e => e.estadoSuscripcion === "activa")
    .reduce((sum, e) => sum + (e.precioMensual || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Empresas</CardTitle>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEmpresas}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vehículos</CardTitle>
            <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <Car className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVehicles}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Empresas Activas</CardTitle>
            <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activas}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-none bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR Estimado</CardTitle>
            <div className="h-10 w-10 bg-violet-100 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${mrrEstimado.toLocaleString("es-AR")}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm border-none bg-white">
        <CardHeader>
          <CardTitle>Listado de Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>CUIT</TableHead>
                <TableHead>Vehículos</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {empresasConSuscripcion.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.nombre}</TableCell>
                  <TableCell>{emp.cuit || "-"}</TableCell>
                  <TableCell>{vehicleCountMap[emp.id] || 0}</TableCell>
                  <TableCell>{emp.planNombre || "Sin plan"}</TableCell>
                  <TableCell>
                    {emp.estadoSuscripcion === "activa" ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Activa</Badge>
                    ) : emp.estadoSuscripcion === "suspendida" ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Suspendida</Badge>
                    ) : emp.estadoSuscripcion === "cancelada" ? (
                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelada</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">Inactiva</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(emp.createdAt), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
