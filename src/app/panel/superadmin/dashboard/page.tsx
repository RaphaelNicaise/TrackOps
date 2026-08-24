import React from "react";
import { UnderConstruction, RoadmapFeature } from "@/components/superadmin/under-construction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Building2,
  Truck,
  Activity,
  TrendingUp,
  Globe2,
  BarChart3,
  Cpu,
  CreditCard,
  Radio,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";

export const metadata = {
  title: "Dashboard Global | Superadmin TrackOps",
  description: "Métricas globales SaaS, volumen de telemetría y monitoreo de inquilinos.",
};

export default function SuperadminDashboardPage() {
  const globalKpis = [
    {
      title: "MRR Proyectado",
      value: "$1.450.000 ARS",
      change: "+18.5% este mes",
      trend: "up",
      subtext: "Facturación mensual recurrente activa",
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Empresas Activas",
      value: "14 Clientes",
      change: "+2 nuevos este mes",
      trend: "up",
      subtext: "12 Enterprise · 2 Trial activo",
      icon: Building2,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Vehículos Conectados",
      value: "182 Unidades",
      change: "94.5% transmitiendo",
      trend: "up",
      subtext: "172 activos en vivo · 10 en reposo",
      icon: Truck,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Uptime Ingesta GPS",
      value: "99.98%",
      change: "~1.4M pings / día",
      trend: "neutral",
      subtext: "450 paquetes/seg promedio",
      icon: Activity,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
  ];

  const upcomingFeatures: RoadmapFeature[] = [
    {
      icon: Globe2,
      title: "Mapa Global de Flotas Multinquilino",
      description:
        "Visualización consolidada en tiempo real de todos los vehículos de todas las empresas en un único mapa interactivo con clustering espacial de alto rendimiento.",
      status: "in-progress",
      eta: "Sprint Q3 2026",
    },
    {
      icon: BarChart3,
      title: "Analítica de MRR, ARR & Churn SaaS",
      description:
        "Desglose financiero por planes (Básico, Pro, Enterprise), retención neta de ingresos (NDR), cohortes de clientes y LTV / CAC consolidado.",
      status: "in-progress",
      eta: "Sprint Q3 2026",
    },
    {
      icon: Cpu,
      title: "Detección de Anomalías de Telemetría con IA",
      description:
        "Modelos predictivos para detectar cortes anómalos de señal satelital, interferencias en dispositivos GPS y desvíos masivos entre tenants.",
      status: "planned",
      eta: "Sprint Q4 2026",
    },
    {
      icon: CreditCard,
      title: "Control de Cuotas & Auto-facturación",
      description:
        "Gestión automática de límites por empresa (vehículos máximos, cuota de almacenamiento en MinIO) y generación de facturas automáticas.",
      status: "planned",
      eta: "Sprint Q4 2026",
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              SUPERADMIN · SAAS MONITOR
            </Badge>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Telemetría en Vivo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Dashboard Global de la Plataforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Métricas operativas consolidadas, volumen de telemetría y estado financiero de clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Ingestión: 450 msg/s</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {globalKpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={index}
              className="border border-border/80 bg-card hover:border-primary/30 transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
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
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                    {kpi.change}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2 border-t pt-2 font-mono">
                  {kpi.subtext}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Under Construction Roadmap Preview */}
      <UnderConstruction
        moduleName="Dashboard Multinquilino"
        title="Panel de Métricas Consolidadas y Telemetría Global"
        subtitle="Estamos construyendo el centro de mando unificado para visualizar mapas globales de todas las flotas, análisis de retención SaaS por cohortes y alertas predictivas de consumo."
        badge="Roadmap Q3 / Q4 2026"
        progress={65}
        eta="Lanzamiento estimado: Release v1.2"
        features={upcomingFeatures}
      />
    </div>
  );
}
