"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, FileText, Settings, ShieldAlert, FileWarning, BarChart3, Wrench, Fuel } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export function EmpresaPanel({ user, companyName, metrics, maintenanceAlerts, upcomingExpirations, chartData }: any) {
  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de {companyName || "la Empresa"}</h2>
          <p className="text-muted-foreground">Resumen operativo y alertas.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flota Registrada</CardTitle><FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics?.totalVehicles || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Calle (Turnos Activos)</CardTitle><Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{metrics?.activeShifts || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Taller (Mes)</CardTitle><Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${metrics?.monthlyMaintenanceCost || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combustible (Mes)</CardTitle><Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">${metrics?.monthlyFuelCost || 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Costos Operativos (Últimos 6 meses)</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData || []}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="combustible" stackId="a" fill="#3b82f6" name="Combustible" />
                <Bar dataKey="mantenimiento" stackId="a" fill="#f59e0b" name="Mantenimiento" />
                <Bar dataKey="multas" stackId="a" fill="#ef4444" name="Multas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="h-5 w-5 text-destructive"/> Alertas de Mantenimiento</CardTitle></CardHeader>
            <CardContent>
              {maintenanceAlerts?.length > 0 ? (
                <ul className="space-y-2">
                  {maintenanceAlerts.map((a: any, i: number) => (
                    <li key={i} className="text-sm border-l-4 border-destructive pl-2 py-1 bg-destructive/10">Vehículo <b>{a.patente}</b>: {a.reason}</li>
                  ))}
                </ul>
              ) : (<p className="text-sm text-muted-foreground">Todo en orden.</p>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><FileWarning className="h-5 w-5 text-amber-500"/> Próximos Vencimientos</CardTitle></CardHeader>
            <CardContent>
              {upcomingExpirations?.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingExpirations.map((doc: any, i: number) => (
                    <li key={i} className="text-sm border-l-4 border-amber-500 pl-2 py-1 bg-amber-500/10">Vehículo <b>{doc.patente}</b> - {doc.type}: {new Date(doc.expiryDate).toLocaleDateString()}</li>
                  ))}
                </ul>
              ) : (<p className="text-sm text-muted-foreground">Sin vencimientos cercanos.</p>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
