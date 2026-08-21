import React from "react";
import Link from "next/link";
import { getTenantOnboardingStatus } from "@/lib/onboarding-actions";
import { getEffectiveTenantContext } from "@/lib/impersonation";
import { OnboardingSetupCard } from "@/components/dashboard/onboarding-setup-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Users,
  Bell,
  Wrench,
  Activity,
  MapPin,
  FileText,
  Fuel,
  ArrowRight,
  Radio,
  Sparkles,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/db";
import { vehicles, alertLogs, users, maintenancePlans } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard de Monitoreo | TrackOps",
  description: "Centro de control operativo, telemetría y estado de flota en tiempo real.",
};

export default async function MonitoreoDashboardPage() {
  const onboardingStatus = await getTenantOnboardingStatus();
  const tenantContext = await getEffectiveTenantContext();

  const empresaId = tenantContext?.empresaId;
  const empresaNombre = tenantContext?.empresaNombre || onboardingStatus?.empresaNombre || "Mi Empresa";

  // Fetch quick metrics for the dashboard
  let totalVehicles = onboardingStatus?.counts.vehicles ?? 0;
  let totalUsers = onboardingStatus?.counts.users ?? 0;
  let totalMaintenancePlans = onboardingStatus?.counts.maintenancePlans ?? 0;
  let recentAlerts: any[] = [];
  let alertCount = 0;

  if (empresaId) {
    try {
      const [alertsCountResult] = await db
        .select({ count: count() })
        .from(alertLogs)
        .where(eq(alertLogs.empresaId, empresaId));
      alertCount = Number(alertsCountResult?.count ?? 0);

      recentAlerts = await db
        .select()
        .from(alertLogs)
        .where(eq(alertLogs.empresaId, empresaId))
        .orderBy(desc(alertLogs.createdAt))
        .limit(4);
    } catch (e) {
      console.warn("Could not fetch extra dashboard metrics:", e);
    }
  }

  const kpis = [
    {
      title: "Flota de Vehículos",
      value: totalVehicles === 1 ? "1 Unidad" : `${totalVehicles} Unidades`,
      subtext: totalVehicles > 0 ? "Monitoreadas en el sistema" : "Sin unidades registradas",
      icon: Truck,
      href: "/panel/control-flota/vehiculos",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Equipo y Choferes",
      value: totalUsers === 1 ? "1 Usuario" : `${totalUsers} Miembros`,
      subtext: totalUsers > 1 ? "Operadores asignados" : "Solo administrador",
      icon: Users,
      href: "/panel/administracion/usuarios",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Planes de Mantenimiento",
      value: totalMaintenancePlans === 1 ? "1 Plan" : `${totalMaintenancePlans} Planes`,
      subtext: totalMaintenancePlans > 0 ? "Reglas preventivas activas" : "Pendiente de configuración",
      icon: Wrench,
      href: "/panel/control-flota/mantenimiento",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Alertas Despachadas",
      value: `${alertCount} Notificaciones`,
      subtext: "WhatsApp y Email emitidos",
      icon: Bell,
      href: "/panel/monitoreo/alertas",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              OPERACIONES · MONITOREO
            </Badge>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Telemetría Operativa
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Panel de {empresaNombre}
          </h1>
          <p className="text-sm text-muted-foreground">
            Control de flota en tiempo real, alertas preventivas y estado operativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/panel/mapa">
            <Button size="sm" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              Ver Mapa en Vivo
            </Button>
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist Card (shown if setup is not completed) */}
      {onboardingStatus && !onboardingStatus.isCompleted && (
        <OnboardingSetupCard status={onboardingStatus} />
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Link key={index} href={kpi.href} className="block group">
              <Card className="border border-border/80 bg-card hover:border-primary/40 hover:shadow-xs transition-all duration-200 h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {kpi.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${kpi.bgColor} ${kpi.color} border ${kpi.borderColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {kpi.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{kpi.subtext}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-primary" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Main Grid: Shortcuts & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Operational Modules */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Acceso Rápido a Módulos</CardTitle>
                  <CardDescription className="text-xs">
                    Herramientas de gestión y control directo de unidades
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0">
              <Link
                href="/panel/control-flota/vehiculos"
                className="p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Inventario de Vehículos
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fichas técnicas, odómetro, asignación de choferes y documentación digital.
                  </p>
                </div>
              </Link>

              <Link
                href="/panel/control-flota/mantenimiento"
                className="p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Mantenimiento Preventivo
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Intervalos de kilometraje, alertas tempranas y registro histórico de taller.
                  </p>
                </div>
              </Link>

              <Link
                href="/panel/control-flota/combustible"
                className="p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                  <Fuel className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Control de Combustible
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Carga de tickets de combustible, cálculo de consumo promedio por km y costos.
                  </p>
                </div>
              </Link>

              <Link
                href="/panel/control-flota/geocercas"
                className="p-3.5 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-start gap-3 group"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    Geocercas & Zonas Seguras
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Delimitación de depósitos, clientes y rutas con alertas de entrada/salida.
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Recent Alerts */}
        <div className="space-y-4">
          <Card className="border border-border/80 h-full flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Últimas Alertas
                  </CardTitle>
                  <Link href="/panel/monitoreo/alertas">
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                      Ver todas
                    </Button>
                  </Link>
                </div>
                <CardDescription className="text-xs">
                  Eventos y avisos generados para tu flota
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {recentAlerts.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentAlerts.map((alert: any) => (
                      <div
                        key={alert.id}
                        className="p-2.5 rounded-lg border border-border/60 bg-background text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate max-w-[180px]">
                            {alert.titulo}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">
                            {alert.modulo}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2">
                          {alert.mensaje}
                        </p>
                        {alert.patente && (
                          <div className="text-[11px] font-mono text-primary pt-0.5">
                            Patente: {alert.patente}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground space-y-2">
                    <ShieldCheck className="h-8 w-8 mx-auto text-muted-foreground/60" />
                    <p className="text-xs">Sin alertas recientes registradas.</p>
                    <p className="text-[11px] text-muted-foreground/80">
                      Los avisos de service y eventos satelitales se listarán aquí.
                    </p>
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-4 pt-0 border-t border-border/40 mt-auto">
              <Link href="/panel/administracion/configuracion" className="w-full">
                <Button variant="outline" size="sm" className="w-full text-xs gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  Configurar Canales WhatsApp / Email
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
