import React from "react";
import { UnderConstruction, RoadmapFeature } from "@/components/superadmin/under-construction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Database,
  Radio,
  HardDrive,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  Bell,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export const metadata = {
  title: "Alertas & Salud del Sistema | Superadmin TrackOps",
  description: "Monitoreo de estado de infraestructura, microservicios, bases de datos y tuberías de ingestión.",
};

export default function SuperadminAlertasPage() {
  const systemServices = [
    {
      name: "API Backend (Next.js)",
      category: "Aplicación & Core",
      status: "Operativo",
      latency: "42 ms",
      uptime: "99.99%",
      detail: "Versión v1.4.0 · Node.js runtime",
      icon: Server,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      name: "Base de Datos PostGIS",
      category: "Almacenamiento Espacial",
      status: "Operativo",
      latency: "12 ms",
      uptime: "100%",
      detail: "Pool: 18/100 · Tamaño: 4.8 GB",
      icon: Database,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      name: "GPS Streamer & Ingestion",
      category: "Tubería de Telemetría",
      status: "Operativo",
      latency: "8 ms",
      uptime: "99.98%",
      detail: "450 msg/s · Cola: 0 pendientes",
      icon: Radio,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      name: "MinIO Object Storage (S3)",
      category: "Almacenamiento Documentos",
      status: "Operativo",
      latency: "19 ms",
      uptime: "100%",
      detail: "Uso: 82.4 GB · 4 Buckets activos",
      icon: HardDrive,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
    },
    {
      name: "Servicio de Autenticación",
      category: "Seguridad & Sesiones",
      status: "Operativo",
      latency: "25 ms",
      uptime: "100%",
      detail: "24 sesiones activas · JWT Expiry: OK",
      icon: ShieldCheck,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
    },
    {
      name: "Umami Analytics",
      category: "Telemetría de Uso & Web",
      status: "Operativo",
      latency: "35 ms",
      uptime: "99.95%",
      detail: "320 eventos/min · Puerto :3002",
      icon: BarChart3,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
    },
  ];

  const upcomingAlertFeatures: RoadmapFeature[] = [
    {
      icon: Bell,
      title: "Webhooks de Alerta en Tiempo Real",
      description:
        "Disparadores configurables para notificar caídas de microservicios, saturación de colas o errores 5xx a través de Slack, Telegram, Discord y PagerDuty.",
      status: "in-progress",
      eta: "Sprint Q3 2026",
    },
    {
      icon: Zap,
      title: "Auto-healing y Recuperación de Stream GPS",
      description:
        "Protocolos de reinicio automático y reconexión de sockets TCP/UDP ante anomalías en la tasa de ingestión o desconexión masiva de dispositivos.",
      status: "in-progress",
      eta: "Sprint Q4 2026",
    },
    {
      icon: AlertTriangle,
      title: "Alertas de Exceso de Cuota por Tenant",
      description:
        "Detección proactiva y notificaciones cuando una empresa se acerca al límite contratado de vehículos, solicitudes de geocodificación o almacenamiento S3.",
      status: "planned",
      eta: "Sprint Q4 2026",
    },
    {
      icon: Database,
      title: "Monitor de Failover & Replicación de DB",
      description:
        "Supervisión del estado de réplicas de lectura en PostgreSQL, lag de replicación y pruebas periódicas de recuperación de snapshots en frío.",
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
              SUPERADMIN · DEV & OPS
            </Badge>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              6 / 6 Servicios Operativos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Alertas & Salud del Sistema
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo de infraestructura distribuida, microservicios, bases de datos y tuberías de ingestión.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Infraestructura 100% Estable</span>
          </div>
        </div>
      </div>

      {/* System Health Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Estado de Componentes de Infraestructura
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            Actualizado en tiempo real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="border border-border/80 bg-card hover:border-primary/30 transition-all duration-200"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {service.name}
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {service.category}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg ${service.bgColor} ${service.color} border ${service.borderColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {service.status}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <span>Lat: <strong className="text-foreground">{service.latency}</strong></span>
                      <span>•</span>
                      <span>Up: <strong className="text-foreground">{service.uptime}</strong></span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground border-t pt-2.5 font-mono">
                    {service.detail}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Under Construction Roadmap Preview */}
      <UnderConstruction
        moduleName="Alertas e Incidentes Globales"
        title="Sistema Automatizado de Alertas de Infraestructura y Disparadores"
        subtitle="Próximamente se integrarán reglas de notificación automática multicanal, auto-healing de servicios de ingestión y gestión centralizada de incidentes críticos."
        badge="Roadmap Q3 / Q4 2026"
        progress={50}
        eta="Lanzamiento estimado: Release v1.3"
        features={upcomingAlertFeatures}
      />
    </div>
  );
}
